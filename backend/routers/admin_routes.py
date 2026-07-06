"""Admin routes: user management, metrics, escalations, system health."""
from fastapi import APIRouter, Depends, HTTPException

from auth_utils import hash_password, require_admin
from database import (audit, create_record, db, find_record, list_records, now_iso,
                      sanitize_user, soft_delete_record, update_record)
from models import AdminUserCreate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def users(admin=Depends(require_admin)):
    records = await list_records("users", limit=500)
    return [sanitize_user(u) for u in records]


@router.post("/users", status_code=201)
async def create_user(body: AdminUserCreate, admin=Depends(require_admin)):
    existing = await db.users.find_one({"email": body.email.lower(), "deletedAt": None})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = await create_record("users", {
        "email": body.email.lower(),
        "passwordHash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "isActive": True,
        "lastLoginAt": None,
    })
    await audit("admin.user_create", "users", user["id"], admin["id"], {"role": body.role})
    return sanitize_user(user)


@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: dict, admin=Depends(require_admin)):
    user = await find_record("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    patch = {}
    if "name" in body:
        patch["name"] = body["name"]
    if "role" in body and body["role"] in ("owner", "caregiver", "provider", "admin"):
        patch["role"] = body["role"]
    if "isActive" in body:
        patch["isActive"] = bool(body["isActive"])
    if body.get("password"):
        if len(body["password"]) < 8:
            raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
        patch["passwordHash"] = hash_password(body["password"])
    if not patch:
        raise HTTPException(status_code=422, detail="No updatable fields provided.")
    updated = await update_record("users", user_id, patch)
    await audit("admin.user_update", "users", user_id, admin["id"], {"fields": list(patch.keys())})
    return sanitize_user(updated)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot archive your own admin account.")
    deleted = await soft_delete_record("users", user_id, admin["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found.")
    await audit("admin.user_delete", "users", user_id, admin["id"])
    return {"message": "User archived (soft delete)."}


@router.get("/metrics")
async def metrics(admin=Depends(require_admin)):
    async def count(col, q=None):
        query = dict(q or {})
        query["deletedAt"] = None
        return await db[col].count_documents(query)

    ai_calls = await count("auditLogs", {"action": {"$in": ["ai.chat", "ai.generate_ritual", "agent.run", "voice.message"]}})
    return {
        "activeUsers": await count("users", {"isActive": True}),
        "totalPets": await count("petProfiles"),
        "totalCheckins": await count("dailyCheckins"),
        "totalWellnessLogs": await count("wellnessLogs"),
        "totalRituals": await count("rituals"),
        "ritualCompletions": await count("ritualCompletions"),
        "bondScores": await count("bondScores"),
        "aiConversations": await count("aiConversations"),
        "aiUsageCalls": ai_calls,
        "reports": await count("reports"),
        "agentRuns": await count("agentRuns"),
        "pendingApprovals": await count("agentApprovals", {"status": "pending"}),
        "openTickets": await count("supportTickets", {"status": "open"}),
        "urgentTickets": await count("supportTickets", {"status": "open", "priority": "urgent"}),
        "auditLogEntries": await count("auditLogs"),
    }


@router.get("/escalations")
async def escalations(admin=Depends(require_admin)):
    tickets = await list_records("supportTickets", {"status": "open"})
    approvals = await list_records("agentApprovals", {"status": "pending"})
    high_risk_messages = await list_records("aiMessages", {"safetyLevel": "high", "role": "user"}, limit=50)
    return {"openTickets": tickets, "pendingApprovals": approvals, "highRiskMessages": high_risk_messages}


@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, body: dict, admin=Depends(require_admin)):
    patch = {}
    if body.get("status") in ("open", "in_progress", "resolved", "closed"):
        patch["status"] = body["status"]
    if body.get("resolution"):
        patch["resolution"] = body["resolution"]
    if not patch:
        raise HTTPException(status_code=422, detail="Provide status or resolution.")
    updated = await update_record("supportTickets", ticket_id, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    await audit("admin.ticket_update", "supportTickets", ticket_id, admin["id"], patch)
    return updated


@router.get("/system-health")
async def system_health(admin=Depends(require_admin)):
    import os
    db_ok = True
    try:
        await db.command("ping")
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "error",
        "aiProvider": "configured" if os.environ.get("EMERGENT_LLM_KEY") else "missing_key",
        "model": os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        "time": now_iso(),
    }
