from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class EnvironmentVariableBase(BaseModel):
    key: str
    value: str
    enabled: bool = True

class EnvironmentVariableCreate(EnvironmentVariableBase):
    pass

class EnvironmentVariable(EnvironmentVariableBase):
    id: int
    environment_id: int

    model_config = ConfigDict(from_attributes=True)

class EnvironmentBase(BaseModel):
    name: str

class EnvironmentCreate(EnvironmentBase):
    variables: Optional[List[EnvironmentVariableCreate]] = []

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    variables: Optional[List[EnvironmentVariableCreate]] = None

class Environment(EnvironmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    variables: List[EnvironmentVariable] = []

    model_config = ConfigDict(from_attributes=True)

class RequestBase(BaseModel):
    name: str
    method: str
    url: str
    headers: Optional[str] = "[]"
    params: Optional[str] = "[]"
    body_type: Optional[str] = "none"
    body_raw: Optional[str] = None
    body_form_data: Optional[str] = "[]"
    body_urlencoded: Optional[str] = "[]"
    auth_type: Optional[str] = "none"
    auth_config: Optional[str] = "{}"

class RequestCreate(RequestBase):
    collection_id: Optional[int] = None

class RequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[str] = None
    params: Optional[str] = None
    body_type: Optional[str] = None
    body_raw: Optional[str] = None
    body_form_data: Optional[str] = None
    body_urlencoded: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[str] = None
    collection_id: Optional[int] = None

class Request(RequestBase):
    id: int
    collection_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Collection(CollectionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    requests: List[Request] = []

    model_config = ConfigDict(from_attributes=True)

class HistoryBase(BaseModel):
    name: Optional[str] = None
    method: str
    url: str
    headers: Optional[str] = "[]"
    params: Optional[str] = "[]"
    body_type: Optional[str] = "none"
    body_raw: Optional[str] = None
    body_form_data: Optional[str] = "[]"
    body_urlencoded: Optional[str] = "[]"
    auth_type: Optional[str] = "none"
    auth_config: Optional[str] = "{}"
    
    response_status: Optional[int] = None
    response_time_ms: Optional[int] = None
    response_size_bytes: Optional[int] = None
    response_headers: Optional[str] = "{}"
    response_body: Optional[str] = None

class HistoryCreate(HistoryBase):
    pass

class History(HistoryBase):
    id: int
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RequestSendPayload(BaseModel):
    method: str
    url: str
    headers: Optional[str] = "[]"
    params: Optional[str] = "[]"
    body_type: Optional[str] = "none"
    body_raw: Optional[str] = None
    body_form_data: Optional[str] = "[]"
    body_urlencoded: Optional[str] = "[]"
    auth_type: Optional[str] = "none"
    auth_config: Optional[str] = "{}"
    environment_id: Optional[int] = None
    save_to_history: Optional[bool] = True

class RequestSendResponse(BaseModel):
    status_code: int
    status_text: str
    time_ms: int
    size_bytes: int
    headers: Dict[str, str]
    body: str
    history_id: Optional[int] = None
