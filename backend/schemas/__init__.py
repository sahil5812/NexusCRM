"""
Pydantic v2 schemas for the AI-Powered CRM system.
"""

from schemas.user import UserCreate, UserLogin, UserResponse, Token
from schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadListResponse
from schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from schemas.email import EmailDraftRequest, EmailDraftResponse, EmailRecordCreate, EmailRecordResponse
from schemas.interaction import InteractionCreate, InteractionResponse
from schemas.analytics import ActivityItem, DashboardStats, PipelineStats, SalesReport
from schemas.agent import AgentChatRequest, AgentChatResponse, AgentLogResponse

__all__ = [
    "UserCreate", "UserLogin", "UserResponse", "Token",
    "LeadCreate", "LeadUpdate", "LeadResponse", "LeadListResponse",
    "CustomerCreate", "CustomerUpdate", "CustomerResponse",
    "TicketCreate", "TicketUpdate", "TicketResponse",
    "EmailDraftRequest", "EmailDraftResponse", "EmailRecordCreate", "EmailRecordResponse",
    "InteractionCreate", "InteractionResponse",
    "ActivityItem", "DashboardStats", "PipelineStats", "SalesReport",
    "AgentChatRequest", "AgentChatResponse", "AgentLogResponse",
]
