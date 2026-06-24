"""
Analytics-related Pydantic schemas for dashboard and reporting.
"""

from datetime import datetime
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: int
    type: str
    description: str
    timestamp: datetime


class DashboardStats(BaseModel):
    total_leads: int
    total_customers: int
    open_tickets: int
    emails_sent: int
    leads_by_status: dict[str, int]
    recent_activities: list[ActivityItem]


class PipelineStats(BaseModel):
    stages: list[dict]
    total_value: int = 0
    conversion_rate: float = 0.0


class SalesReport(BaseModel):
    period: str
    leads_created: int
    leads_won: int
    leads_lost: int
    conversion_rate: float
