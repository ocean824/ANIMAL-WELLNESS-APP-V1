"""Pydantic models & resource registry for Soula Paws."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# ---------- Auth ----------
class RegisterInput(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=120)


class LoginInput(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN)
    password: str


class ForgotPasswordInput(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN)


class ResetPasswordInput(BaseModel):
    token: str
    password: str = Field(min_length=8)


class ChangePasswordInput(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8)


# ---------- Workflows ----------
class BondScoreInput(BaseModel):
    petId: str


class InsightInput(BaseModel):
    petId: Optional[str] = None
    podId: Optional[str] = None


class ChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversationId: Optional[str] = None
    petId: Optional[str] = None


class GenerateRitualInput(BaseModel):
    petId: str
    goal: Optional[str] = None


class GenerateReportInput(BaseModel):
    petId: str
    type: str = Field(pattern="^(user_wellness|vet_ready|caregiver|pod_intelligence)$")


class ShareReportInput(BaseModel):
    sharedWith: str = Field(min_length=1, max_length=300)


class AgentRunInput(BaseModel):
    agentKey: str
    title: str = Field(min_length=1, max_length=200)
    prompt: str = Field(min_length=1, max_length=4000)


class ApprovalDecisionInput(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    reason: Optional[str] = None


class VoiceMessageInput(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversationId: Optional[str] = None
    viaVoice: bool = False


class SupportTicketInput(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=4000)
    category: str = "general"


class RitualModel(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)
    durationMinutes: int = Field(ge=1, le=120)
    category: str
    steps: List[str] = Field(min_length=3)


class AdminUserCreate(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8)
    name: str
    role: str = Field(default="owner", pattern="^(owner|caregiver|provider|admin)$")


# ---------- Generic CRUD resource registry ----------
# owner_field: which field scopes visibility to the authenticated user
# admin_read/admin_write: restrict access; public_read: any authenticated user can read
RESOURCES: Dict[str, Dict[str, Any]] = {
    "human-profiles":      {"collection": "humanProfiles", "owner": "userId", "required": ["displayName"]},
    "pet-profiles":        {"collection": "petProfiles", "owner": "userId", "required": ["name", "species"]},
    "relationship-pods":   {"collection": "relationshipPods", "owner": "userId", "required": ["name", "mode"]},
    "pod-members":         {"collection": "podMembers", "owner": "ownerUserId", "required": ["podId", "name", "email", "role"]},
    "care-circle-members": {"collection": "careCircleMembers", "owner": "ownerUserId", "required": ["petId", "name", "email", "role"]},
    "daily-checkins":      {"collection": "dailyCheckins", "owner": "userId", "required": ["petId", "date", "humanMood", "petMood", "stressLevel", "connectionQuality"]},
    "wellness-logs":       {"collection": "wellnessLogs", "owner": "userId", "required": ["petId", "date", "appetite", "energy", "sleep", "anxiety", "bathroom"]},
    "rituals":             {"collection": "rituals", "owner": "userId", "required": ["petId", "title", "description"]},
    "ritual-completions":  {"collection": "ritualCompletions", "owner": "userId", "required": ["ritualId", "petId", "result"]},
    "bond-scores":         {"collection": "bondScores", "owner": "userId", "required": ["petId", "score"]},
    "relationship-insights": {"collection": "relationshipInsights", "owner": "userId", "required": ["score"]},
    "ai-conversations":    {"collection": "aiConversations", "owner": "userId", "required": ["title"]},
    "ai-messages":         {"collection": "aiMessages", "owner": "userId", "required": ["conversationId", "role", "content"]},
    "reports":             {"collection": "reports", "owner": "userId", "required": ["petId", "type", "title"]},
    "notifications":       {"collection": "notifications", "owner": "userId", "required": ["title", "body"]},
    "consent-records":     {"collection": "consentRecords", "owner": "userId", "required": ["consentType", "granted"]},
    "agent-registry":      {"collection": "agentRegistry", "owner": None, "public_read": True, "admin_write": True, "required": ["key", "name"]},
    "agent-tasks":         {"collection": "agentTasks", "owner": "createdByUserId", "required": ["assignedAgentKey", "title", "input"]},
    "agent-runs":          {"collection": "agentRuns", "owner": None, "admin_read": True, "admin_write": True, "required": []},
    "agent-messages":      {"collection": "agentMessages", "owner": None, "admin_read": True, "admin_write": True, "required": []},
    "agent-approvals":     {"collection": "agentApprovals", "owner": "userId", "required": ["taskId", "action"]},
    "audit-logs":          {"collection": "auditLogs", "owner": None, "admin_read": True, "admin_write": True, "required": []},
    "system-events":       {"collection": "systemEvents", "owner": None, "admin_read": True, "admin_write": True, "required": []},
    "knowledge-articles":  {"collection": "knowledgeArticles", "owner": None, "public_read": True, "admin_write": True, "required": ["title", "content", "category"]},
    "support-tickets":     {"collection": "supportTickets", "owner": "userId", "required": ["subject", "category"]},
    "voice-conversations": {"collection": "voiceConversations", "owner": "userId", "required": []},
    "voice-messages":      {"collection": "voiceMessages", "owner": "userId", "required": ["conversationId", "role", "content"]},
}

# Reference fields validated for ownership on create/update (prevents wiring to another user's data)
REF_CHECKS = {
    "petId": "petProfiles",
    "podId": "relationshipPods",
    "ritualId": "rituals",
    "conversationId": None,  # checked contextually (aiConversations or voiceConversations)
    "humanProfileId": "humanProfiles",
}

PROTECTED_FIELDS = {"id", "_id", "createdAt", "updatedAt", "deletedAt", "deletedBy",
                    "userId", "ownerUserId", "createdByUserId", "passwordHash"}
