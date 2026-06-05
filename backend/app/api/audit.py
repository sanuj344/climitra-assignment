from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse
from app.deps import get_current_active_user

router = APIRouter()

@router.get("/{document_id}", response_model=List[AuditLogResponse])
def get_document_audit_logs(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logs = db.query(AuditLog).filter(AuditLog.document_id == document_id).order_by(AuditLog.timestamp.asc()).all()
    return logs
