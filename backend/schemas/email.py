"""
Email-related Pydantic schemas for email drafting and tracking.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmailDraftRequest(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    context: str
    tone: str = "formal"


class EmailDraftResponse(BaseModel):
    subject: str
    body: str


class EmailRecordCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    subject: str
    body: str
    status: str = "draft"
    tone: str = "formal"


class EmailRecordResponse(BaseModel):
    id: int
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    subject: str
    body: str
    status: str
    tone: str
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
