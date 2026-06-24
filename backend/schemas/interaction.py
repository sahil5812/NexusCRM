"""
Interaction-related Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class InteractionCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    type: str
    subject: str
    content: Optional[str] = None


class InteractionResponse(BaseModel):
    id: int
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    type: str
    subject: str
    content: Optional[str] = None
    date: datetime
    created_by: int

    model_config = ConfigDict(from_attributes=True)
