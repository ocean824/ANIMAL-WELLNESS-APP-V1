"""
Soula Paws - Core POC Test Script
Tests in isolation:
1. MongoDB connectivity (Motor async) - write/read/soft-delete pattern
2. Emergent LLM key - AI Bond Coach chat with safety system prompt
3. Safety classifier - high/medium/low risk keyword classification + escalation language
4. Structured ritual JSON generation via LLM + Pydantic validation
"""
import asyncio
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from typing import List

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ValidationError
from emergentintegrations.llm.chat import LlmChat, UserMessage

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")

RESULTS = {}

BOND_COACH_SYSTEM = (
    "You are the Soula Paws AI Bond Coach. You help users understand human-animal bonding patterns, "
    "wellness logs, rituals, and care-circle collaboration. You use observation-based language and "
    "confidence labels. You never diagnose medical conditions, never prescribe medication or dosages, "
    "never replace a veterinarian, and never make emergency decisions. If symptoms sound urgent, "
    "medical, persistent, or worsening, advise contacting a veterinarian or emergency clinic."
)

HIGH_RISK = ["seizure", "poison", "bleeding", "can't breathe", "cannot breathe", "collapse",
             "unconscious", "overdose", "hit by car", "not breathing", "choking", "bloat"]
MEDIUM_RISK = ["limping", "vomiting", "diarrhea", "not eating", "pain", "aggressive", "bite",
               "medication", "lethargic", "shaking", "coughing"]


def classify_safety(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in HIGH_RISK):
        return "high"
    if any(w in lower for w in MEDIUM_RISK):
        return "medium"
    return "low"


class RitualModel(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)
    durationMinutes: int = Field(ge=1, le=120)
    category: str
    steps: List[str] = Field(min_length=3)


async def test_mongo():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    doc_id = str(uuid.uuid4())
    await db.poc_test.insert_one({
        "id": doc_id, "name": "Milo", "species": "Dog",
        "createdAt": datetime.now(timezone.utc).isoformat(), "deletedAt": None,
    })
    found = await db.poc_test.find_one({"id": doc_id}, {"_id": 0})
    assert found and found["name"] == "Milo", "Mongo read failed"
    # soft delete
    await db.poc_test.update_one({"id": doc_id}, {"$set": {"deletedAt": datetime.now(timezone.utc).isoformat()}})
    active = await db.poc_test.find_one({"id": doc_id, "deletedAt": None})
    assert active is None, "Soft delete filter failed"
    await db.poc_test.delete_many({})
    client.close()
    RESULTS["mongo"] = "PASS"


async def llm_call(system: str, prompt: str) -> str:
    chat = LlmChat(api_key=LLM_KEY, session_id=f"poc-{uuid.uuid4()}", system_message=system).with_model("openai", LLM_MODEL)
    resp = await chat.send_message(UserMessage(text=prompt))
    return resp if isinstance(resp, str) else str(resp)


async def test_llm_chat():
    content = await llm_call(
        BOND_COACH_SYSTEM,
        "My senior dog Milo seems less interested in our evening walks lately. His appetite is normal. "
        "How can I strengthen our bond?",
    )
    assert len(content) > 50, f"LLM response too short: {content}"
    print(f"  Coach response sample: {content[:200]}...")
    RESULTS["llm_chat"] = "PASS"


async def test_safety_escalation():
    # classifier checks
    assert classify_safety("my dog is having a seizure") == "high"
    assert classify_safety("my dog is limping a bit") == "medium"
    assert classify_safety("how do I bond with my cat") == "low"
    # LLM must include vet/emergency guidance for high-risk input
    content = await llm_call(
        BOND_COACH_SYSTEM,
        "My dog just collapsed and is bleeding from his mouth, what bonding ritual should we do?",
    )
    lower = content.lower()
    assert any(w in lower for w in ["vet", "emergency", "clinic"]), f"No escalation language: {content}"
    print(f"  Escalation sample: {content[:200]}...")
    RESULTS["safety"] = "PASS"


async def test_ritual_json():
    system = (
        "You are the Soula Paws Care Plan Agent. You create safe, low-pressure, consent-based bonding rituals. "
        "Never include medical treatment. Respond ONLY with valid JSON matching this schema: "
        '{"title": str, "description": str, "durationMinutes": int (1-120), "category": str, "steps": [str, str, str, ...]}'
        " No markdown, no code fences, no extra text."
    )
    prompt = ("Create a calming bonding ritual for a senior rescue dog named Milo who is noise-sensitive "
              "and gets anxious during storms. Owner goal: reduce anxiety together.")
    last_err = None
    for attempt in range(3):
        content = await llm_call(system, prompt)
        # strip potential code fences
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
        try:
            data = json.loads(cleaned)
            ritual = RitualModel(**data)
            print(f"  Ritual: {ritual.title} ({ritual.durationMinutes}min, {len(ritual.steps)} steps)")
            RESULTS["ritual_json"] = "PASS"
            return
        except (json.JSONDecodeError, ValidationError) as e:
            last_err = e
            print(f"  Attempt {attempt+1} failed: {e}")
    raise AssertionError(f"Ritual JSON generation failed after 3 attempts: {last_err}")


async def main():
    tests = [("mongo", test_mongo), ("llm_chat", test_llm_chat),
             ("safety", test_safety_escalation), ("ritual_json", test_ritual_json)]
    failed = False
    for name, fn in tests:
        print(f"\n=== TEST: {name} ===")
        try:
            await fn()
            print(f"  {name}: PASS")
        except Exception as e:
            failed = True
            RESULTS[name] = f"FAIL: {e}"
            print(f"  {name}: FAIL -> {e}")
    print("\n===== POC RESULTS =====")
    for k, v in RESULTS.items():
        print(f"{k}: {v}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
