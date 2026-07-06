"""Idempotent seed data for Soula Paws (demo accounts, Milo the senior rescue dog, agents, knowledge base)."""
import logging
from datetime import datetime, timedelta, timezone

from database import db, now_iso
from auth_utils import hash_password

logger = logging.getLogger("soula.seed")

SEED_ADMIN_ID = "seed-admin-user"
SEED_OWNER_ID = "seed-owner-user"
SEED_CAREGIVER_ID = "seed-caregiver-user"
SEED_HUMAN_ID = "seed-human-profile"
SEED_PET_ID = "seed-pet-profile"
SEED_POD_ID = "seed-relationship-pod"
SEED_RITUAL_ID = "seed-ritual-calm-connection"

AGENTS = [
    ("orchestrator", "Orchestrator Agent", "Routes work to specialist AI employees and compiles final reports.", ["delegate_task", "summarize_status", "request_approval"], "medium"),
    ("product_manager", "Product Manager Agent", "Turns business goals into requirements, task plans, and acceptance criteria.", ["create_spec", "prioritize_backlog"], "low"),
    ("architect", "Architect Agent", "Designs app architecture, schemas, API contracts, and integration boundaries.", ["design_schema", "review_api"], "medium"),
    ("builder", "Builder Agent", "Creates implementation plans and checks repository completeness.", ["plan_code", "validate_files"], "medium"),
    ("designer", "AI Design Agent", "Improves interface structure, accessibility, and user journeys.", ["review_ui", "write_microcopy"], "low"),
    ("qa", "QA Agent", "Creates test plans, acceptance checks, and bug reports.", ["write_tests", "run_checklist"], "low"),
    ("security", "Security Agent", "Reviews auth, permissions, secret handling, audit logs, and unsafe actions.", ["security_review", "risk_label"], "high"),
    ("safety", "AI Safety Agent", "Checks veterinary, wellness, and emotional-support language for unsafe or overconfident output.", ["safety_review", "block_output"], "high"),
    ("reporter", "Report Agent", "Generates owner, caregiver, admin, workspace-intelligence, and vet-ready summaries.", ["generate_report", "prepare_export"], "medium"),
    ("care_planner", "Care Plan Agent", "Suggests safe bonding rituals, routines, decompression plans, and care-circle handoffs.", ["suggest_rituals", "build_daily_plan"], "medium"),
    ("relationship_analyst", "Relationship Analyst Agent", "Reviews human-animal bond signals and produces explainable relationship intelligence.", ["score_relationship", "explain_trends"], "medium"),
    ("data_analyst", "Data Analyst Agent", "Reviews wellness trends, bond score factors, and app usage patterns.", ["analyze_trends"], "low"),
    ("support", "Support Agent", "Explains app features and helps users complete non-sensitive workflows.", ["answer_help"], "low"),
    ("admin_ops", "Admin Ops Agent", "Monitors failed jobs, errors, usage, and approval queues without deleting records.", ["monitor_health", "create_alert"], "medium"),
]

KNOWLEDGE = [
    ("What is the Bond Score?", "bond_score", "The Bond Score is a 0-100 relationship wellness indicator computed from your daily check-ins (connection quality and stress), wellness logs (appetite, energy, sleep, anxiety), and completed bonding rituals. It includes a trend (improving/stable/needs attention) and a confidence label based on how much data you've logged. It is not a medical diagnosis and does not replace veterinary care."),
    ("How do daily check-ins work?", "features", "A daily check-in takes about 30 seconds: record your mood, your pet's mood, your stress level (1-10), and the connection quality you felt (1-10). Check-ins feed the Bond Score and Relationship Intelligence engine. You can complete them from the Dashboard or the Daily Check-In page."),
    ("What are rituals?", "features", "Rituals are short, low-pressure bonding routines like a 5-minute calm connection, walk-and-reflect, or senior comfort check. You can create your own or ask the AI to generate one tailored to your pet. Completing rituals and logging your pet's response improves your Bond Score signal."),
    ("How do vet-ready reports work?", "reports", "Vet-ready reports organize your recent check-ins, wellness logs, ritual completions, and relationship intelligence into a timeline a veterinarian can review quickly. Reports contain observations only — no diagnosis. Sharing a report requires your consent, which you control in Privacy & Consent."),
    ("How is my privacy protected?", "privacy", "Soula Paws is privacy-first: your profiles and logs are private to your account, report sharing requires explicit consent, sensitive actions are audit-logged, and data deletion/export requests go through a verified human review workflow. Manage everything in Privacy & Consent settings."),
    ("How do I reset my password?", "account", "On the login page choose 'Reset my password', enter your email, and follow the reset link. While logged in you can change your password from your profile menu. If you're locked out, the voice support agent can create a secure handoff ticket for you."),
    ("What can the AI Bond Coach do?", "ai", "The AI Bond Coach summarizes trends, explains Bond Score changes, suggests safe bonding rituals, and prepares vet-ready summaries. It never diagnoses, never prescribes medication, and always recommends veterinary care for medical or urgent concerns. Every response includes a safety level and confidence label."),
    ("When should I contact a vet?", "safety", "Contact a veterinarian or emergency clinic immediately for: seizures, suspected poisoning, bleeding, difficulty breathing, collapse, bloat, or any rapidly worsening symptom. Soula Paws provides observation support only and cannot make emergency decisions."),
]


async def seed_database():
    ts = now_iso()
    today = datetime.now(timezone.utc).date()
    yesterday = (today - timedelta(days=1)).isoformat()
    today_s = today.isoformat()

    async def upsert(collection, doc_id, doc):
        existing = await db[collection].find_one({"id": doc_id})
        if not existing:
            base = {"id": doc_id, "createdAt": ts, "updatedAt": ts, "deletedAt": None, "deletedBy": None}
            base.update(doc)
            await db[collection].insert_one(base)

    await upsert("users", SEED_ADMIN_ID, {"email": "admin@soulapaws.local", "passwordHash": hash_password("Admin123!"), "name": "Soula Paws Admin", "role": "admin", "isActive": True, "lastLoginAt": None})
    await upsert("users", SEED_OWNER_ID, {"email": "owner@soulapaws.local", "passwordHash": hash_password("Owner123!"), "name": "Demo Pet Parent", "role": "owner", "isActive": True, "lastLoginAt": None})
    await upsert("users", SEED_CAREGIVER_ID, {"email": "caregiver@soulapaws.local", "passwordHash": hash_password("Caregiver123!"), "name": "Demo Caregiver", "role": "caregiver", "isActive": True, "lastLoginAt": None})

    await upsert("humanProfiles", SEED_HUMAN_ID, {"userId": SEED_OWNER_ID, "displayName": "Demo Pet Parent", "emotionalGoals": ["reduce anxiety together", "build a calm daily ritual", "track senior-pet comfort"], "stressLevel": 4, "currentMood": "hopeful", "preferredRoutines": ["morning walk", "evening decompression", "quiet gratitude log"], "notes": "Seed profile used to demonstrate the dual human + animal emotional tracking model."})

    await upsert("petProfiles", SEED_PET_ID, {"userId": SEED_OWNER_ID, "name": "Milo", "species": "Dog", "breed": "Rescue mix", "age": 8, "sex": "male", "weight": 54, "status": "senior", "traits": ["gentle", "food motivated", "noise sensitive"], "triggers": ["thunder", "fast approaches", "vacuum"], "comfortRituals": ["soft blanket", "slow hand target", "quiet corner"], "medicalNotes": "Demo observation only: occasional stiffness after long walks.", "vetContact": "Demo Vet Clinic - replace with real contact"})

    await upsert("relationshipPods", SEED_POD_ID, {"userId": SEED_OWNER_ID, "name": "Milo Calm Bond Workspace", "description": "A relationship intelligence workspace for tracking emotional connection, senior comfort, and caregiver coordination.", "mode": "senior", "petIds": [SEED_PET_ID], "humanProfileIds": [SEED_HUMAN_ID], "goals": ["increase calm connection", "watch wellness changes", "prepare vet-ready summaries"], "privacyLevel": "care_circle", "status": "active"})

    await upsert("podMembers", "seed-pod-member-caregiver", {"ownerUserId": SEED_OWNER_ID, "podId": SEED_POD_ID, "name": "Demo Caregiver", "email": "caregiver@soulapaws.local", "role": "caregiver", "permissions": ["view_rituals", "add_wellness_logs", "view_reports"], "status": "active"})

    await upsert("careCircleMembers", "seed-care-circle-member", {"ownerUserId": SEED_OWNER_ID, "petId": SEED_PET_ID, "name": "Demo Caregiver", "email": "caregiver@soulapaws.local", "role": "Evening caregiver", "permissions": ["log wellness", "complete rituals", "view caregiver reports"], "status": "active"})

    await upsert("dailyCheckins", "seed-checkin-yesterday", {"userId": SEED_OWNER_ID, "petId": SEED_PET_ID, "date": yesterday, "humanMood": "stressed but present", "petMood": "calm after walk", "stressLevel": 5, "connectionQuality": 7, "notes": "Milo relaxed after a slow walk and settled near the couch."})
    await upsert("dailyCheckins", "seed-checkin-today", {"userId": SEED_OWNER_ID, "petId": SEED_PET_ID, "date": today_s, "humanMood": "grounded", "petMood": "curious", "stressLevel": 3, "connectionQuality": 8, "notes": "Short calm connection ritual worked well before breakfast."})

    await upsert("wellnessLogs", "seed-wellness-yesterday", {"userId": SEED_OWNER_ID, "petId": SEED_PET_ID, "date": yesterday, "appetite": 8, "energy": 6, "sleep": 7, "bathroom": "normal", "anxiety": 4, "behaviorNotes": "Wanted extra reassurance during storm noise.", "medicalObservations": "Observation only: mild stiffness after stairs."})
    await upsert("wellnessLogs", "seed-wellness-today", {"userId": SEED_OWNER_ID, "petId": SEED_PET_ID, "date": today_s, "appetite": 9, "energy": 7, "sleep": 8, "bathroom": "normal", "anxiety": 2, "behaviorNotes": "More playful after decompression routine.", "medicalObservations": "No urgent signs reported. Consult a veterinarian for medical concerns."})

    await upsert("rituals", SEED_RITUAL_ID, {"userId": SEED_OWNER_ID, "petId": SEED_PET_ID, "podId": SEED_POD_ID, "title": "5-Minute Calm Connection", "description": "A low-pressure bonding ritual focused on quiet presence, consent-based interaction, and observation.", "durationMinutes": 5, "category": "Calm Bonding", "steps": ["Choose a quiet room", "Sit sideways and breathe slowly", "Invite Milo with a soft voice", "Reward calm proximity", "Log one observation"], "status": "active", "aiGenerated": False})

    await upsert("ritualCompletions", "seed-ritual-completion", {"userId": SEED_OWNER_ID, "ritualId": SEED_RITUAL_ID, "petId": SEED_PET_ID, "result": "completed", "petResponse": "Milo chose to lie nearby and accepted gentle praise.", "emotionalResult": "User felt calmer and more connected.", "completedAt": ts})

    await upsert("notifications", "seed-notification-welcome", {"userId": SEED_OWNER_ID, "title": "Welcome to Soula Paws", "body": "Start with a daily check-in, a wellness log, and the 5-minute calm connection ritual.", "readAt": None})

    await upsert("consentRecords", "seed-consent-ai-safety", {"userId": SEED_OWNER_ID, "consentType": "ai_wellness_assistance", "granted": True, "details": "Demo consent for AI-generated relationship insights. AI does not diagnose or replace a veterinarian."})

    for key, name, description, tools, risk in AGENTS:
        await upsert("agentRegistry", f"agent-{key}", {"key": key, "name": name, "role": name.replace(" Agent", ""), "description": description, "tools": tools, "riskLevel": risk, "enabled": True})

    for i, (title, category, content) in enumerate(KNOWLEDGE):
        await upsert("knowledgeArticles", f"seed-kb-{i}", {"title": title, "category": category, "content": content, "createdByUserId": SEED_ADMIN_ID})

    await upsert("systemEvents", "seed-system-event", {"level": "info", "message": "Soula Paws seed data initialized.", "metadata": {"source": "seed.py"}})
    logger.info("Seed data ensured.")
