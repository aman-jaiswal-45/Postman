import json
from datetime import datetime
from database import SessionLocal, engine
import models

def seed_db():
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(models.Collection).first() is not None:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding SQLite Database...")

        placeholder_env = models.Environment(name="JSONPlaceholder Dev")
        db.add(placeholder_env)
        db.commit()
        db.refresh(placeholder_env)

        var1 = models.EnvironmentVariable(
            environment_id=placeholder_env.id,
            key="placeholder_url",
            value="https://jsonplaceholder.typicode.com",
            enabled=True
        )
        db.add(var1)

        httpbin_env = models.Environment(name="HTTPBin Testing")
        db.add(httpbin_env)
        db.commit()
        db.refresh(httpbin_env)

        var2 = models.EnvironmentVariable(
            environment_id=httpbin_env.id,
            key="httpbin_url",
            value="https://httpbin.org",
            enabled=True
        )
        var3 = models.EnvironmentVariable(
            environment_id=httpbin_env.id,
            key="user",
            value="admin",
            enabled=True
        )
        var4 = models.EnvironmentVariable(
            environment_id=httpbin_env.id,
            key="password",
            value="secret123",
            enabled=True
        )
        var5 = models.EnvironmentVariable(
            environment_id=httpbin_env.id,
            key="token",
            value="scalar-api-client-secret-token",
            enabled=True
        )
        db.add(var2)
        db.add(var3)
        db.add(var4)
        db.add(var5)
        db.commit()

        coll1 = models.Collection(
            name="JSONPlaceholder API",
            description="Mock REST API endpoints for testing and prototyping."
        )
        coll2 = models.Collection(
            name="HTTPBin Test Suite",
            description="Endpoints from httpbin.org to verify HTTP actions, headers, and authorization."
        )
        db.add(coll1)
        db.add(coll2)
        db.commit()
        db.refresh(coll1)
        db.refresh(coll2)

        req1 = models.Request(
            collection_id=coll1.id,
            name="Get All Posts",
            method="GET",
            url="{{placeholder_url}}/posts",
            headers="[]",
            params="[]",
            body_type="none",
            auth_type="none",
            auth_config="{}"
        )
        req2 = models.Request(
            collection_id=coll1.id,
            name="Get Single Post",
            method="GET",
            url="{{placeholder_url}}/posts/1",
            headers="[]",
            params="[]",
            body_type="none",
            auth_type="none",
            auth_config="{}"
        )
        req3 = models.Request(
            collection_id=coll1.id,
            name="Create Post",
            method="POST",
            url="{{placeholder_url}}/posts",
            headers=json.dumps([{"key": "Content-Type", "value": "application/json", "enabled": True}]),
            params="[]",
            body_type="raw",
            body_raw=json.dumps({"title": "Scalar API Client Post", "body": "Building a fullstack API client is awesome!", "userId": 1}, indent=2),
            auth_type="none",
            auth_config="{}"
        )
        db.add(req1)
        db.add(req2)
        db.add(req3)

        req4 = models.Request(
            collection_id=coll2.id,
            name="Get request with Query Params",
            method="GET",
            url="{{httpbin_url}}/get",
            headers="[]",
            params=json.dumps([
                {"key": "foo", "value": "bar", "enabled": True},
                {"key": "test", "value": "variable-resolution", "enabled": True}
            ]),
            body_type="none",
            auth_type="none",
            auth_config="{}"
        )
        req5 = models.Request(
            collection_id=coll2.id,
            name="Test Basic Auth",
            method="GET",
            url="{{httpbin_url}}/basic-auth/{{user}}/{{password}}",
            headers="[]",
            params="[]",
            body_type="none",
            auth_type="basic",
            auth_config=json.dumps({"username": "{{user}}", "password": "{{password}}"})
        )
        req6 = models.Request(
            collection_id=coll2.id,
            name="Test Bearer Auth",
            method="GET",
            url="{{httpbin_url}}/bearer",
            headers="[]",
            params="[]",
            body_type="none",
            auth_type="bearer",
            auth_config=json.dumps({"token": "{{token}}"})
        )
        req7 = models.Request(
            collection_id=coll2.id,
            name="URL Encoded Form POST",
            method="POST",
            url="{{httpbin_url}}/post",
            headers="[]",
            params="[]",
            body_type="x-www-form-urlencoded",
            body_urlencoded=json.dumps([
                {"key": "first_name", "value": "Jane", "enabled": True},
                {"key": "last_name", "value": "Doe", "enabled": True}
            ]),
            auth_type="none",
            auth_config="{}"
        )
        db.add(req4)
        db.add(req5)
        db.add(req6)
        db.add(req7)

        hist1 = models.History(
            name="GET https://httpbin.org/get",
            method="GET",
            url="https://httpbin.org/get",
            headers="[]",
            params="[]",
            body_type="none",
            response_status=200,
            response_time_ms=185,
            response_size_bytes=354,
            response_headers=json.dumps({"content-type": "application/json", "server": "gunicorn"}),
            response_body=json.dumps({
                "args": {},
                "headers": {
                    "Host": "httpbin.org",
                    "User-Agent": "httpx/0.27.0"
                },
                "origin": "127.0.0.1",
                "url": "https://httpbin.org/get"
            }, indent=2)
        )
        db.add(hist1)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
