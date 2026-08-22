# Adaptiq — Project Context

> **Living document. Update it at the end of every working session — before finishing a task, revise §3 State, §6 Next Actions, and §5 Decision Log if anything changed. Stale context is a bug.**

Last updated: 2026-08-22 · Phase: architecture complete, implementation not started

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
| PRD analysis | ✅ Complete |
| DAR / tech stack | ✅ Complete — `docs/DAR-TECH-STACK.md` (12 decisions, assumptions A-01…A-07) |
| System architecture | ✅ Complete — `docs/ARCHITECTURE.md` |
| Knowledge graph + motion system | ✅ Complete — `docs/DESIGN-MOTION-SYSTEM.md` |
| README | ✅ Complete |
| Application code | ⬜ Not started — awaiting go-ahead |

Nothing is implemented yet. No scaffold, no schema, no code.

---

## 4. Resolved Stack

```
Next.js 15 (App Router, TypeScript strict) — one Vercel deployment
  ├─ UI        MUI v6 (Material Design, LIGHT theme) · React Flow · GSAP + @gsap/react
  ├─ API       Route Handlers: rate limit → session → Zod → RBAC → service → repository
  ├─ Auth      Auth.js v5 (Credentials, JWT) · bcryptjs cost 12 · DB-verified RBAC
  ├─ Engine    Pure TS: irt · cat · bkt · decay · graph · path · recommender · layout
  ├─ AI        Anthropic claude-sonnet-5 — explanations + Socratic hints ONLY
  └─ Data      Prisma 6 → Neon Serverless PostgreSQL (pooled runtime, direct migrations)

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
| D12 | **Server-computed deterministic graph layout** | A map that re-tumbles each visit destroys the learner's mental model; also makes tests deterministic |

---

## 6. Next Actions

1. Scaffold Next.js 15 + strict TS + ESLint/Prettier + env validation + CI skeleton
2. Prisma schema + migrations + idempotent seed (~50-node CS/AI concept graph, questions, 4-level hint ladders, misconceptions)
3. Auth + RBAC + rate limiting + `withApi()` wrapper + error taxonomy
4. Engine modules **with unit tests written alongside** (`irt`, `bkt`, `decay`, `graph`, `path`, `recommender`, `layout`)
5. Diagnostic API → assessment/answer transaction → knowledge-state service
6. Design system: light Material theme, halftone/grid graphics, `MotionProvider`, motion tokens
7. Learner journey screens end-to-end on real data
8. Knowledge graph + table twin
9. AI layer with guardrails + fallback
10. Review/progress/cohort → a11y pass → full test suite → security review → deploy → verify on Vercel

**Blocked on:** stakeholder sign-off of assumptions A-01, A-02, A-04. Also need to know whether a Neon project and Anthropic key already exist, or whether to scaffold against local `postgres:16`.

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
