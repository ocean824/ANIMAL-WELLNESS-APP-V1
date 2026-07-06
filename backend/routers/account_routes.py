"""Account routes: plan & billing scaffolding (Phase 7, payment wiring deferred) and privacy data
export / deletion requests (privacy-first commitments from the product docs)."""
from fastapi import APIRouter, Depends

from auth_utils import get_current_user, rate_limit
from billing import PLAN_LIMITS, get_usage, user_plan
from database import audit, create_record, list_records, now_iso, sanitize_user

router = APIRouter(tags=["account"])

EXPORT_COLLECTIONS = {
    "humanProfiles": "userId", "petProfiles": "userId", "relationshipPods": "userId",
    "podMembers": "ownerUserId", "careCircleMembers": "ownerUserId", "dailyCheckins": "userId",
    "wellnessLogs": "userId", "rituals": "userId", "ritualCompletions": "userId",
    "bondScores": "userId", "relationshipInsights": "userId", "aiConversations": "userId",
    "aiMessages": "userId", "reports": "userId", "notifications": "userId",
    "consentRecords": "userId", "agentTasks": "createdByUserId", "agentApprovals": "userId",
    "supportTickets": "userId", "voiceConversations": "userId", "voiceMessages": "userId",
}


@router.get("/billing/plan")
async def billing_plan(user=Depends(get_current_user)):
    plan = user_plan(user)
    return {
        "plan": plan,
        "limits": PLAN_LIMITS[plan],
        "allPlans": PLAN_LIMITS,
        "usage": await get_usage(user["id"]),
        "paymentsEnabled": False,
        "note": "Payment processing (Stripe) is not connected yet. Upgrades are recorded and will activate once billing is wired in.",
    }


@router.post("/billing/upgrade")
async def billing_upgrade(user=Depends(get_current_user)):
    """Records upgrade intent. Stripe checkout will replace this once the payment provider is connected."""
    await create_record("billingEvents", {
        "userId": user["id"],
        "type": "upgrade_intent",
        "fromPlan": user_plan(user),
        "toPlan": "premium",
        "status": "pending_payment_integration",
    })
    await create_record("notifications", {
        "userId": user["id"],
        "title": "Upgrade request recorded",
        "body": "Thanks for your interest in Premium. Payments aren't connected yet - your request is saved and you'll be notified when checkout goes live.",
        "readAt": None,
    })
    await audit("billing.upgrade_intent", "billingEvents", None, user["id"])
    return {
        "status": "pending_payment_integration",
        "message": "Upgrade request recorded. Stripe checkout will be connected soon - no charge has been made.",
    }


@router.get("/privacy/export")
async def privacy_export(user=Depends(get_current_user)):
    """Full JSON export of the user's own data (privacy-first commitment)."""
    rate_limit(f"export:{user['id']}", 5, 300)
    data = {"exportedAt": now_iso(), "user": sanitize_user(user), "plan": user_plan(user)}
    for collection, owner_field in EXPORT_COLLECTIONS.items():
        data[collection] = await list_records(collection, {owner_field: user["id"]}, limit=1000)
    await audit("privacy.export", "users", user["id"], user["id"])
    return data


@router.post("/privacy/delete-request")
async def privacy_delete_request(user=Depends(get_current_user)):
    """Account deletion goes through verified human review (per product docs)."""
    rate_limit(f"delreq:{user['id']}", 3, 300)
    existing = await list_records("supportTickets", {"userId": user["id"], "category": "privacy", "status": "open"}, limit=10)
    if any("deletion" in (t.get("subject") or "").lower() for t in existing):
        return {"status": "already_pending", "message": "A deletion request is already open. Our privacy team will follow up."}
    ticket = await create_record("supportTickets", {
        "userId": user["id"],
        "subject": "[privacy] Account deletion request",
        "description": f"User {user['email']} requested account deletion via Privacy & Consent page. Requires verified human review.",
        "category": "privacy",
        "priority": "high",
        "status": "open",
        "source": "privacy_page",
        "conversationId": None,
    })
    await create_record("notifications", {
        "userId": user["id"],
        "title": "Deletion request received",
        "body": "Your account deletion request was created. Our privacy team will verify and process it - you'll be contacted before anything is removed.",
        "readAt": None,
    })
    await audit("privacy.delete_request", "supportTickets", ticket["id"], user["id"])
    return {"status": "created", "ticketId": ticket["id"], "message": "Deletion request created. A human will verify and follow up."}
