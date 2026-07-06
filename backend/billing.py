"""Plan tiers & usage quota scaffolding (Phase 7 monetization, without payment wiring).
Stripe checkout will be connected later (e.g., on Replit) - until then upgrades are a recorded intent.
"""
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import HTTPException

from database import db

PLAN_LIMITS: Dict[str, Dict[str, Optional[int]]] = {
    "free": {
        "aiCallsPerMonth": 100,
        "maxPets": 3,
        "reportsPerMonth": 10,
        "agentRunsPerMonth": 30,
    },
    "premium": {
        "aiCallsPerMonth": None,  # unlimited
        "maxPets": None,
        "reportsPerMonth": None,
        "agentRunsPerMonth": None,
    },
}

AI_ACTIONS = ["ai.chat", "ai.generate_ritual", "voice.message"]


def user_plan(user: Dict) -> str:
    plan = user.get("plan", "free")
    return plan if plan in PLAN_LIMITS else "free"


def _month_start_iso() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


async def get_usage(user_id: str) -> Dict[str, int]:
    month_start = _month_start_iso()
    ai_calls = await db.auditLogs.count_documents({
        "userId": user_id, "action": {"$in": AI_ACTIONS}, "createdAt": {"$gte": month_start}, "deletedAt": None,
    })
    reports = await db.auditLogs.count_documents({
        "userId": user_id, "action": "report.generate", "createdAt": {"$gte": month_start}, "deletedAt": None,
    })
    agent_runs = await db.auditLogs.count_documents({
        "userId": user_id, "action": "agent.run", "createdAt": {"$gte": month_start}, "deletedAt": None,
    })
    pets = await db.petProfiles.count_documents({"userId": user_id, "deletedAt": None})
    return {"aiCallsThisMonth": ai_calls, "reportsThisMonth": reports, "agentRunsThisMonth": agent_runs, "activePets": pets}


async def check_quota(user: Dict, kind: str):
    """kind: 'ai' | 'reports' | 'agent_runs' | 'pets'. Raises 402 when the plan limit is reached."""
    plan = user_plan(user)
    limits = PLAN_LIMITS[plan]
    usage = await get_usage(user["id"])
    checks = {
        "ai": (usage["aiCallsThisMonth"], limits["aiCallsPerMonth"], "AI assistant calls this month"),
        "reports": (usage["reportsThisMonth"], limits["reportsPerMonth"], "generated reports this month"),
        "agent_runs": (usage["agentRunsThisMonth"], limits["agentRunsPerMonth"], "agent runs this month"),
        "pets": (usage["activePets"], limits["maxPets"], "active pet profiles"),
    }
    used, limit, label = checks[kind]
    if limit is not None and used >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"You've reached the {plan} plan limit of {limit} {label}. Upgrade to Premium in Plan & Billing for unlimited access.",
        )
