"""Voice Support Agent service: escalation rules, knowledge-base grounding, bounded LLM support answers.
Implements the escalation triggers from the product docs:
- pet emergency -> emergency vet disclaimer + urgent ticket
- bite/aggression -> safety language + urgent ticket
- billing dispute -> priority ticket
- privacy/data deletion -> human review ticket
- password/account -> guided support
- unsupported -> clarify or ticket
"""
import logging
from typing import Dict, List, Optional

from database import create_record, list_records, audit
from llm_service import llm_text, classify_safety

logger = logging.getLogger("soula.voice")

VOICE_SYSTEM = (
    "You are the Soula Paws Voice Concierge, a bounded customer-support agent for the Soula Paws "
    "human-animal bond wellness platform. You answer questions about: app features (check-ins, wellness logs, "
    "rituals, bond score, relationship intelligence, AI coach, reports, care circle, privacy/consent), account help, "
    "and general bonding wellness guidance. Rules: never diagnose, never prescribe, never make emergency decisions, "
    "never discuss refunds/legal specifics (create a ticket instead), keep answers under 120 words, warm and clear. "
    "Use the provided knowledge base context when relevant. If you don't know, say so and offer to create a support ticket."
)

EMERGENCY_WORDS = ["seizure", "poison", "bleeding", "can't breathe", "cannot breathe", "collapse",
                   "unconscious", "overdose", "hit by car", "not breathing", "choking", "bloat", "dying", "emergency"]
AGGRESSION_WORDS = ["bite", "bit ", "bitten", "attack", "aggressive", "growling at", "snapped at", "lunged"]
BILLING_WORDS = ["refund", "charge", "billing", "subscription", "chargeback", "payment", "invoice", "cancel my plan"]
PRIVACY_WORDS = ["delete my data", "delete my account", "privacy request", "gdpr", "export my data", "data deletion"]
ACCOUNT_WORDS = ["password", "locked out", "can't log in", "cannot log in", "reset my login", "change my email"]


def detect_escalation(text: str) -> Optional[Dict]:
    lower = text.lower()
    if any(w in lower for w in EMERGENCY_WORDS):
        return {"category": "pet_emergency", "priority": "urgent",
                "reply": ("This sounds like it could be a medical emergency. Please contact a veterinarian or an "
                          "emergency animal clinic right away — Soula Paws cannot make emergency decisions or provide "
                          "emergency care. I've created an urgent ticket so our human team follows up with you. "
                          "If your pet is in immediate danger, please stop and call your nearest emergency vet now.")}
    if any(w in lower for w in AGGRESSION_WORDS):
        return {"category": "aggression_safety", "priority": "urgent",
                "reply": ("Thank you for telling me — safety comes first for both you and your animal. Please keep a safe "
                          "distance, avoid punishment-based responses, and consider a certified behaviorist or veterinarian, "
                          "especially if a bite broke skin (medical attention may be needed). I've created an urgent ticket "
                          "so a human team member can follow up with resources.")}
    if any(w in lower for w in BILLING_WORDS):
        return {"category": "billing", "priority": "high",
                "reply": ("I understand billing issues are frustrating. I'm not able to process refunds or account charges "
                          "directly, so I've created a priority ticket for our billing team. They'll review your account and "
                          "follow up. Is there anything else about the app I can help with in the meantime?")}
    if any(w in lower for w in PRIVACY_WORDS):
        return {"category": "privacy", "priority": "high",
                "reply": ("Your privacy matters deeply to us. Data deletion and export requests go through a verified human "
                          "review workflow to protect your account. I've created a ticket for our privacy team — they'll "
                          "confirm your identity and process the request. You can also manage consent anytime in "
                          "Privacy & Consent settings.")}
    return None


def is_account_question(text: str) -> bool:
    lower = text.lower()
    return any(w in lower for w in ACCOUNT_WORDS)


async def handle_voice_message(user_id: str, user_name: str, message: str,
                               conversation_id: Optional[str], via_voice: bool) -> Dict:
    # ensure conversation
    if conversation_id:
        convs = await list_records("voiceConversations", {"id": conversation_id, "userId": user_id}, limit=1)
        conversation = convs[0] if convs else None
    else:
        conversation = None
    if not conversation:
        conversation = await create_record("voiceConversations", {
            "userId": user_id,
            "title": message[:60],
            "channel": "voice" if via_voice else "text",
            "status": "open",
        })

    safety = classify_safety(message)
    await create_record("voiceMessages", {
        "userId": user_id, "conversationId": conversation["id"], "role": "user",
        "content": message, "safetyLevel": safety, "viaVoice": via_voice,
    })

    escalation = detect_escalation(message)
    ticket = None
    if escalation:
        ticket = await create_record("supportTickets", {
            "userId": user_id,
            "subject": f"[{escalation['category']}] {message[:80]}",
            "description": message,
            "category": escalation["category"],
            "priority": escalation["priority"],
            "status": "open",
            "source": "voice_agent",
            "conversationId": conversation["id"],
        })
        await create_record("notifications", {
            "userId": user_id,
            "title": "Support ticket created",
            "body": f"An {escalation['priority']} priority ticket was created for your {escalation['category'].replace('_', ' ')} request.",
            "readAt": None,
        })
        reply = escalation["reply"]
        confidence = "high"
    elif is_account_question(message):
        reply = ("For password help: use 'Reset my password' on the login page — you'll get a secure reset link. "
                 "To change your password while logged in, go to your profile menu. If you're locked out or need an "
                 "email change, I can create a support ticket for secure human handoff — just say 'create a ticket'. "
                 "Never share your password with anyone, including support.")
        confidence = "high"
    else:
        # knowledge-base grounded LLM answer
        articles = await list_records("knowledgeArticles", limit=20)
        lower = message.lower()
        scored = []
        for a in articles:
            hits = sum(1 for w in lower.split() if len(w) > 3 and (w in a.get("title", "").lower() or w in a.get("content", "").lower()))
            if hits:
                scored.append((hits, a))
        scored.sort(key=lambda x: -x[0])
        kb_context = "\n\n".join([f"KB Article '{a['title']}': {a['content']}" for _, a in scored[:3]]) or "No matching knowledge base articles."
        try:
            reply = await llm_text(VOICE_SYSTEM, f"Knowledge base context:\n{kb_context}\n\nUser ({user_name}) asks: {message}")
            confidence = "medium"
        except Exception as e:
            logger.error(f"Voice LLM failed: {e}")
            reply = ("I'm having trouble reaching my knowledge service right now. I can create a support ticket for a "
                     "human team member to follow up — or please try again in a moment.")
            confidence = "low"

    await create_record("voiceMessages", {
        "userId": user_id, "conversationId": conversation["id"], "role": "assistant",
        "content": reply, "safetyLevel": safety, "viaVoice": via_voice,
        "escalationCategory": escalation["category"] if escalation else None,
    })
    await audit("voice.message", "voiceConversations", conversation["id"], user_id,
                {"escalated": bool(escalation), "category": escalation["category"] if escalation else None, "viaVoice": via_voice})

    return {
        "conversationId": conversation["id"],
        "reply": reply,
        "safetyLevel": safety,
        "confidence": confidence,
        "escalation": ({"category": escalation["category"], "priority": escalation["priority"], "ticketId": ticket["id"] if ticket else None} if escalation else None),
    }
