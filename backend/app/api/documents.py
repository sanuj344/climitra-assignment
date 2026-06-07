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
from app.config import settings
from app.logger import logger

router = APIRouter()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"]
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.info(f"User {current_user.id} uploading file: {file.filename}")
    
    if file.content_type not in ALLOWED_MIME_TYPES:
        logger.error(f"Upload rejected: Invalid MIME type {file.content_type}")
        raise HTTPException(400, "Invalid file format. Only JPG, JPEG, PNG allowed.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.error(f"Upload rejected: Invalid extension {ext}")
        raise HTTPException(400, "Invalid file extension.")
        
    # Check file size safely
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        logger.error(f"Upload rejected: File size {file_size} exceeds 10MB limit")
        raise HTTPException(400, "File too large. Maximum size is 10MB.")
    
    document = Document(user_id=current_user.id, status=DocumentStatusEnum.processing)
    db.add(document)
    db.commit()
    db.refresh(document)
    
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"File write failed: {e}")
        raise HTTPException(500, "Failed to save uploaded file.")
        
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
    logger.info(f"Queuing OCR background task for document {document.id}")
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
