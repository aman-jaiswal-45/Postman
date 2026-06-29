from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requests = relationship("Request", back_populates="collection", cascade="all, delete-orphan")

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    url = Column(Text, nullable=False)
    
    headers = Column(Text, default="[]")  
    params = Column(Text, default="[]")   
    
    body_type = Column(String(20), default="none")  
    body_raw = Column(Text, nullable=True)
    body_form_data = Column(Text, default="[]")    
    body_urlencoded = Column(Text, default="[]")   
    
    auth_type = Column(String(20), default="none")  
    auth_config = Column(Text, default="{}")        
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    collection = relationship("Collection", back_populates="requests")

class Environment(Base):
    __tablename__ = "environments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    variables = relationship("EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan")

class EnvironmentVariable(Base):
    __tablename__ = "environment_variables"

    id = Column(Integer, primary_key=True, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)

    environment = relationship("Environment", back_populates="variables")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    method = Column(String(10), nullable=False)
    url = Column(Text, nullable=False)
    
    headers = Column(Text, default="[]")
    params = Column(Text, default="[]")
    body_type = Column(String(20), default="none")
    body_raw = Column(Text, nullable=True)
    body_form_data = Column(Text, default="[]")
    body_urlencoded = Column(Text, default="[]")
    auth_type = Column(String(20), default="none")
    auth_config = Column(Text, default="{}")
    
    response_status = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    response_headers = Column(Text, default="{}")  
    response_body = Column(Text, nullable=True)
    
    sent_at = Column(DateTime, default=datetime.utcnow)
