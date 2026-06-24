"""
Tickets router - CRUD endpoints for support ticket management.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from services import ticket_service
from utils.security import get_current_user

router = APIRouter(tags=["Tickets"])


@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tickets with optional status and priority filters."""
    return ticket_service.get_tickets(
        db, skip=skip, limit=limit, status_filter=status, priority=priority
    )


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new support ticket."""
    return ticket_service.create_ticket(db, ticket_data)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a specific ticket by ID."""
    return ticket_service.get_ticket_by_id(db, ticket_id)


@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing ticket."""
    return ticket_service.update_ticket(db, ticket_id, ticket_data)
