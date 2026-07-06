"""Voice Support Agent routes."""
from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user, rate_limit
from database import audit, create_record, find_record, list_records
from models import SupportTicketInput, VoiceMessageInput
from voice_service import handle_voice_message

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/message")
async def voice_message(body: VoiceMessageInput, user=Depends(get_current_user)):
    rate_limit(f"voice:{user['id']}", 30)
    return await handle_voice_message(user["id"], user["name"], body.message, body.conversationId, body.viaVoice)


@router.get("/conversations")
async def conversations(user=Depends(get_current_user)):
    query = {} if user["role"] == "admin" else {"userId": user["id"]}
    return await list_records("voiceConversations", query)


@router.get("/conversations/{conversation_id}")
async def conversation_detail(conversation_id: str, user=Depends(get_current_user)):
    conv = await find_record("voiceConversations", conversation_id)
    if not conv or (conv.get("userId") != user["id"] and user["role"] != "admin"):
        raise HTTPException(status_code=404, detail="Conversation not found.")
    msgs = await list_records("voiceMessages", {"conversationId": conversation_id}, limit=200, sort_dir=1)
    return {"conversation": conv, "messages": msgs}


@router.get("/knowledge")
async def knowledge(user=Depends(get_current_user)):
    return await list_records("knowledgeArticles", limit=100, sort_dir=1)


@router.post("/support-ticket", status_code=201)
async def support_ticket(body: SupportTicketInput, user=Depends(get_current_user)):
    ticket = await create_record("supportTickets", {
        "userId": user["id"],
        "subject": body.subject,
        "description": body.description,
        "category": body.category,
        "priority": "normal",
        "status": "open",
        "source": "manual",
        "conversationId": None,
    })
    await audit("support.ticket_create", "supportTickets", ticket["id"], user["id"])
    return ticket
