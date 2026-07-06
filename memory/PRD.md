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

## Testing status (iteration_1)
Backend 96.4% → consent bug fixed & verified (upsert + latest-updatedAt-wins). Frontend 100%.

## Notes
- LLM: EMERGENT_LLM_KEY in backend/.env, model gpt-4o-mini
- Design: warm calming wellness (oat/espresso/ocean-teal/clay tokens), EB Garamond + Figtree, per /app/design_guidelines.md
