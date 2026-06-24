"""
Email / Communication Tools — tool factories for the Communication Agent.

Each function returns a :class:`Tool` wired to the database and, where
needed, to the LLM for email drafting and follow-up analysis.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from agents.base_agent import Tool
from models.lead import Lead
from models.customer import Customer
from models.email_model import EmailRecord
from models.interaction import Interaction
from models.followup import FollowUp
from utils.llm import get_llm_client


# ---------------------------------------------------------------------- #
#  Tool: draft_email
# ---------------------------------------------------------------------- #

def draft_email_tool() -> Tool:
    """Return a Tool that drafts a professional email using AI."""

    def _fn(
        db: Session,
        *,
        lead_id: int = None,
        customer_id: int = None,
        subject: str = "",
        tone: str = "professional",
        context: str = "",
    ) -> dict:
        # Gather recipient info
        recipient = None
        recipient_type = None

        if lead_id:
            recipient = db.query(Lead).filter(Lead.id == int(lead_id)).first()
            recipient_type = "lead"
        elif customer_id:
            recipient = db.query(Customer).filter(Customer.id == int(customer_id)).first()
            recipient_type = "customer"

        if not recipient:
            return {"error": "No valid lead_id or customer_id provided, or record not found."}

        recipient_data = {
            "name": recipient.name,
            "email": recipient.email,
            "company": getattr(recipient, "company", None),
            "type": recipient_type,
        }

        llm = get_llm_client()
        prompt = f"""Draft a professional email with the following parameters:

Recipient: {json.dumps(recipient_data)}
Subject: {subject if subject else "Choose an appropriate subject"}
Tone: {tone}  (options: formal, friendly, urgent, followup)
Context/Purpose: {context if context else "General business communication"}

Respond in JSON:
{{
  "subject": "email subject line",
  "body": "full email body with greeting and sign-off",
  "tone_used": "{tone}"
}}

Write a compelling, well-structured email. Use the recipient's name.
Sign off as "The CRM Team".
"""
        result = llm.generate_json(prompt)

        # Save draft to database
        try:
            email_record = EmailRecord(
                lead_id=int(lead_id) if lead_id else None,
                customer_id=int(customer_id) if customer_id else None,
                subject=result.get("subject", subject),
                body=result.get("body", ""),
                status="draft",
                tone=tone,
                created_at=datetime.now(timezone.utc),
            )
            db.add(email_record)
            db.commit()
            db.refresh(email_record)

            return {
                "email_id": email_record.id,
                "subject": result.get("subject", subject),
                "body": result.get("body", ""),
                "tone": result.get("tone_used", tone),
                "status": "draft",
                "recipient": recipient.email,
            }
        except Exception as exc:
            db.rollback()
            return {
                "subject": result.get("subject", subject),
                "body": result.get("body", ""),
                "tone": result.get("tone_used", tone),
                "status": "draft_not_saved",
                "error": str(exc),
            }

    return Tool(
        name="draft_email",
        description="Use AI to draft a professional email for a lead or customer. Saves the draft to the database.",
        function=_fn,
        parameters={
            "lead_id": "ID of the lead to email. Provide this OR customer_id.",
            "customer_id": "ID of the customer to email. Provide this OR lead_id.",
            "subject": "Email subject line. Optional — AI will generate one if omitted.",
            "tone": "Tone of the email: formal, friendly, urgent, or followup. Defaults to professional.",
            "context": "Purpose or context for the email. Optional.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_email_history
# ---------------------------------------------------------------------- #

def get_email_history_tool() -> Tool:
    """Return a Tool that fetches email history for a lead or customer."""

    def _fn(db: Session, *, lead_id: int = None, customer_id: int = None) -> list[dict]:
        query = db.query(EmailRecord)

        if lead_id:
            query = query.filter(EmailRecord.lead_id == int(lead_id))
        elif customer_id:
            query = query.filter(EmailRecord.customer_id == int(customer_id))
        else:
            return {"error": "Provide either lead_id or customer_id."}

        emails = query.order_by(EmailRecord.created_at.desc()).limit(20).all()

        return [
            {
                "id": e.id,
                "subject": getattr(e, "subject", None),
                "body": getattr(e, "body", "")[:200] + "..." if len(getattr(e, "body", "") or "") > 200 else getattr(e, "body", ""),
                "status": getattr(e, "status", None),
                "tone": getattr(e, "tone", None),
                "created_at": str(e.created_at) if e.created_at else None,
            }
            for e in emails
        ]

    return Tool(
        name="get_email_history",
        description="Retrieve email history for a specific lead or customer.",
        function=_fn,
        parameters={
            "lead_id": "ID of the lead. Provide this OR customer_id.",
            "customer_id": "ID of the customer. Provide this OR lead_id.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_email_templates
# ---------------------------------------------------------------------- #

def get_email_templates_tool() -> Tool:
    """Return a Tool with predefined email templates."""

    TEMPLATES = {
        "welcome": {
            "name": "Welcome Email",
            "subject": "Welcome to {company}!",
            "body": (
                "Hi {name},\n\n"
                "Welcome aboard! We're thrilled to have you join us. "
                "Our team is here to ensure you get the most out of our "
                "solutions.\n\n"
                "Here's what you can expect next:\n"
                "1. A brief onboarding call to understand your needs\n"
                "2. Customised setup tailored to your workflow\n"
                "3. Ongoing support from our dedicated team\n\n"
                "Feel free to reach out anytime.\n\n"
                "Best regards,\nThe CRM Team"
            ),
        },
        "follow_up": {
            "name": "Follow-Up Email",
            "subject": "Following Up — {subject}",
            "body": (
                "Hi {name},\n\n"
                "I wanted to follow up on our recent conversation. "
                "I hope you've had a chance to review the information "
                "we shared.\n\n"
                "I'd love to schedule a quick call to address any "
                "questions you might have. Would any of the following "
                "times work for you?\n\n"
                "Looking forward to hearing from you.\n\n"
                "Best regards,\nThe CRM Team"
            ),
        },
        "proposal": {
            "name": "Proposal Email",
            "subject": "Proposal for {company}",
            "body": (
                "Hi {name},\n\n"
                "Thank you for your interest! Based on our discussion, "
                "I've put together a proposal tailored to your needs.\n\n"
                "Key highlights:\n"
                "• Customised solution addressing your specific challenges\n"
                "• Competitive pricing with flexible payment options\n"
                "• Dedicated support and implementation assistance\n\n"
                "Please find the detailed proposal attached. I'd love "
                "to walk you through it at your convenience.\n\n"
                "Best regards,\nThe CRM Team"
            ),
        },
        "thank_you": {
            "name": "Thank You Email",
            "subject": "Thank You, {name}!",
            "body": (
                "Hi {name},\n\n"
                "Thank you for choosing us! We truly appreciate your "
                "trust and look forward to a successful partnership.\n\n"
                "If there's anything you need, don't hesitate to reach "
                "out. We're here to help.\n\n"
                "Warm regards,\nThe CRM Team"
            ),
        },
        "meeting_request": {
            "name": "Meeting Request",
            "subject": "Meeting Request — {subject}",
            "body": (
                "Hi {name},\n\n"
                "I'd like to schedule a meeting to discuss how we can "
                "help {company} achieve its goals.\n\n"
                "Would you be available for a 30-minute call this week? "
                "I'm flexible on timing and happy to work around your "
                "schedule.\n\n"
                "Please let me know what works best.\n\n"
                "Best regards,\nThe CRM Team"
            ),
        },
    }

    def _fn(db: Session, *, template_name: str = None) -> dict:
        if template_name and template_name in TEMPLATES:
            return {"template": TEMPLATES[template_name]}
        return {"templates": {k: v["name"] for k, v in TEMPLATES.items()}, "details": TEMPLATES}

    return Tool(
        name="get_email_templates",
        description="Retrieve predefined email templates (welcome, follow_up, proposal, thank_you, meeting_request).",
        function=_fn,
        parameters={
            "template_name": "Name of a specific template to retrieve. Optional — returns all templates if omitted.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: suggest_followup
# ---------------------------------------------------------------------- #

def suggest_followup_tool() -> Tool:
    """Return a Tool that suggests follow-up timing and content."""

    def _fn(db: Session, *, lead_id: int = None, customer_id: int = None) -> dict:
        entity = None
        entity_type = None

        if lead_id:
            entity = db.query(Lead).filter(Lead.id == int(lead_id)).first()
            entity_type = "lead"
        elif customer_id:
            entity = db.query(Customer).filter(Customer.id == int(customer_id)).first()
            entity_type = "customer"

        if not entity:
            return {"error": "Provide a valid lead_id or customer_id."}

        # Find last interaction
        interactions = (
            db.query(Interaction)
            .filter(
                (Interaction.lead_id == entity.id)
                if entity_type == "lead"
                else (Interaction.customer_id == entity.id)
            )
            .order_by(Interaction.date.desc())
            .limit(5)
            .all()
        )

        last_contact = interactions[0].date if interactions else entity.created_at
        days_since = (datetime.now(timezone.utc) - last_contact).days if last_contact else None

        entity_data = {
            "name": entity.name,
            "type": entity_type,
            "status": getattr(entity, "status", None),
            "score": getattr(entity, "score", None),
            "days_since_last_contact": days_since,
            "recent_interactions": [
                {"type": i.type, "subject": i.subject, "date": str(i.date)}
                for i in interactions
            ],
        }

        llm = get_llm_client()
        prompt = f"""As a CRM follow-up advisor, analyze this {entity_type} and suggest the best follow-up strategy.

Data:
{json.dumps(entity_data, indent=2, default=str)}

Respond in JSON:
{{
  "urgency": "high/medium/low",
  "suggested_date": "YYYY-MM-DD",
  "channel": "email/phone/meeting",
  "subject": "suggested subject or topic",
  "message_outline": "brief outline of what to communicate",
  "reasoning": "why this follow-up strategy"
}}
"""
        suggestion = llm.generate_json(prompt)

        # Persist follow-up suggestion (lead-only model)
        if entity_type == "lead":
            try:
                followup = FollowUp(
                    lead_id=entity.id,
                    type=suggestion.get("channel", "email"),
                    notes=suggestion.get("message_outline", ""),
                    due_date=datetime.now(timezone.utc) + timedelta(days=3),
                    completed=False,
                )
                db.add(followup)
                db.commit()
            except Exception:
                db.rollback()

        return {
            "entity_name": entity.name,
            "entity_type": entity_type,
            "days_since_contact": days_since,
            "suggestion": suggestion,
        }

    return Tool(
        name="suggest_followup",
        description="Analyze a lead or customer's history and suggest optimal follow-up timing, channel, and content.",
        function=_fn,
        parameters={
            "lead_id": "ID of the lead. Provide this OR customer_id.",
            "customer_id": "ID of the customer. Provide this OR lead_id.",
        },
    )
