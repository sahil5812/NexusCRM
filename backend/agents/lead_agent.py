"""
Lead Intelligence Agent — analyses, scores, qualifies, and provides
insights on CRM leads.
"""

from agents.base_agent import BaseAgent
from agents.tools.lead_tools import (
    get_all_leads_tool,
    get_lead_detail_tool,
    score_lead_tool,
    qualify_leads_tool,
    get_lead_insights_tool,
)


class LeadIntelligenceAgent(BaseAgent):
    """Specialised agent focused on lead management and intelligence.

    Registered tools:
      • get_all_leads — list & filter leads
      • get_lead_detail — deep-dive on a single lead
      • score_lead — AI-powered lead scoring (1-100)
      • qualify_leads — bucket leads into Hot / Warm / Cold
      • get_lead_insights — AI narrative insights per lead
    """

    def __init__(self):
        super().__init__(
            name="Lead Intelligence Agent",
            description=(
                "Analyzes leads, scores them based on conversion potential, "
                "qualifies them into categories, and provides actionable insights. "
                "Use this agent for anything related to lead management, scoring, "
                "or lead-level analytics."
            ),
            system_prompt=(
                "You are the Lead Intelligence AI Agent for a CRM system. "
                "Your job is to analyze leads, score them based on their "
                "conversion potential, qualify them into priority buckets, "
                "and provide data-driven, actionable insights.\n\n"
                "Guidelines:\n"
                "- Always be specific — cite numbers, scores, and dates.\n"
                "- When scoring, consider company reputation, source quality, "
                "engagement history, and recency.\n"
                "- Prioritise actionable recommendations over generic advice.\n"
                "- When asked to list leads, apply sensible defaults "
                "(e.g. order by score descending)."
            ),
        )

        # Register tools
        self.register_tool(get_all_leads_tool())
        self.register_tool(get_lead_detail_tool())
        self.register_tool(score_lead_tool())
        self.register_tool(qualify_leads_tool())
        self.register_tool(get_lead_insights_tool())
