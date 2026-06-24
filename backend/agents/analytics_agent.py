"""
Analytics Agent — generates reports, analyses trends, and provides
data-driven business insights across the CRM.
"""

from agents.base_agent import BaseAgent
from agents.tools.analytics_tools import (
    get_dashboard_stats_tool,
    get_pipeline_stats_tool,
    get_sales_report_tool,
    get_trend_analysis_tool,
    get_agent_activity_tool,
)


class AnalyticsAgent(BaseAgent):
    """Specialised agent for CRM analytics, reporting, and trend analysis.

    Registered tools:
      • get_dashboard_stats — high-level CRM metrics
      • get_pipeline_stats — lead funnel breakdown
      • get_sales_report — won/lost over a period
      • get_trend_analysis — AI-driven trend insights
      • get_agent_activity — agent action log summary
    """

    def __init__(self):
        super().__init__(
            name="Analytics Agent",
            description=(
                "Generates reports, analyses CRM data trends, "
                "provides forecasts and actionable business insights. "
                "Use this agent for dashboards, pipeline analysis, "
                "sales reports, and trend summaries."
            ),
            system_prompt=(
                "You are the Analytics AI Agent for a CRM system. "
                "Your job is to analyze CRM data, generate meaningful "
                "reports, identify trends, and deliver actionable "
                "business insights.\n\n"
                "Guidelines:\n"
                "- Use data to support every observation — cite specific "
                "numbers and percentages.\n"
                "- Highlight both positives and areas of concern.\n"
                "- Provide clear recommendations backed by the data.\n"
                "- When generating reports, organise information "
                "logically (summary → details → recommendations).\n"
                "- Compare current metrics against trends when possible."
            ),
        )

        # Register tools
        self.register_tool(get_dashboard_stats_tool())
        self.register_tool(get_pipeline_stats_tool())
        self.register_tool(get_sales_report_tool())
        self.register_tool(get_trend_analysis_tool())
        self.register_tool(get_agent_activity_tool())
