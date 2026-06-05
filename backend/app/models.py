import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    reviewer = "reviewer"
    operator = "operator"

class DocumentStatusEnum(str, enum.Enum):
    pending_upload = "pending_upload"
    processing = "processing"
    review_required = "review_required"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.processing)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    images = relationship("DocumentImage", back_populates="document", cascade="all, delete-orphan")
    fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")


class DocumentImage(Base):
    __tablename__ = "document_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="images")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    field_name = Column(String, nullable=False)
    value = Column(String, nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    is_corrected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="fields")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    field_name = Column(String, nullable=True)
    previous_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
