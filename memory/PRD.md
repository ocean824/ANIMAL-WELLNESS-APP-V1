# Soula Paws — AI Bond & Wellness OS (PRD / Build Record)

## What it is
Privacy-first relationship intelligence platform for human-animal bonds (NOT a pet tracker). Rebuilt from user's source docs + Express/JSON-file example codebase onto FastAPI + MongoDB + React with real AI.

## Architecture improvements over source codebase
- JSON-file persistence → MongoDB (Motor async, indexes, soft delete everywhere)
- Simulated AI fallback → real LLM via Emergent Universal Key (gpt-4o-mini, configurable via LLM_MODEL env)
- SSE streaming AI coach chat; structured JSON ritual generation w/ Pydantic validation + retry
- Modular FastAPI: routers (auth, crud generic, workflows, agents, voice, admin) + services (llm, domain, voice) + idempotent seed
- Consent records upsert-by-type (deterministic consent state); consent-gated report sharing
- JWT bearer auth (bcrypt), RBAC (owner/caregiver/provider/admin), in-memory rate limiting, audit logging on all sensitive actions

## Feature set (all implemented, backend + frontend)
Landing, auth (register/login/logout/forgot+reset password w/ dev reset link/change password), dashboard (bento grid), human profiles, pet profiles, relationship workspaces (pods), pod members, care circle, daily check-ins (auto bond-score recalc), wellness logs, rituals + AI ritual generator + completions, Bond Score engine (deterministic formula from source, gauge + recharts history + explainable factors), Relationship Intelligence (5 weighted dimensions, risks, next actions), AI Bond Coach (SSE streaming, safety levels high/medium/low, confidence badges), reports (vet_ready/user_wellness/caregiver/pod_intelligence, AI narrative, markdown viewer, download, consent-gated share), Voice Support Agent (browser SpeechRecognition + text fallback, speech synthesis, escalation rules: pet_emergency/aggression/billing/privacy → tickets; account questions → guided; KB-grounded LLM answers), Agent Command Center (14 seeded agents, high-risk → needs_approval + approval gates), notifications, privacy & consent page, admin dashboard (metrics, users CRUD, tickets, audit logs, agent runs, knowledge base, system health).

## Key files
- Backend: /app/backend/{server,database,models,auth_utils,llm_service,domain_services,voice_service,seed}.py + routers/
- Frontend: /app/frontend/src/pages/* (17 pages), components/{Layout,shared}.js, lib/{api,auth}.js
- Bond Score formula: connection*4 + wellnessAvg*4 + min(completions*2,12) - stress*1.5 + 10, clamp 0-100; confidence by data volume (>=12 high, >=5 medium)

## Testing status (iteration_2)
Backend 96.8%, frontend 100%. All security review findings fixed & verified (IDOR conversation checks, $-key sanitization, password policy letters+number, JWT_SECRET >= 32 chars enforced at startup, security headers, CORS credentials disabled on wildcard, TRUST_PROXY flag, EXPOSE_RESET_TOKEN gate).

## Iteration 2 additions (Phase 7+ without external wiring)
- Back button in app header on all non-home pages; smart logo (landing + sidebar + auth) -> "/" logged out, /dashboard or /admin logged in
- Plan tiers free/premium (billing.py): quotas free = 100 AI calls/mo, 3 pets, 10 reports/mo, 30 agent runs/mo -> 402 with upgrade message; premium unlimited
- /billing page: usage bars, plan cards, upgrade button records intent (billingEvents) - STRIPE PLACEHOLDER, to be wired on Replit
- Privacy: GET /api/privacy/export (full JSON download), POST /api/privacy/delete-request (high-priority privacy ticket, dedup)
- Admin users table: plan select (free/premium)
- /app/README.md: Replit export guide (env vars, deferred Stripe/Resend wiring points, security posture)

## Notes
- LLM: EMERGENT_LLM_KEY in backend/.env, model gpt-4o-mini
- Design: warm calming wellness (oat/espresso/ocean-teal/clay tokens), EB Garamond + Figtree, per /app/design_guidelines.md
