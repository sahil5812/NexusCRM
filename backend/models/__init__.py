"""
SQLAlchemy ORM models for the AI-Powered CRM system.
"""

from models.user import User
from models.lead import Lead
from models.customer import Customer
from models.interaction import Interaction
from models.ticket import Ticket
from models.email_model import EmailRecord
from models.followup import FollowUp
from models.agent_log import AgentLog

__all__ = [
    "User",
    "Lead",
    "Customer",
    "Interaction",
    "Ticket",
    "EmailRecord",
    "FollowUp",
    "AgentLog",
]
