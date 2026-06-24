"""
Base Agent — foundation for every specialised agent in the CRM.

Defines the Tool / AgentResponse data classes and the BaseAgent abstract
class that handles:
  • tool registration & execution
  • LLM-driven reasoning (decide which tools to call)
  • structured JSON prompting
  • automatic logging to the AgentLog table
"""

from __future__ import annotations

import time
import json
import traceback
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from utils.llm import get_llm_client
from models.agent_log import AgentLog


# ---------------------------------------------------------------------- #
#  Data classes
# ---------------------------------------------------------------------- #

class Tool:
    """Describes a callable tool that an agent can invoke."""

    def __init__(
        self,
        name: str,
        description: str,
        function: callable,
        parameters: dict,
    ):
        """
        Args:
            name: Unique tool identifier (e.g. ``get_all_leads``).
            description: Human-readable explanation shown to the LLM.
            function: The actual Python callable — signature must be
                      ``(db: Session, **params) -> Any``.
            parameters: Dict mapping param names to their descriptions,
                        e.g. ``{"status": "Filter by lead status"}``.
        """
        self.name = name
        self.description = description
        self.function = function
        self.parameters = parameters


class AgentResponse:
    """Structured response returned by every agent invocation."""

    def __init__(
        self,
        message: str,
        data: dict | None = None,
        actions_taken: list | None = None,
    ):
        self.message = message
        self.data = data or {}
        self.actions_taken = actions_taken or []

    def to_dict(self) -> dict:
        return {
            "message": self.message,
            "data": self.data,
            "actions_taken": self.actions_taken,
        }


# ---------------------------------------------------------------------- #
#  BaseAgent
# ---------------------------------------------------------------------- #

class BaseAgent:
    """Abstract base for all CRM agents.

    Subclasses only need to register their tools in ``__init__``; the
    reasoning loop (prompt → LLM → tool calls → response) is handled
    entirely by :py:meth:`run`.
    """

    def __init__(self, name: str, description: str, system_prompt: str):
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.tools: list[Tool] = []
        self.llm = get_llm_client()

    # ------------------------------------------------------------------ #
    #  Tool management
    # ------------------------------------------------------------------ #

    def register_tool(self, tool: Tool) -> None:
        """Add a tool to this agent's toolbox."""
        self.tools.append(tool)

    def get_tools_description(self) -> str:
        """Format every registered tool into a prompt-friendly string."""
        if not self.tools:
            return "No tools available."

        lines: list[str] = []
        for t in self.tools:
            params_str = ", ".join(
                f"{k} ({v})" for k, v in t.parameters.items()
            ) if t.parameters else "none"
            lines.append(
                f"- **{t.name}**: {t.description}\n"
                f"  Parameters: {params_str}"
            )
        return "\n".join(lines)

    def execute_tool(self, tool_name: str, params: dict, db: Session):
        """Look up *tool_name* and run it with *params*.

        Returns:
            The tool's return value, or an error dict if the tool is not
            found or raises.
        """
        tool = next((t for t in self.tools if t.name == tool_name), None)
        if tool is None:
            return {"error": f"Tool '{tool_name}' not found"}

        try:
            return tool.function(db, **params)
        except Exception as exc:
            return {"error": f"Tool '{tool_name}' failed: {exc}"}

    # ------------------------------------------------------------------ #
    #  Main reasoning loop
    # ------------------------------------------------------------------ #

    def run(self, query: str, db: Session) -> AgentResponse:
        """Execute the full agent loop for a given user query.

        Steps:
        1. Build a prompt that includes the system prompt, available
           tools, and the user's query.
        2. Ask the LLM to reason and produce a structured JSON answer.
        3. Parse tool calls from the JSON and execute them.
        4. Compile a final response using tool results.
        5. Log the action to the ``agent_logs`` table.
        """
        start = time.time()
        actions_taken: list[str] = []
        tool_results: dict = {}

        try:
            # ---- Step 1-2: LLM reasoning ----
            prompt = self._build_prompt(query)
            llm_decision = self.llm.generate_json(prompt)

            if "error" in llm_decision and len(llm_decision) == 1:
                duration = time.time() - start
                error_msg = f"I encountered an issue while processing your request: {llm_decision['error']}"
                self._log_action(
                    db=db,
                    task_type=self.name,
                    input_query=query,
                    output=error_msg[:2000],
                    duration=duration,
                )
                return AgentResponse(
                    message=error_msg,
                    data={"llm_error": llm_decision["error"]},
                )

            thought = llm_decision.get("thought", "")
            tool_calls = llm_decision.get("tool_calls", [])
            direct_response = llm_decision.get("response", "")

            # ---- Step 3: Execute tool calls ----
            if tool_calls:
                for tc in tool_calls:
                    tool_name = tc.get("tool", "")
                    tool_params = tc.get("params", {})
                    result = self.execute_tool(tool_name, tool_params, db)
                    tool_results[tool_name] = result
                    actions_taken.append(f"Called {tool_name}")

                # ---- Step 4: Summarise with tool outputs ----
                summary_prompt = (
                    f"{self.system_prompt}\n\n"
                    f"The user asked: {query}\n\n"
                    f"Your reasoning: {thought}\n\n"
                    f"Tool results:\n{json.dumps(tool_results, indent=2, default=str)}\n\n"
                    "Based on these results, provide a clear and helpful "
                    "response to the user. Be specific and data-driven."
                )
                final_response = self.llm.generate(summary_prompt)
            else:
                final_response = direct_response or "I processed your request but have no specific data to share."

        except Exception as exc:
            final_response = f"An error occurred: {exc}"
            traceback.print_exc()

        duration = time.time() - start

        # ---- Step 5: Log ----
        self._log_action(
            db=db,
            task_type=self.name,
            input_query=query,
            output=final_response[:2000],
            duration=duration,
        )

        return AgentResponse(
            message=final_response,
            data=tool_results,
            actions_taken=actions_taken,
        )

    # ------------------------------------------------------------------ #
    #  Prompt construction
    # ------------------------------------------------------------------ #

    def _build_prompt(self, query: str) -> str:
        """Combine system prompt, tool catalogue, and the user query.

        The prompt instructs the LLM to respond in a strict JSON schema
        so the agent loop can parse tool calls deterministically.
        """
        tools_desc = self.get_tools_description()

        return f"""{self.system_prompt}

## Available Tools
{tools_desc}

## Response Format
You MUST respond in the following JSON format — no markdown, no extra text:
{{
  "thought": "your step-by-step reasoning about what tools to use and why",
  "tool_calls": [
    {{"tool": "tool_name", "params": {{"param_name": "value"}}}}
  ],
  "response": "A natural-language response to the user (used when no tools are needed)"
}}

Rules:
- If you need data or must perform an action, populate "tool_calls".
- If you can answer directly without tools, leave "tool_calls" as an empty list and put your answer in "response".
- Only use tools that are listed above.
- Always include a "thought" explaining your reasoning.

## User Query
{query}
"""

    # ------------------------------------------------------------------ #
    #  Logging
    # ------------------------------------------------------------------ #

    def _log_action(
        self,
        db: Session,
        task_type: str,
        input_query: str,
        output: str,
        duration: float,
    ) -> None:
        """Persist an entry in the ``agent_logs`` table."""
        try:
            log = AgentLog(
                agent_name=self.name,
                task_type=task_type,
                input_query=input_query[:1000],
                output_response=output[:2000],
                duration_seconds=round(duration, 3),
                created_at=datetime.now(timezone.utc),
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
            traceback.print_exc()
