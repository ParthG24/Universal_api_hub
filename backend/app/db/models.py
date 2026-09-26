import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=False)
    provider = Column(String(50), nullable=False)  # 'gemini', 'groq', 'openai'
    model = Column(String(100), nullable=False)
    system_prompt = Column(Text, default="", nullable=False)
    output_schema = Column(JSON, default=dict, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # 'active', 'disabled'
    api_key_hash = Column(String(64), index=True, nullable=False)  # SHA-256 hash of API key
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    input_fields = relationship(
        "InputField",
        back_populates="connector",
        cascade="all, delete-orphan",
        order_by="InputField.order",
    )
    request_logs = relationship(
        "RequestLog",
        back_populates="connector",
        cascade="all, delete-orphan",
        order_by="desc(RequestLog.request_timestamp)",
    )


class InputField(Base):
    __tablename__ = "input_fields"

    id = Column(Integer, primary_key=True, index=True)
    connector_id = Column(Integer, ForeignKey("connectors.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    field_type = Column(String(20), nullable=False)  # 'text', 'number', 'boolean', 'image', 'file', 'json'
    required = Column(Boolean, default=True, nullable=False)
    description = Column(String(500), default="", nullable=False)
    default_value = Column(Text, nullable=True)
    validation_rules = Column(JSON, default=dict, nullable=False)  # min, max, allowed_types, regex, etc.
    order = Column(Integer, default=0, nullable=False)

    connector = relationship("Connector", back_populates="input_fields")


class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    connector_id = Column(Integer, ForeignKey("connectors.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # 'success', 'failed'
    request_timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    response_time_ms = Column(Float, default=0.0, nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    error_type = Column(String(50), nullable=True)  # 'validation_error', 'provider_error', 'timeout', etc.
    error_message = Column(Text, nullable=True)
    request_preview = Column(Text, nullable=True)  # safe truncated preview
    response_preview = Column(Text, nullable=True)  # safe truncated preview

    connector = relationship("Connector", back_populates="request_logs")


class ProviderModelCache(Base):
    __tablename__ = "provider_model_cache"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False, index=True)
    model_id = Column(String(100), nullable=False)
    model_label = Column(String(200), nullable=False)
    capabilities = Column(JSON, default=list, nullable=False)  # ['text', 'vision']
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_provider_model", "provider", "model_id", unique=True),
    )
