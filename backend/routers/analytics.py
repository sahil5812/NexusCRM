"""
Analytics router - dashboard, pipeline, and reporting endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.analytics import DashboardStats, PipelineStats, SalesReport
from services import analytics_service
from utils.security import get_current_user

router = APIRouter(tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregated dashboard statistics."""
    return analytics_service.get_dashboard_stats(db)


@router.get("/pipeline", response_model=PipelineStats)
def get_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve sales pipeline analysis."""
    return analytics_service.get_pipeline_stats(db)


@router.get("/reports", response_model=SalesReport)
def get_reports(
    period: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve sales performance report."""
    return analytics_service.get_sales_report(db, period=period)
