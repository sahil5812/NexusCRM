"""
Ticket service - CRUD operations for support tickets.
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.ticket import Ticket
from schemas.ticket import TicketCreate, TicketUpdate


def get_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: str | None = None,
    priority: str | None = None,
) -> list[Ticket]:
    """Retrieve tickets with optional status and priority filters."""
    query = db.query(Ticket)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority:
        query = query.filter(Ticket.priority == priority)

    return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()


def get_ticket_by_id(db: Session, ticket_id: int) -> Ticket:
    """Retrieve a single ticket by ID. Raises HTTP 404 if not found."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with id {ticket_id} not found",
        )
    return ticket


def create_ticket(db: Session, ticket_data: TicketCreate) -> Ticket:
    """Create a new support ticket."""
    new_ticket = Ticket(**ticket_data.model_dump())
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


def update_ticket(db: Session, ticket_id: int, ticket_data: TicketUpdate) -> Ticket:
    """
    Update an existing ticket. Only non-None fields are updated.
    Automatically sets resolved_at when status changes to 'resolved' or 'closed'.
    Raises 404 if not found.
    """
    ticket = get_ticket_by_id(db, ticket_id)
    update_data = ticket_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(ticket, field, value)

    # Auto-set resolved_at when status changes to resolved/closed
    if "status" in update_data and update_data["status"] in ("resolved", "closed"):
        if ticket.resolved_at is None:
            ticket.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(ticket)
    return ticket
