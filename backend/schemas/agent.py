"""
AI Agent-related Pydantic schemas for chat interface and logging.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AgentChatRequest(BaseModel):
    message: str


class AgentChatResponse(BaseModel):
    response: str
    agent_used: str
    actions_taken: list[str] = []


class AgentLogResponse(BaseModel):
    id: int
    agent_name: str
    task_type: str
    input_query: str
    output_response: str
    duration_seconds: float
    tokens_used: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
