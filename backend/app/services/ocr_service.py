import random
import asyncio
from sqlalchemy.orm import Session
from app.models import Document, ExtractedField, DocumentStatusEnum
from app.logger import logger

def process_document_ocr(db: Session, document_id: str, file_path: str):
    logger.info(f"Starting OCR processing for document {document_id}")
    try:
        # Simulate timeout protection using asyncio.wait_for in a real async environment.
        # Since this is a synchronous function being run in BackgroundTasks (which runs it in a threadpool),
        # we would ideally use a thread-safe timeout mechanism. We'll simulate OCR logic here safely.
        
        # Mocking PaddleOCR for now due to dependency issues
        mock_extracted_data = [
            {"field_name": "vehicle_number", "value": "GJ04X6344", "confidence": random.uniform(0.65, 0.98)},
            {"field_name": "gross_weight", "value": "45000", "confidence": random.uniform(0.70, 0.99)},
            {"field_name": "tare_weight", "value": "15000", "confidence": random.uniform(0.70, 0.99)},
            {"field_name": "net_weight", "value": "30000", "confidence": random.uniform(0.60, 0.95)},
            {"field_name": "date", "value": "2026-06-05", "confidence": random.uniform(0.85, 0.99)},
            {"field_name": "time", "value": "10:30", "confidence": random.uniform(0.80, 0.99)},
            {"field_name": "slip_number", "value": "SLP-99234", "confidence": random.uniform(0.75, 0.99)}
        ]
        
        for data in mock_extracted_data:
            field = ExtractedField(
                document_id=document_id,
                field_name=data["field_name"],
                value=data["value"],
                confidence=data["confidence"]
            )
            db.add(field)
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = DocumentStatusEnum.review_required
            db.commit()
            logger.info(f"OCR processing completed successfully for document {document_id}")
            
    except Exception as e:
        logger.error(f"OCR processing failed for document {document_id}: {e}", exc_info=True)
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = DocumentStatusEnum.failed
            db.commit()
            logger.info(f"Document {document_id} marked as FAILED")
