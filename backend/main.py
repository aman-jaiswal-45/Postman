import time
import re
import json
import base64
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import httpx
from datetime import datetime

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Postman Clone API Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def resolve_variables(text: Optional[str], variables: Dict[str, str]) -> str:
    if not text:
        return ""
    def replace(match):
        var_name = match.group(1).strip()
        return variables.get(var_name, match.group(0))
    return re.sub(r'\{\{([^}]+)\}\}', replace, text)

def resolve_object_variables(obj: Any, variables: Dict[str, str]) -> Any:
    if isinstance(obj, str):
        return resolve_variables(obj, variables)
    elif isinstance(obj, dict):
        return {k: resolve_object_variables(v, variables) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [resolve_object_variables(v, variables) for v in obj]
    return obj

@app.get("/")
def read_root():
    return {"status": "running", "service": "Postman Clone Backend proxy API"}


@app.post("/api/send", response_model=schemas.RequestSendResponse)
def send_request(payload: schemas.RequestSendPayload, db: Session = Depends(get_db)):
    variables = {}
    if payload.environment_id:
        db_vars = db.query(models.EnvironmentVariable).filter(
            models.EnvironmentVariable.environment_id == payload.environment_id,
            models.EnvironmentVariable.enabled == True
        ).all()
        variables = {v.key: v.value for v in db_vars}
    
    resolved_url = resolve_variables(payload.url, variables)
    if not resolved_url.startswith(("http://", "https://")):
        resolved_url = "http://" + resolved_url

    try:
        raw_params = json.loads(payload.params or "[]")
    except Exception:
        raw_params = []
    
    query_params = []
    for item in raw_params:
        if item.get("enabled", True) and item.get("key"):
            key = resolve_variables(item["key"], variables)
            value = resolve_variables(item.get("value", ""), variables)
            query_params.append((key, value))

    try:
        raw_headers = json.loads(payload.headers or "[]")
    except Exception:
        raw_headers = []
        
    headers_dict = {}
    for item in raw_headers:
        if item.get("enabled", True) and item.get("key"):
            key = resolve_variables(item["key"], variables)
            value = resolve_variables(item.get("value", ""), variables)
            headers_dict[key] = value

    auth_type = payload.auth_type
    try:
        auth_config = json.loads(payload.auth_config or "{}")
    except Exception:
        auth_config = {}
        
    resolved_auth_config = resolve_object_variables(auth_config, variables)
    
    if auth_type == "bearer" and resolved_auth_config.get("token"):
        headers_dict["Authorization"] = f"Bearer {resolved_auth_config['token']}"
    elif auth_type == "basic" and (resolved_auth_config.get("username") or resolved_auth_config.get("password")):
        username = resolved_auth_config.get("username", "")
        password = resolved_auth_config.get("password", "")
        auth_str = f"{username}:{password}"
        b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        headers_dict["Authorization"] = f"Basic {b64_auth}"

    body_type = payload.body_type
    content = None
    data = None
    files = None

    if body_type == "raw" and payload.body_raw:
        content = resolve_variables(payload.body_raw, variables).encode("utf-8")
    elif body_type == "x-www-form-urlencoded":
        try:
            raw_url_encoded = json.loads(payload.body_urlencoded or "[]")
        except Exception:
            raw_url_encoded = []
        data = {}
        for item in raw_url_encoded:
            if item.get("enabled", True) and item.get("key"):
                key = resolve_variables(item["key"], variables)
                value = resolve_variables(item.get("value", ""), variables)
                data[key] = value
    elif body_type == "form-data":
        try:
            raw_form_data = json.loads(payload.body_form_data or "[]")
        except Exception:
            raw_form_data = []
        data = {}
        for item in raw_form_data:
            if item.get("enabled", True) and item.get("key"):
                key = resolve_variables(item["key"], variables)
                value = resolve_variables(item.get("value", ""), variables)
                data[key] = value

    start_time = time.time()
    response_status = None
    response_body = ""
    response_headers = {}
    response_time_ms = 0
    response_size_bytes = 0
    status_text = "Unknown"

    client = httpx.Client(timeout=30.0, follow_redirects=True)
    try:
        req = client.build_request(
            method=payload.method.upper(),
            url=resolved_url,
            params=query_params,
            headers=headers_dict,
            content=content,
            data=data,
        )
        
        resp = client.send(req)
        
        response_time_ms = int((time.time() - start_time) * 1000)
        response_status = resp.status_code
        status_text = resp.reason_phrase
        response_body = resp.text
        response_headers = dict(resp.headers)
        response_size_bytes = len(resp.content)
        
    except httpx.TimeoutException as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        response_status = 504
        status_text = "Gateway Timeout"
        response_body = f"Error: Request timed out. Details: {str(e)}"
        response_headers = {"Content-Type": "text/plain"}
        response_size_bytes = len(response_body)
    except httpx.RequestError as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        response_status = 0  
        status_text = "Network Error"
        response_body = f"Error: Could not send request. Connection failed or host unresolved.\nDetails: {str(e)}"
        response_headers = {"Content-Type": "text/plain"}
        response_size_bytes = len(response_body)
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        response_status = 500
        status_text = "Internal Server Error"
        response_body = f"Error: An unexpected error occurred.\nDetails: {str(e)}"
        response_headers = {"Content-Type": "text/plain"}
        response_size_bytes = len(response_body)
    finally:
        client.close()

    history_id = None
    if payload.save_to_history:
        url_path = payload.url.split("?")[0] if payload.url else ""
        name = f"{payload.method.upper()} {url_path}"
        
        db_history = models.History(
            name=name,
            method=payload.method,
            url=payload.url,
            headers=payload.headers,
            params=payload.params,
            body_type=payload.body_type,
            body_raw=payload.body_raw,
            body_form_data=payload.body_form_data,
            body_urlencoded=payload.body_urlencoded,
            auth_type=payload.auth_type,
            auth_config=payload.auth_config,
            response_status=response_status,
            response_time_ms=response_time_ms,
            response_size_bytes=response_size_bytes,
            response_headers=json.dumps(response_headers),
            response_body=response_body,
        )
        db.add(db_history)
        db.commit()
        db.refresh(db_history)
        history_id = db_history.id

    return schemas.RequestSendResponse(
        status_code=response_status,
        status_text=status_text,
        time_ms=response_time_ms,
        size_bytes=response_size_bytes,
        headers=response_headers,
        body=response_body,
        history_id=history_id
    )


@app.get("/api/collections", response_model=List[schemas.Collection])
def get_collections(db: Session = Depends(get_db)):
    return db.query(models.Collection).order_by(models.Collection.created_at.desc()).all()

@app.post("/api/collections", response_model=schemas.Collection)
def create_collection(collection: schemas.CollectionCreate, db: Session = Depends(get_db)):
    db_collection = models.Collection(name=collection.name, description=collection.description)
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@app.put("/api/collections/{collection_id}", response_model=schemas.Collection)
def update_collection(collection_id: int, collection: schemas.CollectionUpdate, db: Session = Depends(get_db)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if collection.name is not None:
        db_collection.name = collection.name
    if collection.description is not None:
        db_collection.description = collection.description
    db.commit()
    db.refresh(db_collection)
    return db_collection

@app.delete("/api/collections/{collection_id}")
def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    db.delete(db_collection)
    db.commit()
    return {"message": f"Collection {collection_id} deleted successfully"}


@app.post("/api/collections/{collection_id}/requests", response_model=schemas.Request)
def create_request_in_collection(collection_id: int, request: schemas.RequestCreate, db: Session = Depends(get_db)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    db_request = models.Request(
        collection_id=collection_id,
        name=request.name,
        method=request.method,
        url=request.url,
        headers=request.headers,
        params=request.params,
        body_type=request.body_type,
        body_raw=request.body_raw,
        body_form_data=request.body_form_data,
        body_urlencoded=request.body_urlencoded,
        auth_type=request.auth_type,
        auth_config=request.auth_config
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    db_collection.updated_at = datetime.utcnow()
    db.commit()
    
    return db_request

@app.get("/api/requests/{request_id}", response_model=schemas.Request)
def get_request(request_id: int, db: Session = Depends(get_db)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    return db_request

@app.put("/api/requests/{request_id}", response_model=schemas.Request)
def update_request(request_id: int, request: schemas.RequestUpdate, db: Session = Depends(get_db)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_request, key, value)
        
    db.commit()
    db.refresh(db_request)
    
    if db_request.collection_id:
        db_collection = db.query(models.Collection).filter(models.Collection.id == db_request.collection_id).first()
        if db_collection:
            db_collection.updated_at = datetime.utcnow()
            db.commit()
            
    return db_request

@app.delete("/api/requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db)):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(db_request)
    db.commit()
    return {"message": f"Request {request_id} deleted successfully"}


@app.get("/api/environments", response_model=List[schemas.Environment])
def get_environments(db: Session = Depends(get_db)):
    return db.query(models.Environment).all()

@app.post("/api/environments", response_model=schemas.Environment)
def create_environment(env: schemas.EnvironmentCreate, db: Session = Depends(get_db)):
    db_env = models.Environment(name=env.name)
    db.add(db_env)
    db.commit()
    db.refresh(db_env)
    
    if env.variables:
        for var in env.variables:
            db_var = models.EnvironmentVariable(
                environment_id=db_env.id,
                key=var.key,
                value=var.value,
                enabled=var.enabled
            )
            db.add(db_var)
        db.commit()
        db.refresh(db_env)
        
    return db_env

@app.put("/api/environments/{env_id}", response_model=schemas.Environment)
def update_environment(env_id: int, env: schemas.EnvironmentUpdate, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    if env.name is not None:
        db_env.name = env.name
        
    if env.variables is not None:
        db.query(models.EnvironmentVariable).filter(models.EnvironmentVariable.environment_id == env_id).delete()
        for var in env.variables:
            db_var = models.EnvironmentVariable(
                environment_id=env_id,
                key=var.key,
                value=var.value,
                enabled=var.enabled
            )
            db.add(db_var)
            
    db.commit()
    db.refresh(db_env)
    return db_env

@app.delete("/api/environments/{env_id}")
def delete_environment(env_id: int, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(db_env)
    db.commit()
    return {"message": f"Environment {env_id} deleted successfully"}


@app.get("/api/history", response_model=List[schemas.History])
def get_history(db: Session = Depends(get_db)):
    return db.query(models.History).order_by(models.History.sent_at.desc()).all()

@app.delete("/api/history/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    db_history = db.query(models.History).filter(models.History.id == history_id).first()
    if not db_history:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(db_history)
    db.commit()
    return {"message": f"History item {history_id} deleted successfully"}

@app.delete("/api/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(models.History).delete()
    db.commit()
    return {"message": "All execution history cleared successfully"}
