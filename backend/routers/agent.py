"""
Agent Router — FastAPI endpoints for the AI agent system.

Endpoints:
  POST /api/agent/chat  — Send a message, get an AI response via the Orchestrator.
  GET  /api/agent/logs  — Retrieve recent agent activity logs with pagination.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.agent_log import AgentLog
from models.user import User
from agents.orchestrator import OrchestratorAgent
from utils.security import get_current_user


router = APIRouter(tags=["Agent"])

# Lazy singleton for the orchestrator (created on first request)
_orchestrator: OrchestratorAgent | None = None


def _get_orchestrator() -> OrchestratorAgent:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = OrchestratorAgent()
    return _orchestrator


# ---------------------------------------------------------------------- #
#  Request / Response schemas
# ---------------------------------------------------------------------- #

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    agents_used: list[str] = []
    actions_taken: list[str] = []


class LogEntry(BaseModel):
    id: int
    agent_name: str | None = None
    task_type: str | None = None
    input_query: str | None = None
    output_response: str | None = None
    duration_seconds: float | None = None
    tokens_used: int | None = None
    created_at: str | None = None


class LogsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    logs: list[LogEntry]


# ---------------------------------------------------------------------- #
#  Endpoints
# ---------------------------------------------------------------------- #

@router.post("/chat", response_model=ChatResponse)
def agent_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Route a user message through the Orchestrator and return the AI response."""
    orchestrator = _get_orchestrator()
    result = orchestrator.route(req.message, db)

    return ChatResponse(
        response=result.get("response", ""),
        agents_used=result.get("agents_used", []),
        actions_taken=result.get("actions_taken", []),
    )


@router.get("/logs", response_model=LogsResponse)
def get_agent_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return recent agent activity logs with pagination."""
    total = db.query(AgentLog).count()
    offset = (page - 1) * page_size

    logs = (
        db.query(AgentLog)
        .order_by(AgentLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return LogsResponse(
        total=total,
        page=page,
        page_size=page_size,
        logs=[
            LogEntry(
                id=log.id,
                agent_name=log.agent_name,
                task_type=log.task_type,
                input_query=log.input_query,
                output_response=log.output_response,
                duration_seconds=log.duration_seconds,
                tokens_used=log.tokens_used,
                created_at=str(log.created_at) if log.created_at else None,
            )
            for log in logs
        ],
    )
