"""
Leads router - CRUD endpoints for lead management.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadListResponse
from services import lead_service
from utils.security import get_current_user

router = APIRouter(tags=["Leads"])


@router.get("/", response_model=LeadListResponse)
def list_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source: Optional[str] = None,
    min_score: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List leads with optional filtering by status, source, score, and search text."""
    leads, total = lead_service.get_leads(
        db, skip=skip, limit=limit, status_filter=status, source=source,
        min_score=min_score, search=search,
    )
    return LeadListResponse(leads=leads, total=total)


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new lead."""
    return lead_service.create_lead(db, lead_data)


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a specific lead by ID."""
    return lead_service.get_lead_by_id(db, lead_id)


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing lead."""
    return lead_service.update_lead(db, lead_id, lead_data)


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a lead by ID."""
    lead_service.delete_lead(db, lead_id)
    return {"message": "Lead deleted successfully"}
