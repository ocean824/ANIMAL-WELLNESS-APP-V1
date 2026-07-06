# plan.md — Soula Paws (AI Bond & Wellness OS)

## 1) Objectives
- Validate the **core risk area** end-to-end: **Emergent LLM integration + AI safety guardrails + MongoDB persistence**.
- Deliver a deployable **FARM** application: **FastAPI + Motor(MongoDB) + React (shadcn/ui + Tailwind)** with a warm, calming wellness UX.
- Implement the full PRD scope as defined in the docs + example codebase:
  - Profiles, pods/workspaces, care circle, check-ins, wellness logs, rituals + completions
  - Bond Score + Relationship Intelligence (explainable, confidence labels)
  - AI Bond Coach (SSE streaming) + AI ritual generation + AI-enhanced reports
  - Agent Command Center (14 agents, risk labels, approval gates)
  - Voice Support Agent (Speech API + text fallback, escalation/tickets, knowledge base)
  - Admin dashboard, audit logs, consent + privacy controls, notifications
- Close out remaining QA gaps and document future enhancements (email delivery, attachments, monetization).

**Current status:** Core objectives achieved. Phase 1 POC complete; Phase 2–4 shipped in one build; the only test-reported bug (consent enforcement) is fixed and verified.

---

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (Isolation; do not proceed until green)
**Goal:** verify AI + structured outputs + DB writes + safety classification.
1. Establish Emergent Universal LLM key integration pattern via `emergentintegrations`.
2. Create `/app/poc/test_core.py`:
   - Connect to MongoDB (Motor), write/read a sample record, validate soft-delete behavior.
   - Call LLM with Bond Coach system prompt; assert non-empty response.
   - Run **safety classifier** (high/medium/low keywords) and assert escalation text for high-risk prompt.
   - Call LLM to generate a **Ritual JSON** and validate with Pydantic.
3. Add retry + schema validation until stable.

**Phase 1 user stories**
1. As a developer, I want a script that proves MongoDB read/write works so persistence won’t fail later.
2. As a developer, I want a script that proves the Emergent LLM key returns usable text so AI features won’t be blocked.
3. As a developer, I want ritual generation to return valid JSON so the UI can render steps reliably.
4. As a user, I want emergency-like inputs to trigger clear vet/emergency guidance language.
5. As an admin, I want all AI calls to be auditable so safety and compliance are reviewable.

**Status:** ✅ Complete — all 4 POC tests passed first run (Mongo, LLM chat, safety escalation, ritual JSON).

---

### Phase 2 — V1 App Development (Full build: backend + frontend + seed)
**Goal:** ship the full Soula Paws OS MVP on a stronger architecture than the reference repo.

1. Repo scaffold
   - Backend: FastAPI app with modular routers/services; Motor DB; Pydantic schemas.
   - Frontend: React 19 + shadcn/ui + Tailwind; routing; API client; toasts.

2. Data model + collections (Mongo)
   - Mirror PRD entities with `deletedAt/deletedBy` soft delete.
   - Add indexes on common access patterns.
   - **Consent records** designed for privacy: deterministic state per user + consentType.

3. Backend implementation (full)
   - Health: `/api/health`.
   - Auth: register/login/logout/me + forgot/reset password (dev reset token link) + change password.
   - Generic CRUD for PRD resources with:
     - Ownership scoping + reference ownership validation
     - Soft delete
     - Audit logging
   - Workflows:
     - Bond Score calculation (deterministic formula from source)
     - Relationship Intelligence snapshots (dimensions, risks, next best actions)
   - AI:
     - AI Bond Coach **SSE streaming** via `/api/ai/chat`
     - AI ritual generator `/api/ai/generate-ritual` (structured JSON, validated)
   - Reports:
     - `/api/reports/generate` with AI narrative summary + markdown content
     - Consent-gated report sharing `/api/reports/{id}/share`
   - Agents:
     - 14-agent registry, tasks/runs/messages/approvals
     - High-risk agents require human approval
   - Voice Support Agent:
     - `/api/voice/message` with escalation rules + KB-grounded replies + support tickets
   - Admin:
     - metrics/users/tickets/escalations/audit/system-health
   - Seed data:
     - Seed admin/owner/caregiver + Milo demo pod/logs/ritual/care circle + agent registry + knowledge base

4. Frontend implementation (full)
   - 17 pages implemented:
     - Public: Landing, Login, Register, Forgot Password, Reset Password
     - App: Dashboard, Human Profile, Pets, Workspaces, Check-ins, Wellness Logs, Rituals, Bond Score, Intelligence, AI Coach, Reports, Care Circle, Voice Support, Agent Center, Privacy & Consent
     - Admin: Admin dashboard
   - Warm calming wellness design per `/app/design_guidelines.md`.
   - UX hardening included: empty/loading/error states, downloads for reports, bento dashboard grid, recharts history.

**Phase 2 user stories**
1. As a user, I want to explore the app immediately with seeded Milo data so I understand the value fast.
2. As a user, I want to log a daily check-in and wellness log so the system can compute Bond Score.
3. As a user, I want to generate a Bond Score with confidence + factors so I can interpret it safely.
4. As a user, I want a relationship intelligence snapshot with risks + next actions so I know what to do next.
5. As a user, I want an AI-generated ritual I can complete and record outcomes for.

**Status:** ✅ Complete — backend + frontend shipped together, seed data present.

---

### Phase 3 — Full Feature Set (Auth, Admin, Agents, Voice, Consent, Notifications)
**Goal:** complete PRD scope beyond core wellness logging.

1. Auth + security
   - JWT bearer auth + bcrypt
   - Forgot/reset password (dev-mode reset token) + change password
   - RBAC with admin-gated endpoints
   - Rate limiting on auth/AI

2. Agent Command Center
   - Seeded 14 agents with tools + risk labels
   - Run tasks, log runs/messages
   - High-risk requires approval workflow

3. Voice Support Agent
   - Speech API UI + text fallback
   - Escalation triggers → support tickets + admin review
   - Knowledge base grounding

4. Admin dashboard
   - Metrics, user management, audit logs, agent runs, tickets, system health, KB management

5. Consent + privacy
   - Consent records CRUD
   - Consent-gated report sharing
   - **Fix applied after QA:** consent records now upsert-by-type + report sharing checks latest updated consent

6. Notifications
   - Bell UI, list/mark read

**Status:** ✅ Complete — delivered as part of Phase 2 build.

---

### Phase 4 — Hardening, UX polish, and comprehensive validation
1. UX polish and “calm premium” look (tokens, fonts, spacing, micro-interactions) — included.
2. Charts via Recharts (Bond Score history) — included.
3. Report download/export — included.
4. Deep QA:
   - Testing agent iteration_1 ran: backend 96.4%, frontend 100%.
   - Consent bug fixed and verified via 4-scenario test:
     - No consent → 403
     - Granted → 200
     - Duplicate grants collapse to 1 active record
     - Deleted consent → 403

**Status:** ✅ Complete — no blocking items remaining.

---

## 3) Next Actions (Immediate)
1. ✅ None blocking.
2. Optional regression: re-run testing agent suite after consent fix (not required; backend verification was done via direct curl checks).
3. Documentation polish: ensure `/app/memory/PRD.md` and `/app/memory/test_credentials.md` remain current.

---

## 4) Success Criteria
- ✅ Phase 1: POC script reliably passes (DB ok, LLM ok, safety escalation ok, ritual JSON validated).
- ✅ Phase 2: Seeded app supports core workflow: log → score → insight → AI coach → ritual → report.
- ✅ Phase 3: Auth + admin + agents + voice support + consent + notifications functional with RBAC + audit.
- ✅ Phase 4: UX includes charts/empty states/downloads; QA run completed; consent sharing is correctly enforced.

---

## 5) Future Enhancements (Non-blocking)
- Add email delivery service for password reset links (production mode) instead of dev reset token.
- Add file/photo attachments to wellness logs and reports.
- Add Stripe subscriptions/usage quotas (Phase 7 in docs).
- Add provider portal / scoped provider viewer experience.
- Add persistent rate limiting (Redis) and production security headers/CSRF strategy if switching to cookies.
