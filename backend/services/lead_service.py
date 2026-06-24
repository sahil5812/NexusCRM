"""
Lead service - CRUD operations and filtered queries for leads.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.lead import Lead
from schemas.lead import LeadCreate, LeadUpdate


def get_leads(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: str | None = None,
    source: str | None = None,
    min_score: int | None = None,
    search: str | None = None,
) -> tuple[list[Lead], int]:
    """
    Retrieve leads with optional filtering by status, source, minimum score, and search text.
    Returns a tuple of (leads_list, total_count).
    """
    query = db.query(Lead)

    if status_filter:
        query = query.filter(Lead.status == status_filter)
    if source:
        query = query.filter(Lead.source == source)
    if min_score is not None:
        query = query.filter(Lead.score >= min_score)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search_pattern),
                Lead.email.ilike(search_pattern),
                Lead.company.ilike(search_pattern),
            )
        )

    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return leads, total


def get_lead_by_id(db: Session, lead_id: int) -> Lead:
    """Retrieve a single lead by ID. Raises HTTP 404 if not found."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found",
        )
    return lead


def create_lead(db: Session, lead_data: LeadCreate) -> Lead:
    """Create a new lead from the provided data."""
    new_lead = Lead(**lead_data.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead


def update_lead(db: Session, lead_id: int, lead_data: LeadUpdate) -> Lead:
    """Update an existing lead. Only non-None fields are updated. Raises 404 if not found."""
    lead = get_lead_by_id(db, lead_id)
    update_data = lead_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead_id: int) -> bool:
    """Delete a lead by ID. Raises 404 if not found."""
    lead = get_lead_by_id(db, lead_id)
    db.delete(lead)
    db.commit()
    return True
