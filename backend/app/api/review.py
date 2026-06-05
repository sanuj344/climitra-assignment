from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, ExtractedField, AuditLog, DocumentStatusEnum, User
from app.schemas import CorrectFieldRequest, ExtractedFieldResponse
from app.deps import get_current_active_user

router = APIRouter()

@router.post("/{document_id}/correct", response_model=ExtractedFieldResponse)
def correct_field(
    document_id: str, 
    request: CorrectFieldRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    field = db.query(ExtractedField).filter(
        ExtractedField.document_id == document_id, 
        ExtractedField.field_name == request.field_name
    ).first()
    
    if not field:
        raise HTTPException(404, "Field not found")
        
    old_value = field.value
    field.value = request.new_value
    field.is_corrected = True
    
    audit_log = AuditLog(
        document_id=document_id,
        user_id=current_user.id,
        action="field_corrected",
        field_name=request.field_name,
        previous_value=old_value,
        new_value=request.new_value
    )
    db.add(audit_log)
    db.commit()
    db.refresh(field)
    return field

@router.post("/{document_id}/approve")
def approve_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    
    doc.status = DocumentStatusEnum.approved
    
    audit_log = AuditLog(
        document_id=document_id,
        user_id=current_user.id,
        action="status_changed",
        previous_value=doc.status.value,
        new_value=DocumentStatusEnum.approved.value
    )
    db.add(audit_log)
    db.commit()
    return {"message": "Document approved"}

@router.post("/{document_id}/reject")
def reject_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
        
    doc.status = DocumentStatusEnum.rejected
    
    audit_log = AuditLog(
        document_id=document_id,
        user_id=current_user.id,
        action="status_changed",
        previous_value=doc.status.value,
        new_value=DocumentStatusEnum.rejected.value
    )
    db.add(audit_log)
    db.commit()
    return {"message": "Document rejected"}
