"""
Support Tools — tool factories for the Customer Support Agent.

Provides ticket management (CRUD), AI-powered query answering with a
built-in knowledge base, and ticket statistics.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from collections import Counter

from sqlalchemy.orm import Session
from sqlalchemy import func

from agents.base_agent import Tool
from models.ticket import Ticket
from models.customer import Customer
from models.interaction import Interaction
from utils.llm import get_llm_client


# ---------------------------------------------------------------------- #
#  Built-in knowledge base (used by answer_query_tool)
# ---------------------------------------------------------------------- #

KNOWLEDGE_BASE = {
    "password_reset": (
        "To reset your password: Go to Settings → Security → Change Password. "
        "If locked out, use the 'Forgot Password' link on the login page."
    ),
    "billing": (
        "For billing enquiries: Check Settings → Billing for invoices and plan "
        "details. For refunds or payment issues, contact support@crm.com."
    ),
    "integration": (
        "We support integrations with Slack, Google Workspace, Salesforce, "
        "and Zapier. Go to Settings → Integrations to configure them."
    ),
    "data_export": (
        "To export your data: Navigate to Settings → Data Management → Export. "
        "Choose CSV or JSON format. Large exports may take a few minutes."
    ),
    "account_setup": (
        "New account setup: After registration, complete the onboarding wizard "
        "to configure your workspace, invite team members, and import contacts."
    ),
    "api_access": (
        "API documentation is available at docs.crm.com/api. You'll need an "
        "API key from Settings → Developer → API Keys."
    ),
}


# ---------------------------------------------------------------------- #
#  Tool: get_tickets
# ---------------------------------------------------------------------- #

def get_tickets_tool() -> Tool:
    """Return a Tool that lists tickets with optional filters."""

    def _fn(
        db: Session,
        *,
        status: str = None,
        priority: str = None,
        customer_id: int = None,
    ) -> list[dict]:
        query = db.query(Ticket)

        if status:
            query = query.filter(Ticket.status == status)
        if priority:
            query = query.filter(Ticket.priority == priority)
        if customer_id:
            query = query.filter(Ticket.customer_id == int(customer_id))

        tickets = query.order_by(Ticket.created_at.desc()).limit(50).all()

        return [
            {
                "id": t.id,
                "subject": getattr(t, "subject", None),
                "description": (getattr(t, "description", "") or "")[:150],
                "status": t.status,
                "priority": getattr(t, "priority", None),
                "customer_id": getattr(t, "customer_id", None),
                "created_at": str(t.created_at) if t.created_at else None,
            }
            for t in tickets
        ]

    return Tool(
        name="get_tickets",
        description="List support tickets with optional filters for status, priority, and customer_id.",
        function=_fn,
        parameters={
            "status": "Filter by status (open, in_progress, resolved, closed). Optional.",
            "priority": "Filter by priority (low, medium, high, urgent). Optional.",
            "customer_id": "Filter by customer ID. Optional.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: create_ticket
# ---------------------------------------------------------------------- #

def create_ticket_tool() -> Tool:
    """Return a Tool that creates a new support ticket."""

    def _fn(
        db: Session,
        *,
        subject: str,
        description: str,
        priority: str = "medium",
        customer_id: int = None,
    ) -> dict:
        if not customer_id:
            return {"error": "customer_id is required to create a support ticket."}

        try:
            ticket = Ticket(
                subject=subject,
                description=description,
                priority=priority,
                status="open",
                customer_id=int(customer_id),
                created_at=datetime.now(timezone.utc),
            )
            db.add(ticket)
            db.commit()
            db.refresh(ticket)

            return {
                "id": ticket.id,
                "subject": ticket.subject,
                "status": ticket.status,
                "priority": priority,
                "message": "Ticket created successfully.",
            }
        except Exception as exc:
            db.rollback()
            return {"error": f"Failed to create ticket: {exc}"}

    return Tool(
        name="create_ticket",
        description="Create a new customer support ticket.",
        function=_fn,
        parameters={
            "subject": "Ticket subject. Required.",
            "description": "Detailed description of the issue. Required.",
            "priority": "Priority level: low, medium, high, urgent. Defaults to medium.",
            "customer_id": "ID of the customer raising the ticket. Optional.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: update_ticket
# ---------------------------------------------------------------------- #

def update_ticket_tool() -> Tool:
    """Return a Tool that updates an existing ticket."""

    def _fn(
        db: Session,
        *,
        ticket_id: int,
        status: str = None,
        priority: str = None,
    ) -> dict:
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_id)).first()
        if not ticket:
            return {"error": f"Ticket {ticket_id} not found."}

        changes = []
        if status:
            old_status = ticket.status
            ticket.status = status
            changes.append(f"status: {old_status} → {status}")
        if priority:
            old_priority = getattr(ticket, "priority", None)
            ticket.priority = priority
            changes.append(f"priority: {old_priority} → {priority}")

        if hasattr(ticket, "updated_at"):
            ticket.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            return {
                "ticket_id": ticket.id,
                "changes": changes,
                "message": "Ticket updated successfully.",
            }
        except Exception as exc:
            db.rollback()
            return {"error": f"Failed to update ticket: {exc}"}

    return Tool(
        name="update_ticket",
        description="Update a ticket's status and/or priority.",
        function=_fn,
        parameters={
            "ticket_id": "ID of the ticket to update. Required.",
            "status": "New status (open, in_progress, resolved, closed). Optional.",
            "priority": "New priority (low, medium, high, urgent). Optional.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: answer_query
# ---------------------------------------------------------------------- #

def answer_query_tool() -> Tool:
    """Return a Tool that answers support questions using AI + knowledge base."""

    def _fn(db: Session, *, question: str, customer_id: int = None) -> dict:
        # Gather customer context if available
        customer_context = ""
        if customer_id:
            customer = db.query(Customer).filter(Customer.id == int(customer_id)).first()
            if customer:
                customer_context = (
                    f"Customer: {customer.name} ({customer.email})\n"
                    f"Company: {getattr(customer, 'company', 'N/A')}\n"
                )

        # Search knowledge base for relevant articles
        relevant_kb = []
        question_lower = question.lower()
        for topic, content in KNOWLEDGE_BASE.items():
            # Simple keyword matching
            keywords = topic.replace("_", " ").split()
            if any(kw in question_lower for kw in keywords):
                relevant_kb.append(f"[{topic}] {content}")

        kb_context = "\n".join(relevant_kb) if relevant_kb else "No specific knowledge base articles found."

        llm = get_llm_client()
        prompt = f"""You are a helpful customer support agent. Answer the following question using the provided context.

{customer_context}

Knowledge Base Articles:
{kb_context}

Customer Question: {question}

Provide a clear, empathetic, and solution-oriented answer. If the knowledge base doesn't cover the issue, provide your best guidance and suggest contacting support for further help.

Respond in JSON:
{{
  "answer": "your detailed answer",
  "category": "category of the issue",
  "confidence": "high/medium/low",
  "suggested_actions": ["action1", "action2"]
}}
"""
        result = llm.generate_json(prompt)

        return {
            "question": question,
            "answer": result.get("answer", "I'm sorry, I couldn't find a specific answer. Please contact our support team for assistance."),
            "category": result.get("category", "general"),
            "confidence": result.get("confidence", "medium"),
            "suggested_actions": result.get("suggested_actions", []),
            "kb_articles_used": len(relevant_kb),
        }

    return Tool(
        name="answer_query",
        description="Answer a customer support question using AI and the built-in knowledge base.",
        function=_fn,
        parameters={
            "question": "The customer's support question. Required.",
            "customer_id": "ID of the customer asking. Optional — provides context.",
        },
    )


# ---------------------------------------------------------------------- #
#  Tool: get_ticket_stats
# ---------------------------------------------------------------------- #

def get_ticket_stats_tool() -> Tool:
    """Return a Tool that computes ticket statistics."""

    def _fn(db: Session) -> dict:
        tickets = db.query(Ticket).all()
        total = len(tickets)

        if total == 0:
            return {
                "total": 0,
                "by_status": {},
                "by_priority": {},
                "message": "No tickets found.",
            }

        status_counts = Counter(t.status for t in tickets)
        priority_counts = Counter(getattr(t, "priority", "unknown") for t in tickets)

        return {
            "total": total,
            "by_status": dict(status_counts),
            "by_priority": dict(priority_counts),
            "open_rate": f"{(status_counts.get('open', 0) / total * 100):.1f}%",
            "resolved_rate": f"{(status_counts.get('resolved', 0) / total * 100):.1f}%",
        }

    return Tool(
        name="get_ticket_stats",
        description="Get ticket statistics: total count, breakdown by status and priority, open and resolved rates.",
        function=_fn,
        parameters={},
    )
