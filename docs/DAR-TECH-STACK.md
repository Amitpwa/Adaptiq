# Decision Analysis & Resolution (DAR) — Adaptiq Technology Stack

**Status:** Proposed for sign-off
**Date:** 2026-08-22
**Owner:** Principal Architect

**Governing constraints (non-negotiable, from the brief + PRD):**

| # | Constraint | Source |
|---|---|---|
| C1 | Must deploy and run a **live demo on Vercel** | Brief §10 |
| C2 | Must use a **real, persistent PostgreSQL** database — no mock/JSON/localStorage store | Brief §8 |
| C3 | Frontend must be **light-theme Material Design**, responsive, WCAG 2.2 AA | Brief §5, §7 |
| C4 | Real auth/authorization, server-side validation, no secrets in client | Brief §2 |
| C5 | Genuine adaptive engine over real learner data | Brief §11, PRD §5 |
| C6 | Testable end-to-end (unit → integration → API → E2E → a11y) | Brief §4 |
| C7 | Serverless execution model: no long-lived processes, no in-process state, cold starts matter | Vercel platform |

---

## 1. Evaluation Criteria & Weights

Weights derive from the constraint set; C1/C2 dominate because a stack that cannot run on Vercel with Postgres is disqualified regardless of other merits.

| ID | Criterion | Weight | Definition |
|---|---|---|---|
| K1 | **Vercel compatibility** | 25% | Runs on Vercel serverless without a second host; respects execution-time, bundle, and connection limits |
| K2 | **Correctness & type safety** | 15% | Static typing from DB row to React prop; compile-time detection of contract drift |
| K3 | **Security posture** | 15% | Mature auth primitives, parameterised queries, no unaudited native deps, secret isolation |
| K4 | **Performance / cold-start cost** | 15% | Bundle size, init time, connection acquisition, query efficiency under serverless fan-out |
| K5 | **Delivery velocity & maturity** | 10% | Docs, ecosystem, migration tooling, conventional patterns |
| K6 | **Accessibility & Material Design fit** | 10% | Ships accessible primitives; Material Design semantics out of the box |
| K7 | **Testability** | 10% | Can be exercised deterministically in CI without the cloud |

Scoring: 1 (poor) – 5 (excellent). Weighted score = Σ(weight × score). **A score of 1 on K1 is an automatic disqualification** (fatal-flaw rule), regardless of total.

---

## 2. Decision D1 — Application Framework & Runtime

**Decision statement:** Select the framework hosting UI, API, business logic, and AI orchestration for a Vercel-deployed adaptive learning system.

### Alternatives

| Alt | Description |
|---|---|
| A1 | **Next.js 15 (App Router) + TypeScript**, Route Handlers + Server Components, single deployable |
| A2 | **Next.js frontend + separate FastAPI backend** (as named in PRD §8.1), backend on Render/Fly |
| A3 | **Vite + React SPA + Express API** on a container host |
| A4 | **Remix on Vercel** |

### Evaluation

| Criterion (weight) | A1 Next.js | A2 Next + FastAPI | A3 SPA + Express | A4 Remix |
|---|---|---|---|---|
| K1 Vercel compat (25) | 5 | 2 — second host, second deploy, CORS, split secrets | 1 — **fatal**, needs container host | 4 |
| K2 Type safety (15) | 5 — one TS type graph, shared Zod schemas | 2 — TS/Python boundary, hand-synced contracts | 4 | 5 |
| K3 Security (15) | 5 — server-only modules, middleware, same-origin cookies | 3 — cross-origin token handling, two attack surfaces | 3 | 5 |
| K4 Performance (15) | 4 | 3 — extra network hop per request | 3 | 4 |
| K5 Velocity (10) | 5 | 2 — two toolchains, two test stacks, two CI lanes | 4 | 4 |
| K6 A11y/Material (10) | 5 | 5 | 5 | 5 |
| K7 Testability (10) | 4 | 3 | 4 | 4 |
| **Weighted total** | **4.70** | 2.65 | 2.85 (disqualified) | 4.45 |

**Resolution: A1 — Next.js 15 App Router + TypeScript (strict).**

**Explicit PRD deviation:** PRD §8.1 names FastAPI + LangGraph. That prescribes a second always-on host, violating C1 and the brief's instruction not to add a separate backend where Next.js server functionality suffices. Adaptiq's orchestration need (intent routing → engine call → LLM call with timeout → persistence) is a bounded state machine implemented as a typed service layer; LangGraph's durable-graph machinery is not required at this scope. **Assumption A-01.**

---

## 3. Decision D2 — PostgreSQL Provider

Postgres is mandated (C2); the question is the provider. The deciding factor is that serverless functions open **one connection per concurrent invocation** — an unpooled Postgres box exhausts `max_connections` under trivial load.

| Criterion (weight) | Neon | Supabase | Vercel Postgres | Self-hosted RDS |
|---|---|---|---|---|
| K1 (25) | 5 — pooled PgBouncer URL + serverless driver; DB branch per preview deploy | 4 — pooler present, bundles auth/storage we won't use | 5 — it *is* Neon re-badged; less portable | 2 — needs external pooler, VPC, ops |
| K2 (15) | 5 | 5 | 5 | 5 |
| K3 (15) | 5 — TLS enforced, per-branch roles, IP allowlist | 5 | 5 | 4 — ops-dependent |
| K4 (15) | 4 — scale-to-zero cold start, mitigated by pooled URL | 4 | 4 | 5 |
| K5 (10) | 5 | 4 | 4 | 2 |
| K6 (10) | 3 (n/a) | 3 | 3 | 3 |
| K7 (10) | 5 — throwaway branch per CI run = **real Postgres in CI** | 4 | 3 — Vercel-locked | 3 |
| **Weighted total** | **4.65** | 4.25 | 4.35 | 3.25 |

**Resolution: Neon Serverless Postgres.** Pooled connection string (`DATABASE_URL`, PgBouncer transaction mode) at runtime; direct string (`DIRECT_URL`) for migrations. CI creates an ephemeral Neon branch so integration tests run against real Postgres, never a stub. Local offline equivalent: Docker `postgres:16`.

---

## 4. Decision D3 — ORM / Data Access

| Criterion (weight) | Prisma 6 (+ Neon adapter) | Drizzle | Kysely | Raw `pg` |
|---|---|---|---|---|
| K1 (25) | 4 — driver adapter required | 5 | 5 | 5 |
| K2 (15) | 5 — generated relational types | 5 | 5 | 1 — hand-written row types |
| K3 (15) | 5 — always parameterised | 5 | 5 | 3 — injection risk sits with the author |
| K4 (15) | 3 — larger cold bundle | 5 | 5 | 5 |
| K5 (10) | 5 — strongest migration story, introspection, studio | 4 — `drizzle-kit` newer | 3 — bring your own migrations | 1 |
| K6 (10) | 3 | 3 | 3 | 3 |
| K7 (10) | 5 — `migrate deploy`/`reset` in CI | 4 | 4 | 2 |
| **Weighted total** | 4.30 | **4.55** | 4.35 | 3.20 |

**Resolution: Prisma 6 with `@prisma/adapter-neon` — overriding the raw score.** Documented deliberately: K5's migration maturity and schema-as-single-source-of-truth materially de-risk graded acceptance criteria (declarative constraints, cascade rules, reproducible `migrate deploy`, Brief §8). Prisma's engine-size penalty costs roughly one cold-start hit on a latency budget already dominated by LLM calls. Escape hatch: graph traversal and cohort aggregation run as **parameterised** `$queryRaw` recursive CTEs — precisely where Drizzle's edge would have mattered.

---

## 5. Decision D4 — Knowledge Graph Store

PRD §8.1 offers "Neo4j AuraDB / PostgreSQL pgvector".

| Criterion (weight) | Postgres recursive CTE | Neo4j AuraDB | In-memory graph per request |
|---|---|---|---|
| K1 (25) | 5 — zero extra infra | 3 — second service, driver, connection budget | 4 |
| K2 (15) | 5 | 3 | 4 |
| K3 (15) | 5 — one auth boundary | 3 — second credential set | 3 |
| K4 (15) | 5 — <10ms at 50–200 nodes, indexed | 4 — network hop | 2 — rebuilt per invocation |
| K5 (10) | 5 | 3 | 4 |
| K6 (10) | 3 | 3 | 3 |
| K7 (10) | 5 | 2 | 4 |
| **Weighted total** | **4.80** | 3.10 | 3.45 |

**Resolution: PostgreSQL.** The concept DAG is `concepts` + `concept_edges`; traversal (ancestors, descendants, topological order, unlock frontier) uses indexed `WITH RECURSIVE`. Neo4j buys nothing at this cardinality and costs a service, a credential, and a failure mode. `pgvector` is available in the migration but enabled only when misconception-embedding search ships (Phase 2) — not installed as decoration.

---

## 6. Decision D5 — Knowledge Tracing Algorithm

The product's core differentiator, so it gets its own DAR.

| Criterion (weight) | BKT + 2PL IRT + Ebbinghaus decay | DKT (Bi-LSTM/Transformer, PRD Phase 2) | LLM-as-tracer | Naïve % correct |
|---|---|---|---|---|
| K1 (25) | 5 — pure arithmetic, microseconds, in-request | 1 — **fatal**: GPU host + training corpus that does not exist at launch | 4 | 5 |
| K2 (15) | 5 — deterministic, unit-testable to exact values | 3 | 1 — non-deterministic, untestable | 5 |
| K3 (15) | 5 | 4 | 2 — prompt-injectable mastery scores | 5 |
| K4 (15) | 5 — **O(1) incremental** per interaction, no full recompute (Brief §3) | 2 | 1 — an LLM call per update | 5 |
| K5 (10) | 5 | 1 | 4 | 5 |
| K6 (10) | 4 — explainable to the learner ("why is this red?") | 2 — black box | 2 | 5 |
| K7 (10) | 5 | 2 | 1 | 5 |
| **Weighted total** | **4.90** | 1.95 (disqualified) | 2.35 | 5.00 |

**Resolution: BKT + 2PL IRT/CAT + Ebbinghaus decay.** Naïve % correct scores 5.0 mechanically but **fails the problem-alignment gate (Brief §6)**: it is not adaptive, carries no uncertainty, cannot drive item selection, and cannot decay — rejected on fitness for purpose, which the model treats as a hard gate rather than a weight. **Explicit PRD deviation:** DKT is deferred behind a `KnowledgeTracer` port so a neural implementation can be swapped in without touching callers. **Assumption A-02.**

---

## 7. Decision D6 — Authentication

| Criterion (weight) | Auth.js v5 (Credentials + JWT) | Clerk / Auth0 | Supabase Auth | Hand-rolled JWT |
|---|---|---|---|---|
| K1 (25) | 5 | 5 | 4 | 5 |
| K2 (15) | 4 | 4 | 4 | 3 |
| K3 (15) | 5 — httpOnly+SameSite cookies, CSRF tokens, rotation built in | 5 | 5 | 2 — every mistake is ours |
| K4 (15) | 5 — stateless JWT, no session round-trip | 3 — external call in the auth path | 4 | 5 |
| K5 (10) | 4 | 5 | 4 | 2 |
| K6 (10) | 4 — we own the accessible forms | 3 — hosted UI, less control | 4 | 4 |
| K7 (10) | 5 — mockable in unit tests, real in E2E | 2 — needs a live tenant in CI | 3 | 4 |
| **Weighted total** | **4.65** | 4.10 | 4.05 | 3.55 |

**Resolution: Auth.js v5, Credentials provider, JWT session strategy, `bcryptjs` (cost 12).** `bcryptjs` over native `bcrypt`/`argon2` because native bindings are a recurring Vercel build hazard (C1 outranks marginal KDF strength); cost 12 calibrates to roughly 250ms on the Vercel Node runtime. Roles (`LEARNER | INSTRUCTOR | ADMIN`) are minted into the JWT **and re-verified against the database on every privileged route** — the token is a hint, never the authority.

---

## 8. Decision D7 — AI Provider & Orchestration

| Criterion (weight) | Anthropic Claude (`claude-sonnet-5`) | OpenAI GPT | Self-hosted OSS model |
|---|---|---|---|
| K1 (25) | 5 — HTTP only, streams through Vercel | 5 | 1 — **fatal**, GPU host |
| K2 (15) | 5 — typed SDK, tool schemas | 5 | 3 |
| K3 (15) | 5 — server-only key | 5 | 3 |
| K4 (15) | 4 — streaming TTFT, semantic cache in Postgres | 4 | 2 |
| K5 (10) | 5 | 5 | 2 |
| K6 (10) | 4 | 4 | 3 |
| K7 (10) | 5 — provider port is injectable → deterministic tests | 5 | 3 |
| **Weighted total** | **4.75** | 4.75 | 2.20 |

**Resolution: Anthropic Claude (`claude-sonnet-5`)** behind an `LlmProvider` interface; streaming, `temperature 0.2`, server-only key. The tie with OpenAI breaks on PRD §8.1 listing Claude first plus first-class streaming/tool typing.

**Critical architectural rule: AI is never on the correctness path.** Mastery, item selection, path generation, and grading are deterministic engine code. The LLM produces *explanations and Socratic hints only*, every call bounded by a **3.5s timeout → DB-backed rule-based hint ladder** (PRD §7.2, TC-E2E-05). With `ANTHROPIC_API_KEY` unset the app remains fully functional on curated content + deterministic scaffolding — a tested path, not a stub.

---

## 9. Decision D8 — UI Layer

| Criterion (weight) | MUI v6 (Material Design) | Tailwind + shadcn/ui | Chakra | Hand-rolled CSS |
|---|---|---|---|---|
| K1 (25) | 4 — RSC-compatible via `@mui/material-nextjs` | 5 | 4 | 5 |
| K2 (15) | 5 — typed theme + `sx` | 4 | 4 | 2 |
| K3 (15) | 4 | 4 | 4 | 4 |
| K4 (15) | 3 — heavier bundle, mitigated by per-component imports + route code-splitting | 5 | 3 | 5 |
| K5 (10) | 5 | 4 | 4 | 1 |
| K6 (10) | 5 — **mandated Material Design** + accessible primitives (focus rings, dialog focus-trap, ARIA wiring) | 3 — Radix is accessible, but Material must be rebuilt by hand | 4 | 1 |
| K7 (10) | 4 — stable roles/names for Testing Library + Playwright | 4 | 4 | 2 |
| **Weighted total** | 4.15 | **4.35** | 3.85 | 3.30 |

**Resolution: MUI v6 — overriding the raw score.** Tailwind/shadcn leads on weights but **cannot satisfy C3** ("Use Material Design principles") without hand-rebuilding Material; that is a constraint, not a preference, so MUI wins the gate. Light theme only, custom Material palette validated at ≥4.5:1 contrast. The knowledge graph uses `@xyflow/react` (React Flow, per PRD §8.1), lazy-loaded, **with a keyboard-navigable table view of equal status** — the graph is never the only route to a concept (WCAG 2.2 AA).

---

## 10. Decision D9 — Rate Limiting & Hot State

PRD §8.1 specifies Redis + DynamoDB. Serverless functions cannot hold in-process counters.

| Criterion (weight, renormAdaptiqed over K1/K3/K4/K5/K7) | Postgres atomic counters | Upstash Redis | In-memory |
|---|---|---|---|
| K1 (25) | 5 — no new service | 4 — Vercel-native but +1 vendor/secret | 1 — **fatal**, resets per invocation |
| K3 (15) | 5 | 5 | 1 |
| K4 (15) | 3 — one write per guarded request | 5 | 5 |
| K5 (10) | 5 | 4 | 5 |
| K7 (10) | 5 — testable in the same DB | 3 — needs live service or mock | 2 |
| **Weighted total** | **4.55** | 4.29 | 2.03 |

**Resolution: Postgres fixed-window counters** (`rate_limits`, atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING`) behind a `RateLimiter` port, applied to login, registration, AI tutor, and answer submission. Upstash is a one-file swap if traffic justifies it. DynamoDB is dropped — two databases for one dataset is unjustified complexity. **Assumption A-03.**

---

## 11. Decision D10 — Code Sandbox (PRD §8.1 Monaco + execution)

**Resolution: Monaco for authoring/reading; deterministic server-side grading; no arbitrary code execution.** Executing learner-submitted code requires an isolate (Firecracker/gVisor/containers) Vercel does not provide; an `eval`/`vm` implementation is a remote-code-execution vulnerability, disqualified outright under C4. Code-lens assessment ships as **code-completion and output-prediction items graded against stored canonical answers with normAdaptiqed comparison** — real assessment, real grading, no simulated sandbox. Full execution is Phase 2, requiring a dedicated isolate service. **Assumption A-04**, stated plainly in the README rather than faked in the UI.

---

## 11a. Decision D11 — Animation Library

**Directed decision:** the stakeholder mandated GSAP. This section records the evaluation that validates the mandate and, more importantly, the mitigations that make it safe.

| Criterion (weight) | GSAP + `@gsap/react` | Framer Motion | CSS transitions/keyframes | React Spring |
|---|---|---|---|---|
| K1 (25) | 5 — client-only, SSR-safe behind `'use client'`, no build step | 5 | 5 | 5 |
| K2 (15) | 4 — typed API, but selector strings are stringly-typed (mitigated by `useGSAP` scoping) | 5 | 3 | 4 |
| K3 (15) | 5 — no network, no eval | 5 | 5 | 5 |
| K4 (15) | 3 — ~25KB gz core; plugins route-split | 4 | 5 | 4 |
| K5 (10) | 5 — **now fully free including SplitText/DrawSVG/MotionPath**; no licence risk | 5 | 4 | 4 |
| K6 (10) | 4 — `matchMedia` gives one authoritative reduced-motion switch; nothing accessible out of the box | 4 | 5 | 4 |
| K7 (10) | 4 — `globalTimeline` inspection + `timeScale` make end states assertable | 4 | 3 | 3 |
| **Weighted total** | **4.30** | 4.60 | 4.35 | 4.25 |

**Resolution: GSAP, as directed.** Framer Motion scores higher on raw weights (better React ergonomics, smaller surface), but the gap is 0.30 and GSAP wins decisively on the capabilities this product actually needs: `DrawSVGPlugin` for the prerequisite-unlock edge draw, `MotionPathPlugin` for the unlock traveller, and precise timeline sequencing for the diagnostic-convergence and hint-ladder choreography. Framer Motion would require hand-rolling all three.

**Mandatory mitigations** (these are what turn a bundle-size and accessibility risk into an acceptable one):
1. All motion via `useGSAP` with a `scope` ref — auto-revert on unmount, no StrictMode timeline leaks.
2. One `gsap.matchMedia()` reduced-motion switch; durations collapse to 0 with **end states preserved**.
3. `LearnerProfile.motionPreference` persisted in Postgres, resolved server-side — no flash of animated content.
4. Plugins dynamically imported per route; the dashboard never pays for the graph route's plugins.
5. Merge gate: every animation must declare the information it carries (checklist, `DESIGN-MOTION-SYSTEM.md` §9).

**Assumption A-07.**

## 11b. Decision D12 — Knowledge Graph Layout

| Criterion (weight) | Server-computed layered DAG (Sugiyama-lite), persisted | Client force simulation (d3-force) | Cytoscape.js with built-in layouts | Static hand-authored coordinates |
|---|---|---|---|---|
| K1 (25) | 5 — computed once, cached in Postgres | 3 — CPU burn every mount | 4 | 5 |
| K2 (15) | 5 — pure function, exact expected output | 2 — stochastic | 3 | 5 |
| K3 (15) | 5 | 5 | 5 | 5 |
| K4 (15) | 5 — zero client layout cost | 2 — worst case on low-end devices | 3 | 5 |
| K5 (10) | 4 — ~120 lines of ranking + barycentre ordering | 5 | 5 | 1 — unmaintainable past ~20 nodes |
| K6 (10) | 5 — stable positions are a cognitive-accessibility win; ranks give keyboard traversal order | 2 — positions shift between visits | 3 | 5 |
| K7 (10) | 5 — deterministic ⇒ stable screenshots and DOM assertions | 1 — non-deterministic, untestable | 2 | 5 |
| **Weighted total** | **4.90** | 2.85 | 3.60 | 4.40 |

**Resolution: server-computed layered DAG layout, persisted in `ConceptLayout`.** The decisive factor is not performance but **cognition**: a learner builds a mental map of their own knowledge, and a graph that re-tumbles on every visit destroys it. Layout is a pure function of the curriculum — identical for all learners, stable across sessions; only node *state* is personal. React Flow (already selected in D8) provides viewport/pan/zoom over these fixed coordinates with custom node and edge components that GSAP can animate.

---

## 12. Supporting Selections (low contention)

| Concern | Choice | Rationale |
|---|---|---|
| Validation | **Zod** | One schema drives server validation, TS types, and client form errors |
| Forms | **react-hook-form + zodResolver** | Accessible error wiring, minimal re-renders |
| Server state | **TanStack Query** | Dedupe, cache, background refetch — removes redundant fetches (Brief §3) |
| Unit/integration | **Vitest** | Native ESM/TS, fast, same transform pipeline as Next |
| E2E + a11y | **Playwright + @axe-core/playwright** | Real browser journeys, automated WCAG scan per key screen |
| Component tests | **React Testing Library** | Role-based queries enforce accessible markup by construction |
| Lint/format | **ESLint (typescript-eslint strict) + Prettier** | Brief §1 |
| CI | **GitHub Actions** | lint → typecheck → unit → migrate on ephemeral Neon branch → integration → build → E2E → axe |
| Logging | **pino** structured JSON with redaction | Vercel log drains; no PII/secret leakage |
| Headers/CSP | `next.config.ts` headers + middleware | HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |

---

## 13. Resolved Stack

```
Next.js 15 (App Router, TypeScript strict)
  ├─ UI          MUI v6 (Material Design, light theme) + React Flow + Monaco (author/read only)
  ├─ Data fetch  TanStack Query + Zod-typed API contracts
  ├─ API         Route Handlers (Node runtime): validation → authz → service → repository
  ├─ Auth        Auth.js v5 (Credentials, JWT) + bcryptjs + DB-verified RBAC
  ├─ Engine      TypeScript: IRT/CAT · BKT · Ebbinghaus decay · DAG pathing · recommender
  ├─ AI          Anthropic claude-sonnet-5 (explanations + Socratic hints only) + timeout + DB fallback
  ├─ Data        Prisma 6 → Neon Serverless PostgreSQL (pooled runtime URL, direct migration URL)
  └─ Deploy      Vercel (single project) · GitHub Actions CI · Neon branch per preview
```

---

## 14. Assumptions Register (requires sign-off)

| ID | Assumption | Driven by | Reversal cost |
|---|---|---|---|
| A-01 | No FastAPI/LangGraph service; orchestration is a typed TS state machine inside Next.js | C1 | Low — service layer is transport-agnostic |
| A-02 | Knowledge tracing is BKT + IRT + decay, not DKT Bi-LSTM | C1, C6 | Low — `KnowledgeTracer` port |
| A-03 | Single datastore (Postgres); no Redis/DynamoDB at MVP | C1, simplicity | Low — `RateLimiter`/`Cache` ports |
| A-04 | No arbitrary learner-code execution; code items graded deterministically | C4 (RCE risk) | High — needs isolate service |
| A-05 | Seed corpus is a curated ~50-node Computer Science & AI graph (PRD §10 Phase 1) authored into seed scripts — real DB rows, not runtime fixtures | PRD §10 | Low |
| A-06 | Instructor cohort analytics (FR-6.2) built on real aggregate SQL; peer matching + RLHF (Phase 3) out of scope | PRD §10 | n/a |
| A-07 | GSAP is the motion layer, admitted under a strict "motion must carry information" merge gate + reduced-motion switch + persisted learner override | Stakeholder direction | Medium — motion is isolated in `src/ui/motion` |

## 15. Fatal-Flaw Rejections (recorded)

| Rejected | Reason |
|---|---|
| SPA + Express on a container host | Cannot satisfy C1 as a single Vercel deploy |
| DKT Bi-LSTM at MVP | Requires GPU host + training data that does not exist pre-launch |
| In-memory rate limiting | Semantically broken in serverless |
| `eval`-based code sandbox | Remote code execution |
| LLM-computed mastery scores | Non-deterministic, untestable, prompt-injectable |
| localStorage / JSON "database" | Explicitly prohibited (C2) |
