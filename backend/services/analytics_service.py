"""
Analytics service - dashboard stats, pipeline analysis, and sales reporting.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.lead import Lead
from models.customer import Customer
from models.ticket import Ticket
from models.email_model import EmailRecord
from models.interaction import Interaction


def get_dashboard_stats(db: Session) -> dict:
    """
    Aggregate dashboard statistics including totals, lead distribution,
    and recent activity feed.
    """
    total_leads = db.query(func.count(Lead.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    open_tickets = (
        db.query(func.count(Ticket.id))
        .filter(Ticket.status.in_(["open", "in_progress"]))
        .scalar()
        or 0
    )
    emails_sent = (
        db.query(func.count(EmailRecord.id))
        .filter(EmailRecord.status == "sent")
        .scalar()
        or 0
    )

    # Leads grouped by status
    status_counts = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    leads_by_status = {status: count for status, count in status_counts}

    # Recent activities (last 10 interactions)
    recent_interactions = (
        db.query(Interaction)
        .order_by(Interaction.date.desc())
        .limit(10)
        .all()
    )
    recent_activities = [
        {
            "id": interaction.id,
            "type": interaction.type,
            "description": interaction.subject,
            "timestamp": interaction.date.isoformat(),
        }
        for interaction in recent_interactions
    ]

    return {
        "total_leads": total_leads,
        "total_customers": total_customers,
        "open_tickets": open_tickets,
        "emails_sent": emails_sent,
        "leads_by_status": leads_by_status,
        "recent_activities": recent_activities,
    }


def get_pipeline_stats(db: Session) -> dict:
    """
    Pipeline analysis showing lead counts by stage and conversion metrics.
    """
    status_counts = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    stages = [{"name": status, "count": count} for status, count in status_counts]

    total = db.query(func.count(Lead.id)).scalar() or 0
    won = db.query(func.count(Lead.id)).filter(Lead.status == "won").scalar() or 0
    conversion_rate = round((won / total * 100), 2) if total > 0 else 0.0

    return {
        "stages": stages,
        "total_value": total,
        "conversion_rate": conversion_rate,
    }


def get_sales_report(db: Session, period: str = "all") -> dict:
    """
    Sales performance report with lead creation, win/loss counts, and conversion rate.
    """
    total = db.query(func.count(Lead.id)).scalar() or 0
    won = db.query(func.count(Lead.id)).filter(Lead.status == "won").scalar() or 0
    lost = db.query(func.count(Lead.id)).filter(Lead.status == "lost").scalar() or 0
    conversion_rate = round((won / total * 100), 2) if total > 0 else 0.0

    return {
        "period": period,
        "leads_created": total,
        "leads_won": won,
        "leads_lost": lost,
        "conversion_rate": conversion_rate,
    }


def get_recent_activities(db: Session, limit: int = 10) -> list[dict]:
    """Retrieve the most recent interactions as activity items."""
    recent = (
        db.query(Interaction)
        .order_by(Interaction.date.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": i.id,
            "type": i.type,
            "description": i.subject,
            "timestamp": i.date.isoformat(),
        }
        for i in recent
    ]
