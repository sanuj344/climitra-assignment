from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import RoleEnum, DocumentStatusEnum

# Authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True

# Fields
class ExtractedFieldBase(BaseModel):
    field_name: str
    value: Optional[str]
    confidence: float
    is_corrected: bool

class ExtractedFieldResponse(ExtractedFieldBase):
    id: UUID
    document_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CorrectFieldRequest(BaseModel):
    field_name: str
    new_value: str

# Documents
class DocumentImageResponse(BaseModel):
    id: UUID
    file_path: str
    original_filename: str
    mime_type: str

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: DocumentStatusEnum
    created_at: datetime
    updated_at: datetime
    fields: List[ExtractedFieldResponse] = []
    images: List[DocumentImageResponse] = []

    class Config:
        from_attributes = True

# Audit
class AuditLogResponse(BaseModel):
    id: UUID
    document_id: UUID
    user_id: UUID
    action: str
    field_name: Optional[str]
    previous_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# Dashboard
class DashboardStatsResponse(BaseModel):
    total_documents: int
    pending_review: int
    approved: int
    rejected: int
    low_confidence: int
    documents_per_day: List[dict] # e.g. [{"date": "2026-06-05", "count": 10}]
