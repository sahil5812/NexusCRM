"""
Interactions router - log and retrieve communication interactions.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.interaction import Interaction
from schemas.interaction import InteractionCreate, InteractionResponse
from utils.security import get_current_user

router = APIRouter(tags=["Interactions"])


@router.get("/", response_model=list[InteractionResponse])
def list_interactions(
    lead_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List interactions, optionally filtered by lead_id or customer_id."""
    query = db.query(Interaction)

    if lead_id is not None:
        query = query.filter(Interaction.lead_id == lead_id)
    if customer_id is not None:
        query = query.filter(Interaction.customer_id == customer_id)

    return query.order_by(Interaction.date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
def create_interaction(
    interaction_data: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a new interaction (call, email, meeting, or note)."""
    new_interaction = Interaction(
        lead_id=interaction_data.lead_id,
        customer_id=interaction_data.customer_id,
        type=interaction_data.type,
        subject=interaction_data.subject,
        content=interaction_data.content,
        created_by=current_user.id,
    )
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction
