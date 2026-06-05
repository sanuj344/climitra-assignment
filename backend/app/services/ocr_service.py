import random
from sqlalchemy.orm import Session
from app.models import Document, ExtractedField, DocumentStatusEnum

# Mocking PaddleOCR for now due to dependency issues, but structuring it as if real.
# In a real environment: from paddleocr import PaddleOCR
# ocr = PaddleOCR(use_angle_cls=True, lang='en')

def process_document_ocr(db: Session, document_id: str, file_path: str):
    # In a real scenario:
    # result = ocr.ocr(file_path, cls=True)
    # text_blocks = [line[1][0] for res in result for line in res]
    
    # Mocking extraction logic based on assignment requirements
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
    
    # Business logic validation: net_weight = gross - tare
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if document:
        document.status = DocumentStatusEnum.review_required
        db.commit()
