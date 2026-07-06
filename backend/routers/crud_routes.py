"""Generic CRUD router for all registered resources with ownership scoping,
reference-ownership validation, soft delete, and audit logging."""
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from auth_utils import get_current_user
from billing import check_quota
from database import (audit, create_record, find_record, list_records,
                      soft_delete_record, update_record)
from models import PROTECTED_FIELDS, REF_CHECKS, RESOURCES

router = APIRouter(tags=["crud"])

FILTER_PARAMS = ["petId", "podId", "conversationId", "ritualId", "taskId", "status", "date", "runId", "category", "consentType"]


def _sanitize(value):
    """Strip MongoDB operator keys ($...) and dotted keys to prevent operator injection."""
    if isinstance(value, dict):
        return {k: _sanitize(v) for k, v in value.items() if isinstance(k, str) and not k.startswith("$") and "." not in k}
    if isinstance(value, list):
        return [_sanitize(v) for v in value]
    return value


def _cfg(resource: str) -> Dict[str, Any]:
    cfg = RESOURCES.get(resource)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Unknown API resource '{resource}'.")
    return cfg


def _is_admin(user: Dict) -> bool:
    return user.get("role") == "admin"


async def _validate_refs(body: Dict, user: Dict):
    """Prevent wiring records to another user's data."""
    if _is_admin(user):
        return
    for field, collection in REF_CHECKS.items():
        if field in body and body[field] and collection:
            ref = await find_record(collection, body[field])
            if not ref:
                raise HTTPException(status_code=400, detail=f"Referenced {field} does not exist.")
            owner = ref.get("userId") or ref.get("ownerUserId") or ref.get("createdByUserId")
            if owner and owner != user["id"]:
                raise HTTPException(status_code=403, detail=f"You do not have access to the referenced {field}.")


@router.get("/{resource}")
async def list_resource(resource: str, request: Request, user=Depends(get_current_user),
                        includeDeleted: bool = Query(False), limit: int = Query(200, le=1000)):
    cfg = _cfg(resource)
    if cfg.get("admin_read") and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required.")
    query: Dict[str, Any] = {}
    if cfg.get("owner") and not _is_admin(user) and not cfg.get("public_read"):
        query[cfg["owner"]] = user["id"]
    for param in FILTER_PARAMS:
        value = request.query_params.get(param)
        if value:
            query[param] = value
    include_deleted = includeDeleted and _is_admin(user)
    return await list_records(cfg["collection"], query, include_deleted=include_deleted, limit=limit)


@router.get("/{resource}/{record_id}")
async def get_resource(resource: str, record_id: str, user=Depends(get_current_user)):
    cfg = _cfg(resource)
    if cfg.get("admin_read") and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required.")
    record = await find_record(cfg["collection"], record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    owner_field = cfg.get("owner")
    if owner_field and not _is_admin(user) and not cfg.get("public_read") and record.get(owner_field) != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have access to this record.")
    return record


@router.post("/{resource}", status_code=201)
async def create_resource(resource: str, body: Dict[str, Any], user=Depends(get_current_user)):
    cfg = _cfg(resource)
    if cfg.get("admin_write") and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required to create this resource.")
    missing = [f for f in cfg.get("required", []) if body.get(f) in (None, "", [])]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required field(s): {', '.join(missing)}.")
    if resource == "pet-profiles":
        await check_quota(user, "pets")
    clean = _sanitize({k: v for k, v in body.items() if k not in PROTECTED_FIELDS})
    await _validate_refs(clean, user)
    if cfg.get("owner"):
        clean[cfg["owner"]] = user["id"]
    # Consent records are upserted by type: exactly one active record per consentType per user,
    # so granting/revoking/deleting is always deterministic (privacy requirement).
    if resource == "consent-records":
        existing = await list_records("consentRecords", {"userId": user["id"], "consentType": clean.get("consentType")}, limit=50)
        if existing:
            updated = await update_record("consentRecords", existing[0]["id"], clean)
            for dup in existing[1:]:
                await soft_delete_record("consentRecords", dup["id"], user["id"])
            await audit("consentRecords.update", "consentRecords", existing[0]["id"], user["id"])
            return updated
    record = await create_record(cfg["collection"], clean)
    await audit(f"{cfg['collection']}.create", cfg["collection"], record["id"], user["id"])
    return record


@router.patch("/{resource}/{record_id}")
async def update_resource(resource: str, record_id: str, body: Dict[str, Any], user=Depends(get_current_user)):
    cfg = _cfg(resource)
    if cfg.get("admin_write") and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required to update this resource.")
    record = await find_record(cfg["collection"], record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    owner_field = cfg.get("owner")
    if owner_field and not _is_admin(user) and record.get(owner_field) != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have access to this record.")
    clean = _sanitize({k: v for k, v in body.items() if k not in PROTECTED_FIELDS})
    if not clean:
        raise HTTPException(status_code=422, detail="No updatable fields provided.")
    await _validate_refs(clean, user)
    updated = await update_record(cfg["collection"], record_id, clean)
    await audit(f"{cfg['collection']}.update", cfg["collection"], record_id, user["id"])
    return updated


@router.delete("/{resource}/{record_id}")
async def delete_resource(resource: str, record_id: str, user=Depends(get_current_user)):
    cfg = _cfg(resource)
    if cfg.get("admin_write") and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required to delete this resource.")
    record = await find_record(cfg["collection"], record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    owner_field = cfg.get("owner")
    if owner_field and not _is_admin(user) and record.get(owner_field) != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have access to this record.")
    deleted = await soft_delete_record(cfg["collection"], record_id, user["id"])
    await audit(f"{cfg['collection']}.delete", cfg["collection"], record_id, user["id"])
    return {"message": "Record archived (soft delete).", "record": deleted}
