"""Workflow routes: bond score calculation, relationship intelligence, AI coach chat (SSE streaming),
AI ritual generation, report generation & consent-gated sharing."""
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from auth_utils import get_current_user, rate_limit
from billing import check_quota
from database import audit, create_record, find_record, list_records, now_iso, update_record
from domain_services import calculate_bond_score, generate_relationship_insight, generate_report
from llm_service import classify_safety, llm_json, stream_coach
from models import (BondScoreInput, ChatInput, GenerateReportInput,
                    GenerateRitualInput, InsightInput, RitualModel, ShareReportInput)

logger = logging.getLogger("soula.workflows")
router = APIRouter(tags=["workflows"])


async def _own_pet(pet_id: str, user) -> dict:
    pet = await find_record("petProfiles", pet_id)
    if not pet or (pet.get("userId") != user["id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=404, detail="Pet not found in your account.")
    return pet


@router.post("/bond-scores/calculate")
async def bond_score_calculate(body: BondScoreInput, user=Depends(get_current_user)):
    await _own_pet(body.petId, user)
    return await calculate_bond_score(user["id"], body.petId)


@router.post("/intelligence/relationship-insight")
async def relationship_insight(body: InsightInput, user=Depends(get_current_user)):
    if body.petId:
        await _own_pet(body.petId, user)
    return await generate_relationship_insight(user["id"], body.petId, body.podId)


@router.post("/ai/generate-ritual")
async def generate_ritual(body: GenerateRitualInput, user=Depends(get_current_user)):
    rate_limit(f"ai:{user['id']}", 20)
    await check_quota(user, "ai")
    pet = await _own_pet(body.petId, user)
    goal = body.goal or "strengthen the bond gently"
    system = (
        "You are the Soula Paws Care Plan Agent. You create safe, low-pressure, consent-based bonding rituals. "
        "Never include medical treatment, medication, or diagnosis. Respond ONLY with valid JSON matching this schema: "
        '{"title": str, "description": str, "durationMinutes": int (1-120), "category": str, "steps": [str, str, str, ...]} '
        "No markdown, no code fences, no extra text."
    )
    prompt = (f"Create a bonding ritual for {pet['name']}, a {pet.get('status', 'owned')} {pet.get('species', 'pet')} "
              f"(breed: {pet.get('breed', 'unknown')}, age: {pet.get('age', 'unknown')}). "
              f"Traits: {', '.join(pet.get('traits', [])) or 'unknown'}. Triggers to avoid: {', '.join(pet.get('triggers', [])) or 'none listed'}. "
              f"Known comfort rituals: {', '.join(pet.get('comfortRituals', [])) or 'none listed'}. Owner goal: {goal}.")
    try:
        ritual = await llm_json(system, prompt, RitualModel)
    except ValueError as e:
        raise HTTPException(status_code=502, detail="The AI ritual generator is temporarily unavailable. Please try again.")
    record = await create_record("rituals", {
        "userId": user["id"],
        "petId": body.petId,
        "title": ritual.title,
        "description": ritual.description,
        "durationMinutes": ritual.durationMinutes,
        "category": ritual.category,
        "steps": ritual.steps,
        "status": "active",
        "aiGenerated": True,
    })
    await audit("ai.generate_ritual", "rituals", record["id"], user["id"], {"petId": body.petId})
    return record


@router.post("/ai/chat")
async def ai_chat(body: ChatInput, request: Request, user=Depends(get_current_user)):
    """SSE streaming chat with the AI Bond Coach. Persists conversation + messages with safety levels."""
    rate_limit(f"ai:{user['id']}", 30)
    await check_quota(user, "ai")
    pet = None
    if body.petId:
        pet = await _own_pet(body.petId, user)

    conversation = None
    if body.conversationId:
        conversation = await find_record("aiConversations", body.conversationId)
        if not conversation or conversation.get("userId") != user["id"]:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    if not conversation:
        conversation = await create_record("aiConversations", {
            "userId": user["id"],
            "petId": body.petId,
            "title": body.message[:60],
        })

    safety = classify_safety(body.message)
    await create_record("aiMessages", {
        "userId": user["id"], "conversationId": conversation["id"],
        "role": "user", "content": body.message, "safetyLevel": safety,
    })

    # Build context from owned data
    context_parts = []
    if pet:
        context_parts.append(f"Pet context: {pet['name']}, {pet.get('species')}, status {pet.get('status')}, "
                             f"traits: {', '.join(pet.get('traits', []))}, triggers: {', '.join(pet.get('triggers', []))}.")
        scores = await list_records("bondScores", {"userId": user["id"], "petId": pet["id"]}, limit=1)
        if scores:
            s = scores[0]
            context_parts.append(f"Latest Bond Score: {s['score']}/100, trend {s['trend']}, confidence {s['confidence']}.")
        checkins = await list_records("dailyCheckins", {"userId": user["id"], "petId": pet["id"]}, limit=3)
        for c in checkins:
            context_parts.append(f"Check-in {c.get('date')}: human mood '{c.get('humanMood')}', pet mood '{c.get('petMood')}', connection {c.get('connectionQuality')}/10, stress {c.get('stressLevel')}/10.")
        wellness = await list_records("wellnessLogs", {"userId": user["id"], "petId": pet["id"]}, limit=3)
        for w in wellness:
            context_parts.append(f"Wellness {w.get('date')}: appetite {w.get('appetite')}/10, energy {w.get('energy')}/10, sleep {w.get('sleep')}/10, anxiety {w.get('anxiety')}/10.")
    if safety == "high":
        context_parts.append("IMPORTANT: The user's message contains potentially urgent medical language. Begin your response by advising them to contact a veterinarian or emergency clinic immediately.")
    context = "\n".join(context_parts) if context_parts else "No pet context linked to this conversation."

    history = await list_records("aiMessages", {"conversationId": conversation["id"]}, limit=12, sort_dir=-1)
    history = [m for m in history[::-1] if m.get("role") in ("user", "assistant")][:-1]

    conv_id = conversation["id"]
    user_id = user["id"]

    async def event_stream():
        full_text = ""
        try:
            async for event, data in stream_coach(history, body.message, context):
                if event == "delta":
                    yield f"data: {json.dumps({'type': 'delta', 'content': data})}\n\n"
                elif event == "done":
                    full_text = data
        except Exception as e:
            logger.error(f"AI chat stream failed: {e}")
            fallback = ("I'm having trouble reaching the AI service right now. Please try again in a moment. "
                        "For urgent medical concerns, contact a veterinarian or emergency clinic.")
            full_text = full_text or fallback
            yield f"data: {json.dumps({'type': 'delta', 'content': fallback})}\n\n"
        msg = await create_record("aiMessages", {
            "userId": user_id, "conversationId": conv_id,
            "role": "assistant", "content": full_text, "safetyLevel": safety,
            "confidence": "medium",
        })
        await audit("ai.chat", "aiConversations", conv_id, user_id, {"safetyLevel": safety})
        meta = {"type": "done", "conversationId": conv_id, "messageId": msg["id"],
                "safetyLevel": safety, "confidence": "medium"}
        yield f"data: {json.dumps(meta)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/reports/generate")
async def reports_generate(body: GenerateReportInput, user=Depends(get_current_user)):
    rate_limit(f"reports:{user['id']}", 10)
    await check_quota(user, "reports")
    await _own_pet(body.petId, user)
    return await generate_report(user["id"], body.petId, body.type)


@router.post("/reports/{report_id}/share")
async def share_report(report_id: str, body: ShareReportInput, user=Depends(get_current_user)):
    report = await find_record("reports", report_id)
    if not report or report.get("userId") != user["id"]:
        raise HTTPException(status_code=404, detail="Report not found.")
    consents = await list_records("consentRecords", {"userId": user["id"], "consentType": "report_sharing"}, limit=50, sort_field="updatedAt")
    if not consents or not consents[0].get("granted"):
        raise HTTPException(status_code=403, detail="Report sharing requires consent. Enable 'Report sharing' in Privacy & Consent first.")
    updated = await update_record("reports", report_id, {"status": "shared", "sharedWith": body.sharedWith, "sharedAt": now_iso()})
    await audit("report.share", "reports", report_id, user["id"], {"sharedWith": body.sharedWith})
    return updated
