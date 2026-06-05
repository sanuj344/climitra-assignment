import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, DocumentImage, DocumentStatusEnum, User
from app.schemas import DocumentResponse
from app.deps import get_current_active_user
from app.services.ocr_service import process_document_ocr

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(400, "Invalid file format. Only JPG, JPEG, PNG allowed.")
    
    document = Document(user_id=current_user.id, status=DocumentStatusEnum.processing)
    db.add(document)
    db.commit()
    db.refresh(document)
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc_image = DocumentImage(
        document_id=document.id,
        file_path=file_path,
        original_filename=file.filename,
        mime_type=file.content_type
    )
    db.add(doc_image)
    db.commit()
    db.refresh(document)
    
    # Run OCR in background
    background_tasks.add_task(process_document_ocr, db, document.id, file_path)
    
    return document

@router.get("", response_model=List[DocumentResponse])
def get_documents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc
