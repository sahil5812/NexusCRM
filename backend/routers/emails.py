"""
Emails router - draft creation, listing, and send endpoints.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.email import EmailRecordCreate, EmailRecordResponse, EmailDraftRequest
from services import email_service
from utils.security import get_current_user

router = APIRouter(tags=["Emails"])


@router.get("/", response_model=list[EmailRecordResponse])
def list_emails(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List email records with optional status filter."""
    return email_service.get_emails(db, skip=skip, limit=limit, status_filter=status)


@router.post("/draft", response_model=EmailRecordResponse, status_code=status.HTTP_201_CREATED)
def create_draft(
    email_data: EmailDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI email draft and save it to the database."""
    return email_service.draft_email_with_ai(db, email_data)


@router.post("/{email_id}/send", response_model=EmailRecordResponse)
def send_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an email as sent with the current timestamp."""
    return email_service.update_email_status(
        db, email_id, new_status="sent", sent_at=datetime.utcnow()
    )
