"""
Lead-related Pydantic schemas for lead management and pipeline tracking.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "new"
    score: int = 0
    source: str = "website"
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None


class LeadResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str
    score: int
    source: str
    notes: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadListResponse(BaseModel):
    leads: list[LeadResponse]
    total: int
