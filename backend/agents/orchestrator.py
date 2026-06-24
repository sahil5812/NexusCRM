"""
Orchestrator Agent — the central brain that routes user queries to
the appropriate specialised agent(s) and unifies their responses.

This is the main entry-point for the agent system.  Every incoming
chat message passes through the orchestrator, which uses the LLM to
decide which agent(s) should handle the request, dispatches the work,
and then synthesises a single, coherent response.
"""

from __future__ import annotations

import json
import time
import traceback
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from utils.llm import get_llm_client
from models.agent_log import AgentLog

from agents.lead_agent import LeadIntelligenceAgent
from agents.communication_agent import CommunicationAgent
from agents.support_agent import CustomerSupportAgent
from agents.analytics_agent import AnalyticsAgent


class OrchestratorAgent:
    """Routes user queries to one or more specialised agents.

    Workflow:
    1. Present the query + agent catalogue to the LLM.
    2. LLM returns a routing plan in JSON.
    3. Execute each selected agent's ``run()`` method.
    4. Combine all results and ask the LLM to produce a unified response.
    5. Log the orchestration to ``agent_logs``.
    """

    def __init__(self):
        self.name = "Orchestrator"
        self.agents = {
            "lead": LeadIntelligenceAgent(),
            "communication": CommunicationAgent(),
            "support": CustomerSupportAgent(),
            "analytics": AnalyticsAgent(),
        }
        self.llm = get_llm_client()

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    def route(self, query: str, db: Session) -> dict:
        """Route *query* to the right agent(s) and return a unified response.

        Returns:
            dict with keys ``response``, ``agents_used``, ``actions_taken``.
        """
        start = time.time()

        try:
            # ---- Step 1: Ask LLM which agents to involve ----
            routing_plan = self._get_routing_plan(query)

            selected_agents: list[str] = routing_plan.get("agents", [])
            tasks: list[str] = routing_plan.get("tasks", [])

            # Validate selections
            selected_agents = [a for a in selected_agents if a in self.agents]

            if not selected_agents:
                # Fallback — let the LLM answer directly
                direct = self.llm.generate(
                    f"You are a helpful CRM assistant. Answer: {query}"
                )
                self._log(db, query, direct, time.time() - start, [])
                return {
                    "response": direct,
                    "agents_used": [],
                    "actions_taken": [],
                }

            # ---- Step 2: Execute each agent ----
            agent_results: dict[str, dict] = {}
            all_actions: list[str] = []

            for idx, agent_key in enumerate(selected_agents):
                agent = self.agents[agent_key]
                task = tasks[idx] if idx < len(tasks) else query

                result = agent.run(task, db)
                agent_results[agent_key] = {
                    "agent_name": agent.name,
                    "message": result.message,
                    "data": result.data,
                }
                all_actions.extend(
                    f"[{agent.name}] {a}" for a in result.actions_taken
                )

            # ---- Step 3: Unify results ----
            unified = self._unify_results(query, agent_results)

            duration = time.time() - start
            self._log(db, query, unified, duration, selected_agents)

            return {
                "response": unified,
                "agents_used": selected_agents,
                "actions_taken": all_actions,
            }

        except Exception as exc:
            traceback.print_exc()
            duration = time.time() - start
            error_msg = f"I ran into an issue while processing your request: {exc}"
            self._log(db, query, error_msg, duration, [])
            return {
                "response": error_msg,
                "agents_used": [],
                "actions_taken": [],
            }

    # ------------------------------------------------------------------ #
    #  Internal helpers
    # ------------------------------------------------------------------ #

    def _get_routing_plan(self, query: str) -> dict:
        """Ask the LLM to decide which agents should handle *query*."""
        agent_catalogue = "\n".join(
            f'- "{key}": {agent.description}'
            for key, agent in self.agents.items()
        )

        prompt = f"""You are the Orchestrator for a multi-agent CRM system.
Your job is to route the user's query to the most appropriate agent(s).

Available agents:
{agent_catalogue}

User query: "{query}"

Decide which agent(s) should handle this query. You can select multiple
agents if the query spans several domains.

Respond in JSON only:
{{
  "agents": ["agent_key_1", "agent_key_2"],
  "tasks": ["specific task for agent 1", "specific task for agent 2"],
  "reasoning": "brief explanation"
}}

Rules:
- "agents" must only contain keys from the list above.
- Each entry in "tasks" maps 1-to-1 with "agents" and describes what
  that specific agent should do.
- If the query is simple and one agent suffices, use a single-element list.
- If you are unsure, default to the agent whose description best matches.
"""
        return self.llm.generate_json(prompt)

    def _unify_results(self, query: str, agent_results: dict) -> str:
        """Ask the LLM to merge all agent outputs into one response."""
        results_str = json.dumps(agent_results, indent=2, default=str)

        prompt = f"""You are the Orchestrator for a multi-agent CRM system.
Multiple agents have processed the user's query and returned results.

User's original query: "{query}"

Agent results:
{results_str}

Synthesise a single, clear, and well-structured response that covers all
agent outputs. Be conversational yet professional. Include specific data
points, numbers, and actionable recommendations where applicable.

Do NOT use JSON — respond in plain text / markdown.
"""
        return self.llm.generate(prompt)

    def _log(
        self,
        db: Session,
        query: str,
        response: str,
        duration: float,
        agents_used: list[str],
    ) -> None:
        """Persist an orchestration log entry."""
        try:
            log = AgentLog(
                agent_name=self.name,
                task_type="orchestration",
                input_query=query[:1000],
                output_response=response[:2000],
                duration_seconds=round(duration, 3),
                created_at=datetime.now(timezone.utc),
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
            traceback.print_exc()
