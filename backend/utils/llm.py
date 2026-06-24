"""
LLM Client — Gemini API wrapper for the Multi-Agent CRM.

Provides a singleton LLMClient that all agents use to communicate with
Google's Gemini 2.0 Flash model.  Every call is wrapped in error handling
so a transient API failure never crashes the application.
"""

import json
import re
import google.generativeai as genai

from config import GEMINI_API_KEY


class LLMClient:
    """Thin wrapper around the Gemini generative-AI SDK."""

    def __init__(self, api_key: str):
        """Configure the SDK and select the model.

        Args:
            api_key: Google AI Studio / Vertex API key.
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    # ------------------------------------------------------------------ #
    #  Public helpers
    # ------------------------------------------------------------------ #

    def generate(self, prompt: str, system_instruction: str | None = None) -> str:
        """Send a plain-text prompt and return the model's text response.

        Args:
            prompt: The user / agent prompt.
            system_instruction: Optional system-level instruction prepended
                                to the conversation.

        Returns:
            The model's text response, or an error string on failure.
        """
        try:
            full_prompt = self._build_full_prompt(prompt, system_instruction)
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as exc:
            return f"[LLM Error] {type(exc).__name__}: {exc}"

    def generate_json(self, prompt: str, system_instruction: str | None = None) -> dict:
        """Send a prompt and attempt to parse a JSON object from the reply.

        The method first tries ``json.loads`` on the raw text.  If that
        fails it falls back to a regex that extracts the first ``{…}``
        block (handles markdown-fenced responses).

        Args:
            prompt: The user / agent prompt.
            system_instruction: Optional system-level instruction.

        Returns:
            Parsed dict on success, or ``{"error": "…"}`` on failure.
        """
        try:
            full_prompt = self._build_full_prompt(prompt, system_instruction)
            response = self.model.generate_content(full_prompt)
            text = response.text.strip()
            return self._parse_json(text)
        except Exception as exc:
            return {"error": f"[LLM Error] {type(exc).__name__}: {exc}"}

    # ------------------------------------------------------------------ #
    #  Internal helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_full_prompt(prompt: str, system_instruction: str | None) -> str:
        """Optionally prepend a system instruction to the prompt."""
        if system_instruction:
            return f"[System Instruction]\n{system_instruction}\n\n[User Query]\n{prompt}"
        return prompt

    @staticmethod
    def _parse_json(text: str) -> dict:
        """Best-effort JSON extraction from model output.

        Strategy:
        1. Direct ``json.loads``.
        2. Strip markdown code fences and retry.
        3. Regex-extract the first ``{…}`` block (greedy, DOTALL).
        """
        # Attempt 1 — direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Attempt 2 — strip ```json … ``` fences
        cleaned = re.sub(r"```(?:json)?\s*", "", text)
        cleaned = cleaned.strip().rstrip("`")
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Attempt 3 — extract first JSON object via regex
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        return {"error": f"Failed to parse JSON from LLM response: {text[:200]}"}


# ---------------------------------------------------------------------- #
#  Singleton accessor
# ---------------------------------------------------------------------- #

_llm_instance: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Return (and lazily create) the global LLMClient singleton."""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMClient(api_key=GEMINI_API_KEY)
    return _llm_instance
