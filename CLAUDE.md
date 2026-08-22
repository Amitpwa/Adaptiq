# Adaptiq — Project Context

> **Living document. Update it at the end of every working session — before finishing a task, revise §3 State, §6 Next Actions, and §5 Decision Log if anything changed. Stale context is a bug.**

Last updated: 2026-08-22 · Phase: auth + curriculum live on Neon; diagnostic API next

---

## 1. THE AGENDA (never lose this)

> **Build an AI-powered learning system that can understand a learner's evolving knowledge state and deliver a personalized learning experience. The solution combines explanations, interactive learning, assessment, feedback, knowledge tracking, and adaptive content to help learners progress more effectively.**

Every feature must answer: *how does this help understand the learner better, or improve their learning?* If it can't, it doesn't ship — regardless of how good it looks.

**The chain that must be visible end-to-end, and always work:**

```
Learner → Diagnostic → Knowledge State → Identified Gaps → Personalized Content
       → Learning Activity → Assessment → Updated Knowledge State → New Recommendation
```

This connected loop matters more than the number of features.

---

## 2. Product

**Name:** Adaptiq
**Spec:** `adaptive_learning_intelligence_system_prd.md` (ALIS PRD v1.0.0) — the source of truth
**Deploy target:** Vercel (live demo must run there)
**Database:** PostgreSQL (Neon) — real and persistent, no exceptions

---

## 3. Current State

| Area | Status |
|---|---|
| Docs: PRD analysis · DAR · architecture · motion spec · README | ✅ |
| Scaffold: Next 16, TS strict, ESLint flat, Prettier, Vitest | ✅ lint/typecheck/tests all clean |
| **Neon Postgres connected** | ✅ 2 migrations applied (`init`, `llm_credentials`) |
| Prisma schema — 27 models | ✅ |
| Adaptive engine (irt, bkt, decay, graph, cat, path, layout, recommender) | ✅ 92 unit tests passing |
| Seed: 26 concepts, 38 edges, 2 goals, 16 lenses, 9 questions, 36 hints, 9 misconceptions | ✅ idempotent, runs green |
| Auth: Auth.js v5 credentials, bcrypt-12, register API, login/register pages | ✅ verified incl. security cases |
| Lib layer: db, env, errors, logger, crypto, rate-limit, api-handler | ✅ |
| AI layer: 4-tier resolution, Anthropic + OpenAI-compatible backends, model allowlist | ✅ written, untested |
| BYOK: `LlmCredential` model + AES-256-GCM encryption | ⬜ API + UI still to build |
| Diagnostic API / assessment / knowledge-state service | ⬜ **Next** |
| Dashboard, path, learn, knowledge graph, motion layer | ⬜ |

**Verified by running it:** register returns 201 and persists a bcrypt-12 hash with a
transactional `LearnerProfile`; duplicate email → 409; weak password → 400; `role: "ADMIN"`
injection → 400 with no row written. `/login` and `/register` render 200.

---

## 4. Resolved Stack

```
Next.js 16.3 (App Router, TypeScript strict) — one Vercel deployment
  ├─ UI        MUI v9 (Material Design, LIGHT theme) · React Flow · GSAP + @gsap/react
  │            Fonts: Poppins (display) + Inter (body)
  ├─ API       Route Handlers: rate limit → session → Zod → RBAC → service → repository
  ├─ Auth      Auth.js v5 (Credentials, JWT) · bcryptjs cost 12 · DB-verified RBAC
  ├─ Engine    Pure TS: irt · cat · bkt · decay · graph · path · recommender · layout
  ├─ AI        Anthropic claude-sonnet-5 — explanations + Socratic hints ONLY
  └─ Data      Prisma 7 → Neon Serverless PostgreSQL (pooled runtime, direct migrations)

Testing: Vitest (unit/integration/API) · Playwright + axe-core (E2E/a11y/motion)
```

---

## 5. Decision Log (the ones that constrain everything downstream)

| # | Decision | Why it matters |
|---|---|---|
| D1 | Single Next.js deployment; **no FastAPI/LangGraph** despite PRD §8.1 | A second always-on host breaks Vercel single-deploy delivery (A-01) |
| D5 | **BKT + 2PL IRT + Ebbinghaus decay**, not DKT Bi-LSTM | DKT needs a GPU host and training data that doesn't exist pre-launch (A-02). Swappable behind `KnowledgeTracer` |
| — | **AI is never on the correctness path** | Mastery, grading, item selection, pathing are deterministic tested code. LLM only phrases explanations and hints. This is what makes the system testable and explainable |
| — | **App works fully with `ANTHROPIC_API_KEY` unset** | Degrades to curated content + DB-backed hint ladder. A tested path, not a stub |
| D4 | Knowledge graph in **Postgres recursive CTEs**, no Neo4j | Nothing to gain at 50–200 nodes; costs a service and a failure mode |
| D9 | Rate limiting in **Postgres**, no Redis/DynamoDB | In-memory is semantically broken in serverless; one datastore is enough (A-03) |
| D10 | **No arbitrary code execution** | `eval`/`vm` on Vercel is an RCE hole. Code items graded deterministically against stored answers (A-04) |
| D11 | **GSAP** motion layer under a strict merge gate | Every animation must carry information + have a static equivalent + respect reduced motion (A-07) |
| — | **Four-tier LLM resolution** | learner's own key → deployment key → free open-source model via OpenAI-compatible gateway → deterministic. No GPU on Vercel, so "free open source" means a hosted gateway (OpenRouter/Groq) with one operator key, never self-hosted weights |
| — | **Learner API keys encrypted with AES-256-GCM** | Threat model is a DB dump. Key never returns to the browser; UI shows last-4 only. Does not defend against app-server RCE — that needs a KMS, recorded not assumed away |
| D12 | **Server-computed deterministic graph layout** | A map that re-tumbles each visit destroys the learner's mental model; also makes tests deterministic |

---

## 6. Next Actions

1. **Diagnostic vertical slice** — `POST /api/diagnostic/sessions`, `GET .../next`,
   `POST .../answers`, `POST .../complete`; CAT item selection + theta update + seeding
   `KnowledgeState` from the diagnostic
2. Onboarding UI: goal picker → cognitive-lens preference → diagnostic runner
3. Dashboard on real knowledge state (recommendations with rationale)
4. BYOK: validate-key API (live provider call, rate-limited) + connect dialog + the
   "connect your model" prompt at the point of use
5. Knowledge graph + table twin + GSAP motion layer
6. Tutor API with guardrails + hint ladder fallback
7. Integration/API/E2E suites, a11y pass, Vercel deploy

---

## 7. Working Conventions

**Non-negotiables from the brief — these are acceptance criteria, not preferences:**

- **No fake anything.** Every displayed value traces to a DB row or a computation over one. No hardcoded metrics, no static "recommendations", no fixture users, no placeholder dashboards.
- **Server is the security boundary.** Ownership enforced in the SQL `WHERE`, never in the UI. `userId` comes from the session, never the request body. All write schemas `.strict()`.
- **Light theme, Material Design.** Never dark-first.
- **WCAG 2.2 AA.** Semantic HTML, keyboard-operable, visible focus, labelled fields, no colour-only status, reduced-motion honoured.
- **Tests ship with features.** A feature isn't done until its critical behaviour is tested. No feature is marked complete while its implementation is partial.
- **No magic numbers.** Thresholds, weights, durations, eases all live in named constants.
- **Errors are handled, never swallowed.** Loading, empty, success, and error states exist on every data surface.
- **Secrets are server-only.** Nothing sensitive under `NEXT_PUBLIC_`.

**Engine purity:** `src/engine/**` imports no I/O and no Prisma. Pure functions, unit-tested against hand-computed values.

**Dependency direction:** presentation → API → services → (engine | ai | repositories) → database. Never upward.

**Animation gate:** see `docs/DESIGN-MOTION-SYSTEM.md` §9. If an animation can't state the information it carries, it doesn't merge.

---

## 8. Key Thresholds (single source: `src/engine/constants.ts`)

| Constant | Value | Meaning |
|---|---|---|
| Mastery: MASTERED | ≥ 0.85 | effective mastery = raw × retrievability |
| Mastery: FRAGILE | 0.60–0.85, or R(t) < 0.70 | needs review |
| Mastery: IN_PROGRESS | 0.30–0.60 | |
| Mastery: GAP | < 0.30 with ≥1 attempt | |
| Prerequisite unlock | ≥ 0.70 | gates the next node |
| Review trigger | R(t) < 0.70 | schedules a micro-probe |
| CAT stop | SE < 0.35 or 7 items | PRD says 5–7 |
| ZPD target accuracy | 0.70 (band 0.60–0.80) | drives difficulty selection |
| AI timeout | 3500ms | then deterministic fallback |
| Max interaction animation | 900ms | learning flow beats choreography |

---

## 9. Database & Environment Setup

Docker is **not** used. The database is Neon (same provider as production), so local and deployed
environments cannot drift.

Required in `.env` (template in `.env.example`):

| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string — host contains `-pooler` |
| `DIRECT_URL` | Neon **direct** connection string — migrations only; PgBouncer transaction mode cannot run DDL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` locally |
| `ANTHROPIC_API_KEY` | Optional. Unset ⇒ deterministic mode (curated content + DB hint ladder) |

Neon project settings that matter: Postgres 16+, region near the Vercel deployment region, and a
separate branch for CI so integration tests run against real Postgres without touching dev data.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
