"""Domain services: Bond Score engine, Relationship Intelligence engine, Reports, Agent runner.
Formulas ported faithfully from the audited source codebase (server/services/*.ts).
"""
import logging
from typing import Dict, List, Optional

from database import create_record, find_record, list_records, now_iso, audit, update_record
from llm_service import llm_text, classify_safety

logger = logging.getLogger("soula.domain")


def _avg(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _clamp(value: float, lo: float = 0, hi: float = 100) -> int:
    return int(max(lo, min(hi, round(value))))


# ---------------- Bond Score Engine ----------------
async def calculate_bond_score(user_id: str, pet_id: str) -> Dict:
    checkins = (await list_records("dailyCheckins", {"userId": user_id, "petId": pet_id}, sort_dir=-1, limit=14))[::-1]
    wellness = (await list_records("wellnessLogs", {"userId": user_id, "petId": pet_id}, sort_dir=-1, limit=14))[::-1]
    completions = (await list_records("ritualCompletions", {"userId": user_id, "petId": pet_id}, sort_dir=-1, limit=14))[::-1]

    connection = _avg([c.get("connectionQuality", 0) for c in checkins])
    stress_penalty = _avg([c.get("stressLevel", 0) for c in checkins])
    wellness_avg = _avg([v for w in wellness for v in [w.get("appetite", 0), w.get("energy", 0), w.get("sleep", 0), 10 - w.get("anxiety", 0)]])
    ritual_bonus = min(len(completions) * 2, 12)
    data_volume = len(checkins) + len(wellness) + len(completions)

    raw = connection * 4 + wellness_avg * 4 + ritual_bonus - stress_penalty * 1.5 + 10
    score = _clamp(raw)
    confidence = "high" if data_volume >= 12 else "medium" if data_volume >= 5 else "low"
    trend = "improving" if score >= 75 else "stable" if score >= 50 else "needs_attention"
    factors = [
        f"{len(checkins)} recent check-in(s)",
        f"{len(wellness)} wellness log(s)",
        f"{len(completions)} ritual completion(s)",
        f"Average connection quality: {connection:.1f}/10",
        f"Average wellness stability: {wellness_avg:.1f}/10",
        f"Average human stress: {stress_penalty:.1f}/10",
    ]
    record = await create_record("bondScores", {
        "userId": user_id,
        "petId": pet_id,
        "score": score,
        "trend": trend,
        "confidence": confidence,
        "factors": factors,
        "explanation": f"Bond Score is {score}/100 with {confidence} confidence. This is a relationship wellness indicator, not a medical diagnosis.",
        "calculatedAt": now_iso(),
    })
    await audit("bond_score.calculate", "bondScores", record["id"], user_id, {"petId": pet_id, "score": score})
    return record


# ---------------- Relationship Intelligence Engine ----------------
async def generate_relationship_insight(user_id: str, pet_id: Optional[str] = None, pod_id: Optional[str] = None) -> Dict:
    pod = None
    if pod_id:
        pod = await find_record("relationshipPods", pod_id)
        if pod and pod.get("userId") != user_id:
            pod = None
    if pod and pod.get("petIds"):
        pet_ids = pod["petIds"]
    elif pet_id:
        pet_ids = [pet_id]
    else:
        pets = await list_records("petProfiles", {"userId": user_id})
        pet_ids = [p["id"] for p in pets]

    checkins = [c for c in await list_records("dailyCheckins", {"userId": user_id}, limit=1000) if c.get("petId") in pet_ids][:21]
    wellness = [w for w in await list_records("wellnessLogs", {"userId": user_id}, limit=1000) if w.get("petId") in pet_ids][:21]
    completions = [r for r in await list_records("ritualCompletions", {"userId": user_id}, limit=1000) if r.get("petId") in pet_ids][:21]
    care_circle = [m for m in await list_records("careCircleMembers", {"ownerUserId": user_id}, limit=1000) if m.get("petId") in pet_ids]

    connection = _clamp(_avg([c.get("connectionQuality", 0) for c in checkins]) * 10)
    stress_penalty = _avg([c.get("stressLevel", 0) for c in checkins]) * 4
    wellness_stability = _clamp(_avg([v for w in wellness for v in [w.get("appetite", 0), w.get("energy", 0), w.get("sleep", 0), 10 - w.get("anxiety", 0)]]) * 10)
    ritual_consistency = _clamp(min(len(completions) / 3, 1) * 100)
    care_readiness = _clamp(min(len(care_circle) / 2, 1) * 100)
    data_points = len(checkins) + len(wellness) + len(completions)
    data_completeness = _clamp(min(data_points / 10, 1) * 100)

    score = _clamp(connection * 0.28 + wellness_stability * 0.28 + ritual_consistency * 0.17 +
                   care_readiness * 0.12 + data_completeness * 0.15 - stress_penalty * 0.35)
    trend = "improving" if score >= 74 else "stable" if score >= 52 else "needs_attention"
    confidence = "high" if data_points >= 14 else "medium" if data_points >= 6 else "low"

    risks: List[str] = []
    if any(w.get("appetite", 10) <= 3 or w.get("energy", 10) <= 3 or w.get("sleep", 10) <= 3 for w in wellness):
        risks.append("Low appetite, energy, or sleep was logged. Consider professional guidance if this persists.")
    if any(w.get("anxiety", 0) >= 8 for w in wellness):
        risks.append("High anxiety was logged. Use low-pressure routines and consider professional support.")
    if any(c.get("stressLevel", 0) >= 8 for c in checkins):
        risks.append("Human stress is high in recent check-ins. Keep rituals short, safe, and consent-based.")
    if not checkins:
        risks.append("No recent check-ins. Relationship intelligence confidence is limited.")
    if not wellness:
        risks.append("No recent wellness logs. Vet-ready reporting will be incomplete.")

    signals = [
        f"{len(checkins)} relationship check-in(s) reviewed",
        f"{len(wellness)} wellness observation(s) reviewed",
        f"{len(completions)} ritual completion(s) reviewed",
        f"{len(care_circle)} care-circle member(s) linked",
        f"Connection dimension: {connection}/100",
        f"Wellness stability dimension: {wellness_stability}/100",
    ]
    next_actions = [
        "Complete one short daily check-in today to improve the signal quality." if score < 55 else "Keep the current ritual cadence and log any meaningful emotional shifts.",
        "Run a 5-minute calm connection ritual at the same time for the next three days." if ritual_consistency < 50 else "Continue the rituals that are working and document the pet response.",
        "Invite a trusted caregiver or provider viewer into the workspace with limited permissions." if care_readiness < 50 else "Use the care circle to capture observations when you are away.",
        "For concerning medical signs, contact a veterinarian or emergency clinic. Soula Paws does not diagnose." if risks else "Generate a vet-ready report before the next appointment so observations are organized.",
    ]
    record = await create_record("relationshipInsights", {
        "userId": user_id,
        "podId": pod["id"] if pod else None,
        "petId": pet_id,
        "score": score,
        "trend": trend,
        "confidence": confidence,
        "dimensions": {
            "connection": connection,
            "wellnessStability": wellness_stability,
            "ritualConsistency": ritual_consistency,
            "careCircleReadiness": care_readiness,
            "dataCompleteness": data_completeness,
        },
        "signals": signals,
        "risks": risks,
        "nextBestActions": next_actions,
        "safetyDisclaimer": "Soula Paws provides observation-based relationship and wellness intelligence only. It does not diagnose, prescribe, or replace veterinary care.",
        "generatedAt": now_iso(),
    })
    await audit("intelligence.generate", "relationshipInsights", record["id"], user_id, {"petId": pet_id, "podId": pod_id, "score": score})
    return record


# ---------------- Report Generator ----------------
REPORT_DISCLAIMER = "This report contains owner/caregiver observations only. It is not a medical diagnosis and does not replace veterinary care."


async def generate_report(user_id: str, pet_id: str, report_type: str) -> Dict:
    pet = await find_record("petProfiles", pet_id)
    checkins = await list_records("dailyCheckins", {"userId": user_id, "petId": pet_id}, limit=14)
    wellness = await list_records("wellnessLogs", {"userId": user_id, "petId": pet_id}, limit=14)
    completions = await list_records("ritualCompletions", {"userId": user_id, "petId": pet_id}, limit=14)
    insights = await list_records("relationshipInsights", {"userId": user_id}, limit=3)
    scores = await list_records("bondScores", {"userId": user_id, "petId": pet_id}, limit=3)

    pet_name = pet.get("name", "Pet") if pet else "Pet"
    title = f"{pet_name} {report_type.replace('_', ' ')} report"
    summary = (f"{pet_name} has {len(checkins)} recent check-ins, {len(wellness)} wellness logs, "
               f"{len(completions)} completed bonding rituals, and {len(insights)} relationship intelligence snapshot(s).")

    # AI-enhanced narrative (architecture improvement: source only assembled raw text)
    narrative = ""
    try:
        obs = "; ".join(
            [f"check-in {c.get('date')}: human={c.get('humanMood')}, pet={c.get('petMood')}, connection={c.get('connectionQuality')}/10, stress={c.get('stressLevel')}/10" for c in checkins[:7]]
            + [f"wellness {w.get('date')}: appetite={w.get('appetite')}, energy={w.get('energy')}, sleep={w.get('sleep')}, anxiety={w.get('anxiety')}" for w in wellness[:7]]
        ) or "no recent observations logged"
        narrative = await llm_text(
            "You are the Soula Paws Report Agent. Write a short (120-180 word) observation-based narrative summary "
            "for a " + report_type.replace("_", " ") + " report about a pet. Use warm, professional, non-diagnostic language. "
            "Never diagnose or prescribe. If concerning signs appear, recommend veterinary consultation. Plain text only.",
            f"Pet: {pet_name} ({pet.get('species', 'unknown') if pet else 'unknown'}, status: {pet.get('status', 'unknown') if pet else 'unknown'}). Recent observations: {obs}",
        )
    except Exception as e:
        logger.warning(f"Report narrative generation failed: {e}")
        narrative = "AI narrative unavailable for this report. The structured observations below remain complete."

    lines = [
        f"# {title}",
        "",
        f"Generated: {now_iso()}",
        "",
        f"## Summary\n{summary}",
        "",
        f"## AI Narrative Summary\n{narrative}",
        "",
        "## Pet Profile\n" + (
            f"Species: {pet.get('species', 'Unknown')}\nBreed: {pet.get('breed', 'Unknown')}\nStatus: {pet.get('status', 'Unknown')}\n"
            f"Known triggers: {', '.join(pet.get('triggers', [])) or 'None logged'}\n"
            f"Comfort rituals: {', '.join(pet.get('comfortRituals', [])) or 'None logged'}\n"
            f"Vet contact: {pet.get('vetContact', 'Not provided')}" if pet else "Pet profile not found."),
        "",
        "## Bond Score History\n" + ("\n".join([f"- {s.get('calculatedAt', '')[:10]}: {s.get('score')}/100 ({s.get('trend')}, {s.get('confidence')} confidence)" for s in scores]) or "No bond scores calculated yet."),
        "",
        "## Relationship Intelligence\n" + ("\n".join([f"- {i.get('generatedAt', '')[:10]}: score={i.get('score')}/100, trend={i.get('trend')}, confidence={i.get('confidence')}; next action: {(i.get('nextBestActions') or ['continue observations'])[0]}" for i in insights]) or "No relationship intelligence snapshots yet."),
        "",
        "## Recent Check-ins\n" + ("\n".join([f"- {c.get('date')}: human={c.get('humanMood')}, pet={c.get('petMood')}, connection={c.get('connectionQuality')}/10, stress={c.get('stressLevel')}/10" for c in checkins]) or "No check-ins yet."),
        "",
        "## Recent Wellness Logs\n" + ("\n".join([f"- {w.get('date')}: appetite={w.get('appetite')}/10, energy={w.get('energy')}/10, sleep={w.get('sleep')}/10, anxiety={w.get('anxiety')}/10, bathroom={w.get('bathroom')}; observations={w.get('medicalObservations') or 'none'}" for w in wellness]) or "No wellness logs yet."),
        "",
        "## Ritual Completion\n" + ("\n".join([f"- {r.get('completedAt', r.get('createdAt', ''))[:10]}: {r.get('result')}; pet response: {r.get('petResponse', 'n/a')}; emotional result: {r.get('emotionalResult', 'n/a')}" for r in completions]) or "No ritual completions yet."),
        "",
        f"## Vet/Professional Disclaimer\n{REPORT_DISCLAIMER}",
        "",
        "## Emergency Guidance",
        "If the animal may be in immediate danger, contact a veterinarian, emergency clinic, or local emergency resources. Do not rely on Soula Paws for emergency decisions.",
    ]
    record = await create_record("reports", {
        "userId": user_id,
        "petId": pet_id,
        "type": report_type,
        "title": title,
        "summary": summary,
        "content": "\n".join(lines),
        "status": "ready",
        "sharedWith": None,
        "requiresConsent": True,
    })
    await create_record("notifications", {
        "userId": user_id,
        "title": "Report ready",
        "body": f"Your {report_type.replace('_', ' ')} report for {pet_name} is ready to view.",
        "readAt": None,
    })
    await audit("report.generate", "reports", record["id"], user_id, {"petId": pet_id, "type": report_type})
    return record


# ---------------- Agent Runner ----------------
async def run_agent(user_id: str, agent_key: str, title: str, prompt: str) -> Dict:
    agents = await list_records("agentRegistry", {"key": agent_key, "enabled": True}, limit=1)
    if not agents:
        return {"error": "AGENT_NOT_FOUND"}
    agent = agents[0]
    requires_approval = agent.get("riskLevel") == "high"

    task = await create_record("agentTasks", {
        "createdByUserId": user_id,
        "assignedAgentKey": agent["key"],
        "title": title,
        "input": prompt,
        "status": "needs_approval" if requires_approval else "running",
        "priority": "high" if requires_approval else "normal",
        "result": None,
    })

    started_at = now_iso()
    try:
        output = await llm_text(
            f"You are {agent['name']}, an internal AI employee of Soula Paws (a human-animal bond wellness platform). "
            f"Role: {agent['role']}. Tools allowed: {', '.join(agent.get('tools', []))}. "
            "Follow all Soula Paws safety guardrails: observation-based language, no diagnosis, no prescriptions, "
            "recommend veterinary care for medical concerns, include confidence framing when data is limited. "
            "Complete the task safely, clearly, and concisely.",
            prompt,
        )
        confidence = "medium"
        run_status = "needs_approval" if requires_approval else "completed"
    except Exception as e:
        logger.error(f"Agent run failed: {e}")
        output = f"Agent execution failed: {e}"
        confidence = "low"
        run_status = "failed"

    run = await create_record("agentRuns", {
        "taskId": task["id"],
        "agentKey": agent["key"],
        "input": prompt,
        "output": output,
        "confidence": confidence,
        "riskLevel": agent.get("riskLevel", "low"),
        "status": run_status,
        "startedAt": started_at,
        "completedAt": now_iso(),
        "userId": user_id,
    })
    await create_record("agentMessages", {
        "runId": run["id"],
        "fromAgentKey": agent["key"],
        "toAgentKey": "orchestrator",
        "content": f"Completed {agent['name']} run with {confidence} confidence and {agent.get('riskLevel')} risk.",
        "userId": user_id,
    })
    task = await update_record("agentTasks", task["id"], {"status": run_status, "result": output}) or task

    approval = None
    if requires_approval:
        approval = await create_record("agentApprovals", {
            "taskId": task["id"],
            "userId": user_id,
            "action": f"Approve output of high-risk agent '{agent['name']}' for task: {title}",
            "status": "pending",
            "reason": None,
        })
        await create_record("notifications", {
            "userId": user_id,
            "title": "Agent approval needed",
            "body": f"High-risk agent '{agent['name']}' completed a task that requires your approval.",
            "readAt": None,
        })
    await audit("agent.run", "agentRuns", run["id"], user_id, {"agentKey": agent["key"], "taskId": task["id"], "requiresApproval": requires_approval})
    return {"task": task, "run": run, "approval": approval, "requiresApproval": requires_approval}
