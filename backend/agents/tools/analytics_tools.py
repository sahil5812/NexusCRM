"""
Analytics Tools — tool factories for the Analytics Agent.

Provides dashboard stats, pipeline breakdowns, sales reports, AI-driven
trend analysis, and agent activity logs.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from collections import Counter

from sqlalchemy.orm import Session
from sqlalchemy import func

from agents.base_agent import Tool
from models.lead import Lead
from models.customer import Customer
from models.ticket import Ticket
from models.email_model import EmailRecord
from models.interaction import Interaction
from models.agent_log import AgentLog
from utils.llm import get_llm_client


# ---------------------------------------------------------------------- #
#  Tool: get_dashboard_stats
# ---------------------------------------------------------------------- #

def get_dashboard_stats_tool() -> Tool:
    """Return a Tool that provides top-level CRM dashboard numbers."""

    def _fn(db: Session) -> dict:
        total_leads = db.query(Lead).count()
        total_customers = db.query(Customer).count()
        total_tickets = db.query(Ticket).count()
        total_emails = db.query(EmailRecord).count()

        # Conversion rate: customers ÷ (leads + customers) to avoid division by zero
        total_contacts = total_leads + total_customers
        conversion_rate = (
            round(total_customers / total_contacts * 100, 1)
            if total_contacts > 0
            else 0.0
        )

        # Recent activity (last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        new_leads_week = db.query(Lead).filter(Lead.created_at >= week_ago).count()
        new_tickets_week = db.query(Ticket).filter(Ticket.created_at >= week_ago).count()

        return {
            "total_leads": total_leads,
            "total_customers": total_customers,
            "total_tickets": total_tickets,
            "total_emails": total_emails,
            "conversion_rate": f"{conversion_rate}%",
            "new_leads_this_week": new_leads_week,
            "new_tickets_this_week": new_tickets_week,
        }

    return Tool(
        name="get_dashboard_stats",
        description="Get high-level CRM statistics: total leads, customers, tickets, emails, and conversion rate.",
        function=_fn,
        parameters={},
    )


# ---------------------------------------------------------------------- #
#  Tool: get_pipeline_stats
# ---------------------------------------------------------------------- #

def get_pipeline_stats_tool() -> Tool:
    """Return a Tool that groups leads by status with counts & percentages."""

    def _fn(db: Session) -> dict:
        leads = db.query(Lead).all()
        total = len(leads)

        if total == 0:
            return {"total": 0, "stages": {}, "message": "No leads in the pipeline."}

        status_counts = Counter(l.status for l in leads)

        stages = {}
        for status, count in status_counts.items():
            stages[status] = {
                "count": count,
                "percentage": f"{count / total * 100:.1f}%",
            }

        return {
            "total": total,
            "stages": stages,
        }

    return Tool(
        name="get_pipeline_stats",
        description="Get the sales pipeline breakdown — leads grouped by status with counts and percentages.",
        function=_fn,
        parameters={},
    )


# ---------------------------------------------------------------------- #
#  Tool: get_sales_report
# ---------------------------------------------------------------------- #

def get_sales_report_tool() -> Tool:
    """Return a Tool that reports won/lost leads over a period."""

    def _fn(db: Session, *, days: int = 30) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=int(days))

        won = (
            db.query(Lead)
            .filter(Lead.status == "won", Lead.created_at >= cutoff)
            .all()
        )
        lost = (
            db.query(Lead)
            .filter(Lead.status == "lost", Lead.created_at >= cutoff)
            .all()
        )
        total_period = (
            db.query(Lead)
            .filter(Lead.created_at >= cutoff)
            .count()
        )

        win_rate = (
            round(len(won) / total_period * 100, 1) if total_period > 0 else 0.0
        )

        return {
            "period_days": int(days),
            "total_leads_in_period": total_period,
            "won": {
                "count": len(won),
                "leads": [
                    {"id": l.id, "name": l.name, "company": getattr(l, "company", None)}
                    for l in won[:10]
                ],
            },
            "lost": {
                "count": len(lost),
                "leads": [
                    {"id": l.id, "name": l.name, "company": getattr(l, "company", None)}
                    for l in lost[:10]
                ],
            },
            "win_rate": f"{win_rate}%",
        }

    return Tool(
        name="get_sales_report",
        description="Get a sales report showing leads won and lost over a specified number of days.",
        function=_fn,
        parameters={
            "days": "Number of days to look back. Defaults to 30.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_trend_analysis
# ---------------------------------------------------------------------- #

def get_trend_analysis_tool() -> Tool:
    """Return a Tool that uses AI to analyse CRM data trends."""

    def _fn(db: Session) -> dict:
        # Collect recent metrics
        total_leads = db.query(Lead).count()
        total_customers = db.query(Customer).count()
        total_tickets = db.query(Ticket).count()

        leads = db.query(Lead).all()
        status_counts = Counter(l.status for l in leads)
        score_avg = (
            sum(l.score for l in leads if l.score) / len([l for l in leads if l.score])
            if any(l.score for l in leads)
            else 0
        )
        source_counts = Counter(getattr(l, "source", "unknown") for l in leads)

        tickets = db.query(Ticket).all()
        ticket_status = Counter(t.status for t in tickets)

        data_summary = {
            "total_leads": total_leads,
            "total_customers": total_customers,
            "total_tickets": total_tickets,
            "lead_status_distribution": dict(status_counts),
            "average_lead_score": round(score_avg, 1),
            "lead_sources": dict(source_counts),
            "ticket_status_distribution": dict(ticket_status),
        }

        llm = get_llm_client()
        prompt = f"""You are a CRM analytics expert. Analyze the following data and provide actionable insights.

CRM Data Summary:
{json.dumps(data_summary, indent=2)}

Provide:
1. Key trends you observe
2. Potential concerns or red flags
3. Opportunities for improvement
4. Specific recommendations

Respond in JSON:
{{
  "trends": ["trend 1", "trend 2"],
  "concerns": ["concern 1"],
  "opportunities": ["opportunity 1"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "overall_health": "good/moderate/needs_attention"
}}
"""
        analysis = llm.generate_json(prompt)

        return {
            "data_summary": data_summary,
            "analysis": analysis,
        }

    return Tool(
        name="get_trend_analysis",
        description="Use AI to analyse CRM data patterns and provide trend insights, concerns, and recommendations.",
        function=_fn,
        parameters={},
    )


# ---------------------------------------------------------------------- #
#  Tool: get_agent_activity
# ---------------------------------------------------------------------- #

def get_agent_activity_tool() -> Tool:
    """Return a Tool that shows recent agent logs and activity stats."""

    def _fn(db: Session, *, limit: int = 20) -> dict:
        logs = (
            db.query(AgentLog)
            .order_by(AgentLog.created_at.desc())
            .limit(int(limit))
            .all()
        )

        agent_counts = Counter(log.agent_name for log in logs)

        return {
            "total_recent_actions": len(logs),
            "by_agent": dict(agent_counts),
            "recent_logs": [
                {
                    "id": log.id,
                    "agent": log.agent_name,
                    "task_type": log.task_type,
                    "input": (log.input_query or "")[:100],
                    "duration_seconds": log.duration_seconds,
                    "created_at": str(log.created_at) if log.created_at else None,
                }
                for log in logs
            ],
        }

    return Tool(
        name="get_agent_activity",
        description="View recent agent activity logs with a breakdown by agent.",
        function=_fn,
        parameters={
            "limit": "Number of recent logs to return. Defaults to 20.",
        },
    )
