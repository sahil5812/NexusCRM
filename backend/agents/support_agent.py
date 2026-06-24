"""
Customer Support Agent — handles customer queries, manages tickets,
and resolves issues using AI and a built-in knowledge base.
"""

from agents.base_agent import BaseAgent
from agents.tools.support_tools import (
    get_tickets_tool,
    create_ticket_tool,
    update_ticket_tool,
    answer_query_tool,
    get_ticket_stats_tool,
)


class CustomerSupportAgent(BaseAgent):
    """Specialised agent for customer support and ticket management.

    Registered tools:
      • get_tickets — list & filter support tickets
      • create_ticket — open a new ticket
      • update_ticket — change status / priority
      • answer_query — AI answer with knowledge-base context
      • get_ticket_stats — ticket metrics dashboard
    """

    def __init__(self):
        super().__init__(
            name="Customer Support Agent",
            description=(
                "Handles customer queries, manages support tickets, "
                "provides helpful resolutions using AI and a built-in "
                "knowledge base. Use this agent for customer issues, "
                "ticket creation/updates, and support analytics."
            ),
            system_prompt=(
                "You are the Customer Support AI Agent for a CRM system. "
                "Your job is to handle customer queries empathetically, "
                "manage support tickets efficiently, and provide clear, "
                "solution-oriented resolutions.\n\n"
                "Guidelines:\n"
                "- Be empathetic and acknowledge the customer's frustration.\n"
                "- Provide step-by-step solutions when possible.\n"
                "- If you don't know the answer, suggest contacting the "
                "support team rather than guessing.\n"
                "- When creating tickets, assign appropriate priority "
                "based on the issue severity.\n"
                "- Track and reference related tickets to spot patterns."
            ),
        )

        # Register tools
        self.register_tool(get_tickets_tool())
        self.register_tool(create_ticket_tool())
        self.register_tool(update_ticket_tool())
        self.register_tool(answer_query_tool())
        self.register_tool(get_ticket_stats_tool())
