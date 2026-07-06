"""Agent Command Center routes."""
from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user, rate_limit, require_admin
from database import audit, find_record, list_records, update_record
from domain_services import run_agent
from models import AgentRunInput, ApprovalDecisionInput

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/registry")
async def registry(user=Depends(get_current_user)):
    return await list_records("agentRegistry", {"enabled": True}, limit=50, sort_dir=1)


@router.get("/tasks")
async def tasks(user=Depends(get_current_user)):
    query = {} if user["role"] == "admin" else {"createdByUserId": user["id"]}
    return await list_records("agentTasks", query)


@router.get("/approvals")
async def approvals(user=Depends(get_current_user)):
    query = {} if user["role"] == "admin" else {"userId": user["id"]}
    return await list_records("agentApprovals", query)


@router.get("/runs")
async def runs(user=Depends(require_admin)):
    return await list_records("agentRuns")


@router.get("/messages")
async def messages(user=Depends(require_admin)):
    return await list_records("agentMessages")


@router.get("/audit-logs")
async def agent_audit_logs(user=Depends(require_admin)):
    return await list_records("auditLogs", {"action": "agent.run"})


@router.post("/run")
async def run(body: AgentRunInput, user=Depends(get_current_user)):
    rate_limit(f"agents:{user['id']}", 15)
    result = await run_agent(user["id"], body.agentKey, body.title, body.prompt)
    if result.get("error"):
        raise HTTPException(status_code=404, detail="Agent is not enabled or does not exist.")
    return result


@router.post("/approvals/{approval_id}/decide")
async def decide_approval(approval_id: str, body: ApprovalDecisionInput, user=Depends(get_current_user)):
    approval = await find_record("agentApprovals", approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found.")
    if approval.get("userId") != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You cannot decide this approval.")
    if approval.get("status") != "pending":
        raise HTTPException(status_code=409, detail="This approval was already decided.")
    updated = await update_record("agentApprovals", approval_id, {"status": body.status, "reason": body.reason, "decidedBy": user["id"]})
    task_status = "completed" if body.status == "approved" else "archived"
    await update_record("agentTasks", approval["taskId"], {"status": task_status})
    await audit("agent.approval_decision", "agentApprovals", approval_id, user["id"], {"status": body.status})
    return updated
