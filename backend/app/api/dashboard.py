from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, ExtractedField, DocumentStatusEnum, User
from app.schemas import DashboardStatsResponse
from app.deps import get_current_active_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    total = db.query(Document).count()
    pending = db.query(Document).filter(Document.status == DocumentStatusEnum.review_required).count()
    approved = db.query(Document).filter(Document.status == DocumentStatusEnum.approved).count()
    rejected = db.query(Document).filter(Document.status == DocumentStatusEnum.rejected).count()
    
    # Low confidence docs: documents that have at least one field with confidence < 0.70
    low_conf = db.query(Document).join(ExtractedField).filter(ExtractedField.confidence < 0.70).distinct().count()
    
    # Simple documents per day group by
    docs_by_day = db.query(
        func.date(Document.created_at).label('date'), 
        func.count(Document.id).label('count')
    ).group_by(func.date(Document.created_at)).all()
    
    docs_per_day_list = [{"date": str(d.date), "count": d.count} for d in docs_by_day]
    
    return DashboardStatsResponse(
        total_documents=total,
        pending_review=pending,
        approved=approved,
        rejected=rejected,
        low_confidence=low_conf,
        documents_per_day=docs_per_day_list
    )
