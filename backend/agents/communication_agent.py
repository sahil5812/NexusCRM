"""
Communication Agent — drafts emails, manages follow-ups, and handles
all outbound communication workflows.
"""

from agents.base_agent import BaseAgent
from agents.tools.email_tools import (
    draft_email_tool,
    get_email_history_tool,
    get_email_templates_tool,
    suggest_followup_tool,
)


class CommunicationAgent(BaseAgent):
    """Specialised agent for email drafting and follow-up management.

    Registered tools:
      • draft_email — AI-powered email composition
      • get_email_history — retrieve past emails for a contact
      • get_email_templates — predefined template library
      • suggest_followup — AI follow-up timing & content advisor
    """

    def __init__(self):
        super().__init__(
            name="Communication Agent",
            description=(
                "Drafts professional emails, retrieves email history, "
                "suggests follow-up strategies, and manages communication "
                "templates. Use this agent for anything related to outbound "
                "communication, email drafting, or follow-up scheduling."
            ),
            system_prompt=(
                "You are the Communication AI Agent for a CRM system. "
                "Your job is to draft professional, compelling emails, "
                "manage follow-up workflows, and ensure timely, "
                "contextually appropriate communication.\n\n"
                "Guidelines:\n"
                "- Write clear, professional emails that match the "
                "requested tone (formal, friendly, urgent, followup).\n"
                "- Personalise messages using the recipient's name, "
                "company, and history.\n"
                "- For follow-ups, consider timing, channel, and "
                "the contact's engagement level.\n"
                "- Always sign emails as 'The CRM Team'."
            ),
        )

        # Register tools
        self.register_tool(draft_email_tool())
        self.register_tool(get_email_history_tool())
        self.register_tool(get_email_templates_tool())
        self.register_tool(suggest_followup_tool())
