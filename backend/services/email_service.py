"""
Email service - CRUD operations for email records.
"""

from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.email_model import EmailRecord
from models.lead import Lead
from models.customer import Customer
from schemas.email import EmailRecordCreate, EmailDraftRequest
from utils.llm import get_llm_client


def get_emails(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: str | None = None,
) -> list[EmailRecord]:
    """Retrieve email records with optional status filter."""
    query = db.query(EmailRecord)

    if status_filter:
        query = query.filter(EmailRecord.status == status_filter)

    return query.order_by(EmailRecord.created_at.desc()).offset(skip).limit(limit).all()


def create_email_record(db: Session, email_data: EmailRecordCreate) -> EmailRecord:
    """Create a new email record."""
    new_email = EmailRecord(**email_data.model_dump())
    db.add(new_email)
    db.commit()
    db.refresh(new_email)
    return new_email


def draft_email_with_ai(db: Session, draft_data: EmailDraftRequest) -> EmailRecord:
    """Use Gemini to generate and save an email draft."""
    recipient_name = "there"
    recipient_email = None

    if draft_data.lead_id:
        lead = db.query(Lead).filter(Lead.id == draft_data.lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        recipient_name = lead.name
        recipient_email = lead.email
    elif draft_data.customer_id:
        customer = db.query(Customer).filter(Customer.id == draft_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        recipient_name = customer.name
        recipient_email = customer.email
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide lead_id or customer_id for AI email drafting",
        )

    tone = draft_data.tone.lower()
    llm = get_llm_client()
    prompt = f"""Draft a professional CRM email.

Recipient: {recipient_name} ({recipient_email or 'email unknown'})
Context: {draft_data.context}
Tone: {tone}

Respond in JSON:
{{
  "subject": "email subject line",
  "body": "full email body with greeting and sign-off"
}}

Sign off as "The CRM Team".
"""
    result = llm.generate_json(prompt)
    new_email = EmailRecord(
        lead_id=draft_data.lead_id,
        customer_id=draft_data.customer_id,
        subject=result.get("subject", f"Follow-up: {draft_data.context[:50]}"),
        body=result.get("body", ""),
        status="draft",
        tone=tone,
    )
    db.add(new_email)
    db.commit()
    db.refresh(new_email)
    return new_email


def update_email_status(
    db: Session,
    email_id: int,
    new_status: str,
    sent_at: Optional[datetime] = None,
) -> EmailRecord:
    """Update the status of an email record. Raises 404 if not found."""
    email = db.query(EmailRecord).filter(EmailRecord.id == email_id).first()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email record with id {email_id} not found",
        )
    email.status = new_status
    if sent_at:
        email.sent_at = sent_at
    db.commit()
    db.refresh(email)
    return email
