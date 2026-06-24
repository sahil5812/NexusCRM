"""
Lead Tools — tool factories for the Lead Intelligence Agent.

Each public function returns a :class:`Tool` instance that wraps a
database-aware callable.  The BaseAgent discovers these tools at
registration time and exposes them to the LLM reasoning loop.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from agents.base_agent import Tool
from models.lead import Lead
from models.interaction import Interaction
from utils.llm import get_llm_client


# ---------------------------------------------------------------------- #
#  Tool: get_all_leads
# ---------------------------------------------------------------------- #

def get_all_leads_tool() -> Tool:
    """Return a Tool that fetches leads with optional filters."""

    def _fn(db: Session, *, status: str = None, min_score: int = None, source: str = None) -> list[dict]:
        query = db.query(Lead)

        if status:
            query = query.filter(Lead.status == status)
        if min_score is not None:
            query = query.filter(Lead.score >= int(min_score))
        if source:
            query = query.filter(Lead.source == source)

        leads = query.order_by(Lead.created_at.desc()).limit(50).all()

        return [
            {
                "id": l.id,
                "name": l.name,
                "email": l.email,
                "company": getattr(l, "company", None),
                "phone": getattr(l, "phone", None),
                "source": getattr(l, "source", None),
                "status": l.status,
                "score": getattr(l, "score", None),
                "created_at": str(l.created_at) if l.created_at else None,
            }
            for l in leads
        ]

    return Tool(
        name="get_all_leads",
        description="Fetch leads from the CRM database. Supports optional filters for status, minimum score, and source.",
        function=_fn,
        parameters={
            "status": "Filter by lead status (e.g. new, contacted, qualified, won, lost). Optional.",
            "min_score": "Minimum lead score (1-100). Optional.",
            "source": "Filter by lead source (e.g. website, referral, linkedin, cold_call). Optional.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_lead_detail
# ---------------------------------------------------------------------- #

def get_lead_detail_tool() -> Tool:
    """Return a Tool that retrieves full details for a single lead."""

    def _fn(db: Session, *, lead_id: int) -> dict:
        lead = db.query(Lead).filter(Lead.id == int(lead_id)).first()
        if not lead:
            return {"error": f"Lead with id {lead_id} not found"}

        interactions = (
            db.query(Interaction)
            .filter(Interaction.lead_id == lead.id)
            .order_by(Interaction.date.desc())
            .limit(10)
            .all()
        )

        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "company": getattr(lead, "company", None),
            "phone": getattr(lead, "phone", None),
            "source": getattr(lead, "source", None),
            "status": lead.status,
            "score": getattr(lead, "score", None),
            "notes": getattr(lead, "notes", None),
            "created_at": str(lead.created_at) if lead.created_at else None,
            "updated_at": str(lead.updated_at) if getattr(lead, "updated_at", None) else None,
            "interactions": [
                {
                    "id": i.id,
                    "type": i.type,
                    "subject": i.subject,
                    "content": i.content,
                    "date": str(i.date) if i.date else None,
                }
                for i in interactions
            ],
        }

    return Tool(
        name="get_lead_detail",
        description="Get full details for a single lead by ID, including recent interactions.",
        function=_fn,
        parameters={
            "lead_id": "The numeric ID of the lead to retrieve. Required.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: score_lead
# ---------------------------------------------------------------------- #

def score_lead_tool() -> Tool:
    """Return a Tool that uses the LLM to score a lead (1-100)."""

    def _fn(db: Session, *, lead_id: int) -> dict:
        lead = db.query(Lead).filter(Lead.id == int(lead_id)).first()
        if not lead:
            return {"error": f"Lead with id {lead_id} not found"}

        interactions = (
            db.query(Interaction)
            .filter(Interaction.lead_id == lead.id)
            .all()
        )

        lead_data = {
            "name": lead.name,
            "email": lead.email,
            "company": getattr(lead, "company", None),
            "source": getattr(lead, "source", None),
            "status": lead.status,
            "current_score": getattr(lead, "score", None),
            "interaction_count": len(interactions),
            "created_at": str(lead.created_at) if lead.created_at else None,
        }

        llm = get_llm_client()
        prompt = f"""Analyze this lead and assign a score from 1 to 100 based on their conversion potential.

Lead Data:
{json.dumps(lead_data, indent=2)}

Consider:
- Company name recognition and industry
- Lead source quality (referral > LinkedIn > website > cold_call)
- Engagement level (number of interactions)
- How recently they were added
- Current status progression

Respond in JSON:
{{"score": <int 1-100>, "reasoning": "brief explanation of the score"}}
"""
        result = llm.generate_json(prompt)
        new_score = result.get("score", getattr(lead, "score", 50))

        # Persist the updated score
        lead.score = int(new_score)
        if hasattr(lead, "updated_at"):
            lead.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "lead_id": lead.id,
            "name": lead.name,
            "previous_score": lead_data["current_score"],
            "new_score": int(new_score),
            "reasoning": result.get("reasoning", "Score updated by AI analysis."),
        }

    return Tool(
        name="score_lead",
        description="Use AI to analyze a lead and assign a quality score (1-100). Updates the score in the database.",
        function=_fn,
        parameters={
            "lead_id": "The numeric ID of the lead to score. Required.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: qualify_leads
# ---------------------------------------------------------------------- #

def qualify_leads_tool() -> Tool:
    """Return a Tool that qualifies leads above a threshold."""

    def _fn(db: Session, *, threshold: int = 0) -> dict:
        leads = (
            db.query(Lead)
            .filter(Lead.score.isnot(None))
            .order_by(Lead.score.desc())
            .all()
        )

        threshold = int(threshold) if threshold else 0

        hot = [l for l in leads if (l.score or 0) > 70 and (l.score or 0) >= threshold]
        warm = [l for l in leads if 40 < (l.score or 0) <= 70 and (l.score or 0) >= threshold]
        cold = [l for l in leads if (l.score or 0) <= 40 and (l.score or 0) >= threshold]

        def _summarise(bucket):
            return [
                {"id": l.id, "name": l.name, "score": l.score, "status": l.status}
                for l in bucket
            ]

        return {
            "hot": {"count": len(hot), "leads": _summarise(hot)},
            "warm": {"count": len(warm), "leads": _summarise(warm)},
            "cold": {"count": len(cold), "leads": _summarise(cold)},
            "total_qualified": len(hot) + len(warm) + len(cold),
        }

    return Tool(
        name="qualify_leads",
        description="Categorise all scored leads as Hot (>70), Warm (40-70), or Cold (<40). Optionally filter by a minimum score threshold.",
        function=_fn,
        parameters={
            "threshold": "Minimum score to include a lead. Optional, defaults to 0.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_lead_insights
# ---------------------------------------------------------------------- #

def get_lead_insights_tool() -> Tool:
    """Return a Tool that generates an AI insight summary for a lead."""

    def _fn(db: Session, *, lead_id: int) -> dict:
        lead = db.query(Lead).filter(Lead.id == int(lead_id)).first()
        if not lead:
            return {"error": f"Lead with id {lead_id} not found"}

        interactions = (
            db.query(Interaction)
            .filter(Interaction.lead_id == lead.id)
            .order_by(Interaction.date.desc())
            .limit(20)
            .all()
        )

        lead_data = {
            "name": lead.name,
            "email": lead.email,
            "company": getattr(lead, "company", None),
            "source": getattr(lead, "source", None),
            "status": lead.status,
            "score": getattr(lead, "score", None),
            "notes": getattr(lead, "notes", None),
            "created_at": str(lead.created_at) if lead.created_at else None,
            "interaction_count": len(interactions),
            "recent_interactions": [
                {
                    "type": i.type,
                    "subject": i.subject,
                    "content": i.content,
                    "date": str(i.date) if i.date else None,
                }
                for i in interactions[:5]
            ],
        }

        llm = get_llm_client()
        prompt = f"""You are a senior sales analyst. Analyze this lead and provide actionable insights.

Lead Data:
{json.dumps(lead_data, indent=2, default=str)}

Provide:
1. A brief summary of the lead's profile
2. Strengths (reasons this lead may convert)
3. Risks (reasons this lead may not convert)
4. Recommended next actions (specific, actionable steps)

Respond in JSON:
{{
  "summary": "...",
  "strengths": ["...", "..."],
  "risks": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "priority": "high/medium/low"
}}
"""
        insights = llm.generate_json(prompt)

        return {
            "lead_id": lead.id,
            "lead_name": lead.name,
            "insights": insights,
        }

    return Tool(
        name="get_lead_insights",
        description="Generate AI-powered insights and recommendations for a specific lead based on their data and interactions.",
        function=_fn,
        parameters={
            "lead_id": "The numeric ID of the lead to analyze. Required.",
        },
    )
