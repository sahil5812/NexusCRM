"""
Ticket-related Pydantic schemas for support ticket management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TicketCreate(BaseModel):
    customer_id: int
    subject: str
    description: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[int] = None


class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None


class TicketResponse(BaseModel):
    id: int
    customer_id: int
    subject: str
    description: Optional[str] = None
    status: str
    priority: str
    assigned_to: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
