# Soula Paws — AI Bond & Wellness OS

Privacy-first relationship intelligence platform for human-animal bonds.
Stack: **FastAPI + MongoDB (Motor) + React (shadcn/ui, Tailwind)**.

## Project layout
```
backend/            FastAPI app (server.py entrypoint)
  routers/          auth, generic CRUD, workflows (AI/bond/reports), agents, voice, admin, account
  llm_service.py    LLM layer (Emergent universal key; swap to direct OpenAI easily)
  domain_services.py Bond Score, Relationship Intelligence, reports, agent runner
  voice_service.py  Voice support agent escalation rules + KB grounding
  billing.py        Plan tiers + usage quotas (Stripe wiring deferred)
  seed.py           Idempotent demo data (accounts, Milo, 14 agents, knowledge base)
frontend/           React app (src/pages, src/components, src/lib)
```

## Environment variables
### backend/.env
| Var | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated allowed origins (`*` for dev) |
| `JWT_SECRET` | **Change in production.** Secret for JWT signing |
| `EMERGENT_LLM_KEY` | Emergent universal LLM key (or refactor `llm_service.py` to use `OPENAI_API_KEY`) |
| `LLM_MODEL` | e.g. `gpt-4o-mini` |
| `EXPOSE_RESET_TOKEN` | `true` in dev only: returns password-reset token in API response. **Set `false` in production** and wire an email provider (e.g. Resend) in `routers/auth_routes.py` → `forgot_password`. |

### frontend/.env
| Var | Purpose |
|---|---|
| `REACT_APP_BACKEND_URL` | Public URL of the backend (frontend calls `{URL}/api/...`) |

## Run
```bash
# backend
cd backend && pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
# frontend
cd frontend && yarn install && yarn start
```

## Demo accounts (seeded)
- `admin@soulapaws.local` / `Admin123!` (admin)
- `owner@soulapaws.local` / `Owner123!` (owner, seed pet "Milo")
- `caregiver@soulapaws.local` / `Caregiver123!`

## Deferred integrations (wire on Replit)
1. **Stripe** — `backend/billing.py` defines plan limits; `POST /api/billing/upgrade` currently records an upgrade intent (`billingEvents` collection). Replace with Stripe Checkout + webhook that sets `users.plan = "premium"`.
2. **Resend / email** — `POST /api/auth/forgot-password` generates a hashed reset token. Send `https://<app>/reset-password/<token>` by email and set `EXPOSE_RESET_TOKEN=false`.

## Safety model (non-negotiable)
AI never diagnoses, prescribes, replaces a veterinarian, or makes emergency decisions. High-risk language triggers escalation guidance and support tickets; all sensitive actions are audit-logged; report sharing is consent-gated.
