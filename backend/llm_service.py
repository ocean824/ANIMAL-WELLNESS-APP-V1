"""LLM service layer using Emergent Universal Key (emergentintegrations).
Provides: safety classification, coach chat (streaming), structured JSON generation, plain text generation.
All AI outputs follow Soula Paws safety guardrails: observation-based, non-diagnostic, escalation language.
"""
import json
import os
import re
import uuid
from typing import AsyncGenerator, List, Optional, Tuple, Type

from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, ValidationError

load_dotenv(Path(__file__).parent / ".env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")

BOND_COACH_SYSTEM = (
    "You are the Soula Paws AI Bond Coach, part of a privacy-first human-animal bond and wellness platform. "
    "You help users understand human-animal bonding patterns, wellness logs, rituals, bond scores, and care-circle collaboration. "
    "Rules you must always follow:\n"
    "1. Use warm, observation-based, validating language.\n"
    "2. Never diagnose medical conditions, never prescribe medication or dosages, never replace a veterinarian, "
    "never make emergency decisions, and never claim certainty when data is limited.\n"
    "3. If symptoms sound urgent, medical, persistent, or worsening, clearly advise contacting a veterinarian or emergency clinic.\n"
    "4. Keep suggested rituals low-pressure, consent-based, and safe.\n"
    "5. When you reference data limits, say so plainly (e.g., 'Based on limited recent logs...').\n"
    "6. Keep responses concise, supportive, and actionable. Use short paragraphs or brief lists."
)

HIGH_RISK = ["seizure", "poison", "bleeding", "can't breathe", "cannot breathe", "collapse",
             "unconscious", "overdose", "hit by car", "not breathing", "choking", "bloat", "blood"]
MEDIUM_RISK = ["limping", "vomiting", "diarrhea", "not eating", "pain", "aggressive", "bite",
               "medication", "lethargic", "shaking", "coughing", "itching", "wound"]


def classify_safety(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in HIGH_RISK):
        return "high"
    if any(w in lower for w in MEDIUM_RISK):
        return "medium"
    return "low"


def _new_chat(system: str, session_id: Optional[str] = None) -> LlmChat:
    return LlmChat(
        api_key=LLM_KEY,
        session_id=session_id or f"soula-{uuid.uuid4()}",
        system_message=system,
    ).with_model("openai", LLM_MODEL)


async def llm_text(system: str, prompt: str) -> str:
    """Non-streaming completion for background/structured tasks (reports, agents, voice)."""
    chat = _new_chat(system)
    resp = await chat.send_message(UserMessage(text=prompt))
    return resp if isinstance(resp, str) else str(resp)


async def stream_coach(history: List[dict], message: str, context: str) -> AsyncGenerator[Tuple[str, str], None]:
    """Streams (event, data) tuples: ('delta', token) then ('done', full_text).
    Rebuilds multi-turn history into a fresh LlmChat each call (history persisted in our DB)."""
    history_block = ""
    if history:
        lines = []
        for m in history[-12:]:
            speaker = "User" if m["role"] == "user" else "Coach"
            lines.append(f"{speaker}: {m['content']}")
        history_block = "Previous conversation:\n" + "\n".join(lines) + "\n\n"
    prompt = f"{context}\n\n{history_block}User message: {message}"
    chat = _new_chat(BOND_COACH_SYSTEM)
    full = ""
    async for event in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(event, TextDelta):
            full += event.content
            yield ("delta", event.content)
        elif isinstance(event, StreamDone):
            break
    yield ("done", full)


async def llm_json(system: str, prompt: str, model_cls: Type[BaseModel], retries: int = 3) -> BaseModel:
    """Structured JSON generation with Pydantic validation and retry."""
    last_err = None
    for _ in range(retries):
        content = await llm_text(system, prompt)
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
        try:
            return model_cls(**json.loads(cleaned))
        except (json.JSONDecodeError, ValidationError, TypeError) as e:
            last_err = e
    raise ValueError(f"Structured generation failed: {last_err}")
