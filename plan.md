# plan.md — Soula Paws (AI Bond & Wellness OS)

## 1) Objectives
- Prove the **core failure-prone workflow** works end-to-end in isolation: **Emergent LLM integration + safety guardrails + MongoDB persistence**.
- Build a Replit/deployable **FARM** MVP: FastAPI + Motor(MongoDB) + React(shadcn/Tailwind) with warm calming UX.
- Implement the full PRD scope: profiles, pods, check-ins, wellness, rituals, Bond Score, relationship intelligence, AI coach, reports, agents, **voice support agent**, admin, consent, notifications, audit.

---

## 2) Implementation Steps (Phased)

### Phase 1 — Core POC (Isolation; do not proceed until green)
**Goal:** verify AI + structured outputs + DB writes + safety classification.
1. Websearch best practices:
   - Emergent Universal LLM key usage via `emergentintegrations` (chat + JSON/structured outputs)
   - FastAPI + Motor patterns (connection lifecycle, indexes)
2. Create `/poc/test_core.py`:
   - Connect to MongoDB (Motor), write/read a sample record.
   - Call LLM with Bond Coach system prompt; assert non-empty response.
   - Run **safety classifier** (high/medium/low keywords) and assert escalation text for high-risk prompt.
   - Call LLM to generate a **Ritual JSON** (title, description, duration, category, steps[]) and validate with Pydantic.
3. Fix until stable:
   - Retry/backoff for LLM call errors; tight timeouts.
   - Ensure Pydantic validation catches malformed JSON and triggers retry.

**Phase 1 user stories**
1. As a developer, I want a script that proves MongoDB read/write works so persistence won’t fail later.
2. As a developer, I want a script that proves the Emergent LLM key returns usable text so AI features won’t be blocked.
3. As a developer, I want ritual generation to return valid JSON so the UI can render steps reliably.
4. As a user, I want emergency-like inputs to trigger clear vet/emergency guidance language.
5. As an admin, I want all AI calls to be auditable so safety and compliance are reviewable.

---

### Phase 2 — V1 App Development (MVP shell around proven core; minimal bulk writes)
**Goal:** working app with key flows, using the proven AI+DB core; keep auth minimal/optional for testing.
1. Repo scaffold:
   - Backend: FastAPI app with routers/services; Motor DB; Pydantic schemas.
   - Frontend: React 19 + shadcn/ui + Tailwind; routing; API client.
2. Data model + collections (Mongo): mirror PRD entities with `deletedAt/deletedBy`.
   - Add indexes: `userId`, `petId`, `podId`, `createdAt`, `status` where relevant.
3. Backend routes (V1 subset but end-to-end usable):
   - `/api/health`, seed bootstrap.
   - CRUD: human-profiles, pet-profiles, relationship-pods, care-circle-members, daily-checkins, wellness-logs, rituals, ritual-completions.
   - Workflows: `/api/bond-scores/calculate`, `/api/intelligence/relationship-insight`.
   - AI: `/api/ai/chat`, `/api/ai/generate-ritual`.
   - Reports: `/api/reports/generate` (markdown + LLM-enhanced narrative).
   - Audit logging middleware for sensitive routes.
4. Frontend pages (V1): Landing, Dashboard, CRUD screens for pets/humans/pods, Check-ins, Wellness Logs, Rituals, Bond Score, Intelligence, AI Coach, Reports.
5. Seed data: idempotent seed (admin/owner/caregiver + Milo + pod + logs + ritual + care circle).
6. Testing checkpoint: run 1 round of E2E manual flow + smoke scripts (create pet → log → score → insight → ritual → report).

**Phase 2 user stories**
1. As a user, I want to explore the app immediately with seeded Milo data so I understand the value fast.
2. As a user, I want to log a daily check-in and wellness log so the system can compute Bond Score.
3. As a user, I want to generate a Bond Score with confidence + factors so I can interpret it safely.
4. As a user, I want a relationship intelligence snapshot with risks + next actions so I know what to do next.
5. As a user, I want an AI-generated ritual I can complete and record outcomes for.

---

### Phase 3 — Add Full Feature Set (production-friendly modularization)
**Goal:** complete PRD scope: auth, admin, agents, voice support, consent, notifications.
1. Auth + security:
   - JWT bearer auth, bcrypt hashing.
   - Forgot/reset password (dev-mode reset link), change password.
   - RBAC (owner/caregiver/provider/admin) + route guards.
   - Rate limiting (auth + AI + reports).
2. Agent Command Center:
   - Seed 14 agents registry, tools, risk levels.
   - `/api/agents/run`, tasks/runs/messages/approvals.
   - High-risk => `needs_approval` + approval record; admin approval endpoints.
3. Voice Support Agent (full):
   - Backend: knowledge base articles, support tickets, voice conversations/messages.
   - Escalation rules: emergency/aggression/billing/privacy/account/unknown → ticket + safe response.
   - Frontend `/voice-support`: Speech API input + text fallback; speech synthesis output; ticket status.
   - Admin review queue for tickets + knowledge base CRUD.
4. Admin dashboard:
   - Users CRUD (disable, role change, password reset).
   - Audit log viewer, AI usage metrics, agent runs, voice tickets, system health.
5. Consent + privacy:
   - Consent records UI + API; enforce consent gates for report sharing/export.
6. Notifications:
   - Bell UI, list/mark read; reminders for rituals/logging.
7. Testing checkpoint: testing agent runs full acceptance sweep; fix until pass.

**Phase 3 user stories**
1. As a user, I want to reset my password securely so I can regain access without support.
2. As a user, I want to talk to the AI Bond Coach and get safe, non-diagnostic guidance with disclaimers.
3. As a user, I want voice-based support (with text fallback) so I can get help hands-free.
4. As an admin, I want to review escalated voice tickets and agent approvals so high-risk cases are handled by humans.
5. As a user, I want privacy/consent controls so reports are never shared without my permission.

---

### Phase 4 — Hardening, UX polish, and comprehensive validation
1. Improve dashboards (charts via Recharts; empty/loading/error states everywhere).
2. Tighten audit coverage + security headers; verify soft-delete behavior.
3. Add export/download options for reports; provider-ready formatting.
4. Run deep smoke tests: multi-user isolation, RBAC, consent gates, approvals, rate limits.

**Phase 4 user stories**
1. As a user, I want Bond Score history charts so I can see trends over time.
2. As a user, I want reports to be downloadable so I can bring them to a vet visit.
3. As a caregiver, I want restricted access so I only see what the owner allowed.
4. As an admin, I want clear system health signals so I can spot failures quickly.
5. As a user, I want the app to feel calm and easy so I keep using it daily.

---

## 3) Next Actions (Immediate)
1. Implement Phase 1 POC: `poc/test_core.py` (Mongo + LLM chat + safety + ritual JSON validation).
2. Run until all assertions pass.
3. After POC is green, generate Phase 2 code in as few bulk writes as possible (backend+frontend connected).

---

## 4) Success Criteria
- Phase 1: POC script reliably passes (DB ok, LLM ok, safety escalation ok, ritual JSON validated).
- Phase 2: Seeded app supports core workflow: log → score → insight → AI coach → ritual → report.
- Phase 3: Auth + admin + agents + voice support + consent + notifications all functional with RBAC + audit.
- Phase 4: Deep smoke tests pass; UX is consistent with calming wellness brand; no unsafe AI outputs in common scenarios.
