"""MongoDB persistence layer for Soula Paws.
Architecture improvement over source: JSON-file persistence -> real async MongoDB (Motor).
All documents use string uuid `id`, ISO-string datetimes, and soft-delete (deletedAt/deletedBy).
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()


async def create_record(collection: str, data: Dict[str, Any]) -> Dict[str, Any]:
    doc = dict(data)
    doc.setdefault("id", str(uuid.uuid4()))
    doc.setdefault("createdAt", now_iso())
    doc.setdefault("updatedAt", now_iso())
    doc.setdefault("deletedAt", None)
    doc.setdefault("deletedBy", None)
    await db[collection].insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


async def list_records(
    collection: str,
    query: Optional[Dict[str, Any]] = None,
    include_deleted: bool = False,
    limit: int = 500,
    sort_field: str = "createdAt",
    sort_dir: int = -1,
) -> List[Dict[str, Any]]:
    q = dict(query or {})
    if not include_deleted:
        q["deletedAt"] = None
    cursor = db[collection].find(q, {"_id": 0}).sort(sort_field, sort_dir).limit(limit)
    return await cursor.to_list(length=limit)


async def find_record(collection: str, record_id: str, include_deleted: bool = False) -> Optional[Dict[str, Any]]:
    q: Dict[str, Any] = {"id": record_id}
    if not include_deleted:
        q["deletedAt"] = None
    return await db[collection].find_one(q, {"_id": 0})


async def update_record(collection: str, record_id: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    patch = dict(patch)
    patch["updatedAt"] = now_iso()
    patch.pop("id", None)
    patch.pop("_id", None)
    result = await db[collection].update_one({"id": record_id, "deletedAt": None}, {"$set": patch})
    if result.matched_count == 0:
        return None
    return await find_record(collection, record_id)


async def soft_delete_record(collection: str, record_id: str, deleted_by: Optional[str] = None) -> Optional[Dict[str, Any]]:
    result = await db[collection].update_one(
        {"id": record_id, "deletedAt": None},
        {"$set": {"deletedAt": now_iso(), "deletedBy": deleted_by, "updatedAt": now_iso()}},
    )
    if result.matched_count == 0:
        return None
    return await find_record(collection, record_id, include_deleted=True)


async def audit(action: str, entity_type: str, entity_id: Optional[str] = None,
                user_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None,
                request_id: Optional[str] = None):
    await create_record("auditLogs", {
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "userId": user_id,
        "metadata": metadata or {},
        "requestId": request_id,
    })


def sanitize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "isActive": user.get("isActive", True),
        "lastLoginAt": user.get("lastLoginAt"),
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt"),
    }


async def ensure_indexes():
    await db.users.create_index("email")
    await db.users.create_index("id")
    for col in ["petProfiles", "humanProfiles", "dailyCheckins", "wellnessLogs", "rituals",
                "ritualCompletions", "bondScores", "relationshipInsights", "aiConversations",
                "aiMessages", "reports", "notifications", "consentRecords", "relationshipPods",
                "podMembers", "careCircleMembers", "agentTasks", "agentApprovals",
                "supportTickets", "voiceConversations", "voiceMessages", "auditLogs"]:
        await db[col].create_index("id")
        await db[col].create_index("createdAt")
        await db[col].create_index("userId")
    await db.dailyCheckins.create_index("petId")
    await db.wellnessLogs.create_index("petId")
    await db.bondScores.create_index("petId")
    await db.aiMessages.create_index("conversationId")
    await db.voiceMessages.create_index("conversationId")
    await db.passwordResetTokens.create_index("tokenHash")
