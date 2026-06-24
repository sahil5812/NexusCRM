"""
Agents package — public interface for the multi-agent CRM framework.

Import the specialised agents, the orchestrator, and the base classes
here so consumers can simply do::

    from agents import OrchestratorAgent
    from agents import LeadIntelligenceAgent, CommunicationAgent, ...
"""

from agents.base_agent import BaseAgent, Tool, AgentResponse
from agents.lead_agent import LeadIntelligenceAgent
from agents.communication_agent import CommunicationAgent
from agents.support_agent import CustomerSupportAgent
from agents.analytics_agent import AnalyticsAgent
from agents.orchestrator import OrchestratorAgent

__all__ = [
    "BaseAgent",
    "Tool",
    "AgentResponse",
    "LeadIntelligenceAgent",
    "CommunicationAgent",
    "CustomerSupportAgent",
    "AnalyticsAgent",
    "OrchestratorAgent",
]
