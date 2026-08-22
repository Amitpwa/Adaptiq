# Adaptiq — System Architecture

**Source of truth:** `adaptive_learning_intelligence_system_prd.md` (ALIS PRD v1.0.0)
**Stack rationale:** [`DAR-TECH-STACK.md`](DAR-TECH-STACK.md)
**Visual/motion/knowledge-graph spec:** [`DESIGN-MOTION-SYSTEM.md`](DESIGN-MOTION-SYSTEM.md)
**Status:** Proposed — awaiting sign-off before implementation

---

## 1. Architectural Principles

1. **One deployable.** UI, API, adaptive engine, and AI orchestration ship as a single Next.js app on Vercel. No second host.
2. **Determinism at the core, AI at the edges.** Every number a learner sees (mastery, θ, score, next step) is computed by tested, deterministic TypeScript over database rows. The LLM only *phrases* things — explanations and Socratic hints — and always has a database-backed fallback.
3. **The database is the only state.** No in-memory caches that outlive a request, no client-side source of truth.
4. **Server is the security boundary.** Client validation is UX; server validation + authorization is enforcement. Every resource access is scoped by `userId` derived from the session, never from the request body.
5. **Incremental knowledge updates.** A learner's knowledge state is updated per-interaction in O(1); decay is applied lazily at read time. Nothing recomputes a learner's full history.
6. **Accessible by construction.** Semantic HTML and MUI primitives; every graph has a table equivalent; no colour-only signalling.

---

## 2. Layered Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│ PRESENTATION  app/(learner)/…  app/(instructor)/…  app/(auth)/…        │
│ React Server Components for reads · Client Components for interaction  │
│ MUI v6 light theme · React Flow graph + accessible table twin          │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ typed fetch (TanStack Query) / server actions
┌──────────────────────────────▼────────────────────────────────────────┐
│ API  app/api/**/route.ts                                              │
│ withApi(): rate limit → session → Zod parse → RBAC → handler → shape  │
└──────────────────────────────┬────────────────────────────────────────┘
┌──────────────────────────────▼────────────────────────────────────────┐
│ SERVICES  src/services/                                               │
│ onboarding · diagnostic · learning · assessment · tutor · progress ·   │
│ cohort  — transaction boundaries live here                            │
└───────┬───────────────────────────┬───────────────────────┬───────────┘
        │                           │                       │
┌───────▼──────────┐   ┌────────────▼─────────────┐  ┌──────▼──────────┐
│ ADAPTIVE ENGINE  │   │ AI LAYER src/ai/         │  │ REPOSITORIES    │
│ src/engine/      │   │ LlmProvider port         │  │ src/repositories│
│ irt · cat · bkt  │   │ socratic-tutor           │  │ Prisma + typed  │
│ decay · graph    │   │ explanation-synthesizer  │  │ raw CTEs        │
│ path · recommend │   │ guardrails · fallback    │  └──────┬──────────┘
│ (pure functions) │   │ cache (Postgres)         │         │
└──────────────────┘   └──────────────────────────┘         │
                                                   ┌────────▼─────────┐
                                                   │ Neon PostgreSQL  │
                                                   └──────────────────┘
```

**Dependency rule:** presentation → API → services → (engine | ai | repositories) → database. Nothing points back up. `src/engine/**` is pure: no I/O, no Prisma import, fully unit-testable.

---

## 3. Project Structure

```
adaptiq/
├─ app/
│  ├─ (auth)/login/ register/
│  ├─ (learner)/
│  │   onboarding/          goals → preferences → diagnostic
│  │   dashboard/           knowledge map, next action, progress
│  │   path/[goalSlug]/     topological learning path
│  │   learn/[conceptSlug]/ multi-lens content + micro-assessment + tutor
│  │   review/              due spaced-retrieval probes
│  │   profile/
│  ├─ (instructor)/cohorts/[id]/
│  ├─ api/
│  │   auth/[...nextauth]/  register/
│  │   onboarding/  goals/  diagnostic/  concepts/  content/
│  │   assessments/  answers/  tutor/  knowledge-state/
│  │   recommendations/  path/  review/  progress/  cohorts/  health/
│  ├─ layout.tsx  error.tsx  not-found.tsx  global-error.tsx
├─ src/
│  ├─ engine/      irt.ts cat.ts bkt.ts decay.ts graph.ts path.ts recommender.ts layout.ts types.ts
│  ├─ services/
│  ├─ repositories/
│  ├─ ai/          provider.ts anthropic.ts prompts/ guardrails.ts fallback.ts cache.ts
│  ├─ auth/        config.ts rbac.ts password.ts
│  ├─ validation/  Zod schemas, shared client/server
│  ├─ lib/         db.ts api-handler.ts errors.ts logger.ts rate-limit.ts env.ts
│  └─ ui/          theme.ts components/ (MasteryChip, ConceptCard, EmptyState, …)
│                  motion/ (MotionProvider, tokens, useGSAP hooks)
│                  graphics/ (Halftone, GridBackground, MasteryRing)
│                  graph/ (KnowledgeGraph, ConceptNode, PrerequisiteEdge, KnowledgeTable)
├─ prisma/         schema.prisma  migrations/  seed/
├─ tests/          unit/ integration/ api/ e2e/ a11y/ fixtures/
└─ docs/
```

---

## 4. Data Model

### 4.1 Entities

**Identity & profile**
- `User` — id, email (unique, citext), passwordHash, name, role `LEARNER|INSTRUCTOR|ADMIN`, timestamps
- `LearnerProfile` — 1:1 User; cognitivePreference `ANALOGY|FIRST_PRINCIPLES|CODE|VISUAL`, motionPreference `SYSTEM|FULL|REDUCED`, onboardingStage, activeGoalId, frustrationScore, timestamps

**Domain / knowledge graph**
- `Domain` — slug, title
- `Concept` — domainId, slug, title, summary, IRT params (`difficultyB`, `discriminationA`, `guessC`), estimatedMinutes; unique(domainId, slug)
- `ConceptEdge` — prerequisiteId → conceptId, strength; PK(prerequisiteId, conceptId); DAG enforced in a seed-time + write-time cycle check
- `Goal` — domainId, slug, title, description
- `GoalConcept` — goalId, conceptId, weight; PK(goalId, conceptId)
- `ConceptLayout` — goalId, conceptId, rank, order, x, y; unique(goalId, conceptId) — deterministic server-computed DAG layout so the learner's knowledge map is stable across sessions
- `ContentLens` — conceptId, lens enum, body (markdown), citation, level; unique(conceptId, lens, level) — the curated corpus
- `Misconception` — conceptId, code, label, description, remediationHint

**Assessment**
- `Question` — conceptId, type `MCQ|MULTI|SHORT|CODE_COMPLETION|OUTPUT_PREDICTION`, stem, canonicalAnswer, explanation, IRT params, misconceptionId?
- `QuestionOption` — questionId, label, isCorrect, misconceptionId?
- `QuestionHint` — questionId, level 1–4, body — **the deterministic Socratic ladder used when AI is unavailable**
- `AssessmentSession` — userId, type `DIAGNOSTIC|PRACTICE|PROBE|BRIDGE`, goalId?, conceptId?, status, theta, standardError, startedAt, completedAt
- `AssessmentItem` — sessionId, questionId, position, servedAt, answeredAt, responseJson, isCorrect, latencyMs, thetaAtServe; unique(sessionId, position)

**Knowledge state**
- `KnowledgeState` — unique(userId, conceptId); pMastery, stabilityDays, attempts, correct, lastInteractionAt, status `GAP|IN_PROGRESS|FRAGILE|MASTERED`
- `KnowledgeStateEvent` — append-only audit: userId, conceptId, prior, posterior, evidenceType, evidenceId, createdAt → powers progress charts and "why did this change?"
- `LearnerMisconception` — unique(userId, misconceptionId); occurrences, lastSeenAt, resolvedAt
- `ReviewSchedule` — unique(userId, conceptId); dueAt, intervalDays, stability

**Path & recommendation**
- `LearningPath` — userId, goalId, version, status, generatedAt
- `LearningPathNode` — pathId, conceptId, position, status `LOCKED|READY|IN_PROGRESS|MASTERED|GAP`, rationale; unique(pathId, conceptId)
- `Recommendation` — userId, conceptId, kind `NEXT_CONCEPT|PREREQ_BRIDGE|REVIEW_PROBE|MISCONCEPTION_DRILL`, score, rationale, createdAt, consumedAt

**Tutor & telemetry**
- `TutorSession` — userId, conceptId, questionId?, hintLevel, status
- `TutorMessage` — tutorSessionId, role, content, hintLevel, source `AI|FALLBACK`, createdAt
- `AiGeneration` — semantic cache: userId?, conceptId, lens, promptHash (unique with model), model, content, tokensIn/Out, latencyMs
- `ActivityEvent` — userId, type, payloadJson, createdAt
- `Cohort`, `CohortMember` — instructor scoping
- `RateLimit` — key, windowStart, count; PK(key, windowStart)
- `AuditLog` — actorId, action, targetType, targetId, metadata

### 4.2 Constraints & Indexes

| Purpose | Definition |
|---|---|
| Tenant isolation | Every learner-owned table carries `userId` with `ON DELETE CASCADE` |
| Prevent duplicate state | `unique(userId, conceptId)` on `KnowledgeState`, `ReviewSchedule` |
| Dashboard reads | `idx_ks_user_status (userId, status)`, `idx_ks_user_mastery (userId, pMastery)` |
| Due-review query | `idx_review_user_due (userId, dueAt)` |
| Graph traversal | `idx_edge_concept (conceptId)`, `idx_edge_prereq (prerequisiteId)` |
| Session replay | `idx_item_session_pos (sessionId, position)` |
| Recommendation feed | partial index `idx_rec_user_open (userId, score DESC) WHERE consumedAt IS NULL` |
| Progress timeline | `idx_kse_user_created (userId, createdAt DESC)` |
| Cohort aggregation | `idx_cm_cohort (cohortId)` |
| Value ranges | CHECK `pMastery BETWEEN 0 AND 1`, CHECK `hint level BETWEEN 1 AND 4` |

**Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` in CI/Vercel build; seeds are idempotent upserts so the demo database can be rebuilt reproducibly.

---

## 5. Adaptive Learning Engine

All functions below are pure, live in `src/engine/`, and are unit-tested against hand-computed expected values.

### 5.1 Item Response Theory (2PL/3PL) — `irt.ts`
```
P(correct | θ) = c + (1 − c) / (1 + exp(−a(θ − b)))
Fisher information I(θ) = a²(P − c)²(1 − P) / (P(1 − c)²)
```
θ is estimated by **Expected A Posteriori** over a fixed 61-point grid on [−3, 3] with a N(0,1) prior — no numeric solver, no iteration risk, fully deterministic.

### 5.2 Computerised Adaptive Testing — `cat.ts` (FR-1.1)
Serve the unadministered item maximising `I(θ̂)`, constrained to the current concept frontier. **Stop** when `SE(θ̂) < 0.35` or 7 items served (PRD: 5–7). On failure of a concept item, the next item is drawn from its **direct prerequisites** — this is what "localises the exact boundary of competence".

### 5.3 Bayesian Knowledge Tracing — `bkt.ts` (FR-2.1)
Per response, with per-concept parameters (`pInit`, `pTransit`, `pSlip`, `pGuess`):
```
correct:   P(L|obs) = P(L)(1−slip) / [P(L)(1−slip) + (1−P(L))guess]
incorrect: P(L|obs) = P(L)slip     / [P(L)slip     + (1−P(L))(1−guess)]
posterior: P(L') = P(L|obs) + (1 − P(L|obs)) · pTransit
```
O(1) per interaction. Diagnostic θ seeds `pInit` via the IRT curve, so the diagnostic genuinely warm-starts the tracer.

### 5.4 Decay & Spaced Retrieval — `decay.ts` (FR-2.2)
```
R(t) = exp(−Δdays / S)          effective mastery = pMastery · R(t)
```
Applied **lazily at read time** — no cron sweeping every learner. Stability `S` grows on successful recall (SM-2-flavoured: `S ← S · (1.3 + 0.6·correctStreak)`) and contracts on failure. `R(t) < 0.70` ⇒ a `REVIEW_PROBE` recommendation is materialised and `ReviewSchedule.dueAt` set.

**Status bands** (drive the graph colours *and* text labels, never colour alone):

| Status | Rule | UI |
|---|---|---|
| MASTERED | effective ≥ 0.85 | green + ✓ + "Mastered" |
| FRAGILE | 0.60 ≤ effective < 0.85, or R(t) < 0.70 | amber + ⚠ + "Needs review" |
| IN_PROGRESS | 0.30 ≤ effective < 0.60 | blue + ◐ + "In progress" |
| GAP | effective < 0.30 with ≥1 attempt, or blocking prerequisite unmet | red + ! + "Gap" |
| NOT_STARTED | no attempts | grey + "Not started" |

### 5.5 Graph & Path — `graph.ts`, `path.ts` (FR-1.2)
Goal → concept closure via recursive CTE over `ConceptEdge`; Kahn topological sort; prune nodes already MASTERED; a node is `READY` when every prerequisite's effective mastery ≥ 0.70, otherwise `LOCKED`. Recomputed on goal change or knowledge-state transitions that cross a threshold — not on every request.

### 5.6 Recommender — `recommender.ts`
```
score = w1·goalWeight + w2·readiness + w3·gapSeverity + w4·decayUrgency + w5·misconceptionPressure
```
Weights are named constants in `src/engine/constants.ts` (no magic numbers). Every recommendation persists a human-readable `rationale` — the learner always sees *why* this is next, satisfying the "Where am I / what next" UX requirement.

### 5.7 Dynamic Difficulty — (FR-4.2)
Next practice item targets `b ≈ θ̂ + ln(p/(1−p))/a` with `p = 0.70`, holding the observed failure rate in the 25–35% ZPD band.

### 5.8 The Chain, Made Visible
```
Learner → Diagnostic (CAT/IRT) → θ per concept → KnowledgeState (BKT)
   → Gaps (status + unmet prerequisites) → LearningPath (topological, pruned)
   → Multi-lens content (curated + AI-personalised) → Micro-assessment
   → Socratic scaffolding on failure → KnowledgeStateEvent (audited update)
   → Recommendation (with rationale) → next activity
```
Every arrow is a database write and an API call, and each is covered by an E2E test.

---

## 6. AI Integration

| Layer | Responsibility | Deterministic? |
|---|---|---|
| Business rules | thresholds, unlocking, scoring | ✅ code |
| Learner state | IRT, BKT, decay | ✅ code |
| Grading | canonical answer comparison, option matching, misconception tagging | ✅ code |
| Item selection | Fisher information, DDA | ✅ code |
| Explanations | multi-lens rendering personalised to preference + mastery (FR-3.1/3.2) | LLM, curated fallback |
| Socratic hints | 4-tier ladder (FR-5.2) | LLM, `QuestionHint` fallback |

**Guardrails (FR-5.1, PRD §8.2, §11):**
- Prompt-injection scrub on all learner text before it reaches the model; the system prompt is never learner-controlled.
- **Answer-leakage check** on model output vs. `Question.canonicalAnswer` (normalised token overlap + pattern match); a leaking response is discarded and the fallback hint served.
- Hint level may only increase by one per learner request, capped at 4 — no "just tell me" escalation.
- 3.5s timeout → `FALLBACK` source recorded on the message, so the transcript shows honestly which hints came from AI (TC-E2E-05).
- Responses cached in `AiGeneration` keyed by `hash(conceptId, lens, masteryBand, preference, model)` — repeat views cost nothing.
- Server-only: `ANTHROPIC_API_KEY` is read in `src/lib/env.ts` (server module), never referenced under `NEXT_PUBLIC_`.

---

## 7. Authentication & Authorization

- Auth.js v5, Credentials provider, JWT session in an httpOnly/SameSite=Lax/Secure cookie; CSRF token on the built-in POST routes.
- Registration: Zod-validated email + password policy (min 12 chars, checked against a common-password list), `bcryptjs` cost 12, uniform "invalid credentials" response and a constant-time-ish path to avoid user enumeration.
- `middleware.ts` guards `(learner)`/`(instructor)` route groups; **every API handler independently re-checks** the session — middleware is defence in depth, not the control.
- RBAC in `src/auth/rbac.ts`: `LEARNER` (own data only), `INSTRUCTOR` (own cohorts' aggregates; no raw answer transcripts), `ADMIN` (content authoring).
- **IDOR defence:** repositories take `userId` from the session and include it in the `WHERE` clause — a learner cannot read another learner's session by guessing an id. Covered by explicit negative API tests.
- **Mass assignment defence:** every write goes through a Zod schema with `.strict()`; role, mastery, and score fields are not client-writable.

---

## 8. API Surface

Envelope: success `{ data, meta? }`; failure `{ error: { code, message, details? } }`. Codes: 200/201/204, 400 validation, 401 unauthenticated, 403 forbidden, 404, 409 conflict, 422 domain rule, 429 rate-limited, 500.

| Method & path | Purpose | Auth | Notes |
|---|---|---|---|
| `POST /api/auth/register` | Create learner | public | rate-limited 5/15min/IP |
| `POST /api/auth/[...nextauth]` | Login/logout/session | public | Auth.js |
| `GET /api/goals` | Available goals | learner | cached, paginated |
| `POST /api/onboarding/goal` | Select goal | learner | starts path generation |
| `PATCH /api/onboarding/preferences` | Cognitive lens preference | learner | FR-1.3 |
| `POST /api/diagnostic/sessions` | Start CAT diagnostic | learner | returns first item |
| `GET /api/diagnostic/sessions/:id/next` | Next adaptive item | learner, owner | Fisher-max selection |
| `POST /api/diagnostic/sessions/:id/answers` | Submit answer | learner, owner | θ update, transactional |
| `POST /api/diagnostic/sessions/:id/complete` | Finalise | learner, owner | seeds KnowledgeState + path |
| `GET /api/path/:goalSlug` | Learning path with node statuses | learner | |
| `GET /api/concepts/:slug` | Concept + prerequisites + own state | learner | |
| `GET /api/content/:conceptSlug?lens=` | Multi-lens explanation | learner | curated → AI → cache |
| `POST /api/assessments` | Start practice/probe/bridge session | learner | DDA item selection |
| `POST /api/assessments/:id/answers` | Submit + grade + update state | learner, owner | **transaction**: item → BKT → event → review → recommendation |
| `POST /api/tutor/sessions` | Open Socratic session | learner | |
| `POST /api/tutor/sessions/:id/messages` | Request next hint (streamed) | learner, owner | guardrails + fallback, rate-limited |
| `GET /api/knowledge-state` | Mastery list (paginated/filtered) | learner | decay applied at read |
| `GET /api/knowledge-state/graph?goal=` | Knowledge graph: nodes + edges + layout + learner state | learner | one query pair, no N+1 |
| `PATCH /api/profile/preferences` | Cognitive lens + motion preference | learner | `.strict()` Zod |
| `GET /api/recommendations` | Ranked next actions with rationale | learner | |
| `POST /api/recommendations/:id/consume` | Mark acted upon | learner, owner | |
| `GET /api/review/due` | Due spaced-retrieval probes | learner | |
| `GET /api/progress` | Timeline, velocity, mastery counts | learner | aggregate SQL |
| `GET /api/cohorts/:id/analytics` | Cohort heatmap + top bottlenecks | instructor, member-of | aggregate only |
| `GET /api/health` | DB + AI reachability | public | no secrets echoed |

Every handler: rate limit → session → `schema.parse` → authorization → service → typed response → structured log. Cross-cutting logic lives in `withApi()` so no route re-implements it.

---

## 9. UX Architecture

**Journeys:** register → onboarding (goal → preference → diagnostic) → dashboard → path → learn (multi-lens + micro-assessment + tutor) → updated state → recommendation → next concept; plus review sessions, progress review, instructor cohort view.

**Navigation:** persistent app bar + responsive nav rail/bottom nav — Dashboard · Path · Review · Progress · Profile. A single primary CTA ("Continue: *concept*") is present on every learner screen, so "what next" is never ambiguous.

**Screen answers to the six learner questions:** breadcrumb + path position (*where am I*), concept header + goal chip (*what*), recommendation rationale (*why*), mastery meter with numeric + textual value (*how am I doing*), gap list (*what to improve*), primary CTA (*what next*).

**Knowledge graph:** the learner's primary metacognitive surface — an interactive DAG where halftone dot density encodes mastery, a ring encodes retrievability, and edges show prerequisite flow. Six purposeful GSAP animations (topological entrance, mastery bloom, prerequisite unlock flow, route-back traversal, decay drift, focus lens) each carry information; an equal-status keyboard-navigable **Knowledge Table** renders the same payload. Full spec: [`DESIGN-MOTION-SYSTEM.md`](DESIGN-MOTION-SYSTEM.md).

**States:** every data surface implements loading (MUI skeletons), empty (explanatory + action), error (retry + support code), and success. No spinner-only screens.

**Accessibility (WCAG 2.2 AA):** semantic landmarks and one `h1` per page; skip link; visible focus rings (never removed); labelled inputs with `aria-describedby` errors and `role="alert"` summaries; focus-trapped MUI dialogs returning focus on close; graph nodes reachable by keyboard **and** duplicated as a sortable table; status conveyed by icon + text + colour; `prefers-reduced-motion` respected; contrast ≥4.5:1 verified; live regions announce mastery changes and streamed hints.

---

## 10. Performance

- RSC for read-heavy pages; client bundles limited to interactive islands; React Flow and Monaco dynamically imported.
- TanStack Query dedupes and caches; no polling.
- Pagination/cursoring on every list; the client never receives an unbounded set.
- Aggregates computed in SQL (`GROUP BY`, window functions), not in JS.
- Knowledge updates are O(1); decay is a read-time multiplication.
- AI responses cached by prompt hash; streaming keeps TTFT low.
- Prisma singleton across invocations + Neon pooled URL to survive serverless fan-out.
- Debounced free-text inputs; `Cache-Control` on static content endpoints.

---

## 11. Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `engine/*` against hand-computed IRT/BKT/decay values, topological ordering, recommender ranking, guardrail leak detection, password policy |
| Integration | Vitest + **real Postgres** | repositories, transactional answer submission, cascade deletes, unique-constraint violations, decay-at-read correctness |
| API | Vitest, route handlers invoked directly | happy path, 400 invalid, 401 anonymous, **403 cross-user IDOR**, 409, 429 rate limit, mass-assignment rejection |
| E2E | Playwright | all 14 critical workflows + PRD TC-E2E-01…05 (cold start, misconception remediation, prerequisite route-back, decay probe injection, AI-timeout fallback with the key disabled) |
| A11y | axe-core via Playwright | zero serious/critical violations on login, onboarding, dashboard, **knowledge graph + table**, learn, assessment, tutor, progress, cohort |
| Motion | Playwright (motion-on project) | end states after `timeScale(50)`, reduced-motion contract (nothing stuck at `opacity: 0`), GSAP timeline leak check across 20 mount/unmount cycles |

CI gate: lint → typecheck → unit → migrate (ephemeral Neon branch) → integration → API → build → E2E → axe. A red gate blocks merge.

---

## 12. Deployment

Single Vercel project, Node runtime for API routes (Prisma + bcrypt need it).

| Variable | Scope | Notes |
|---|---|---|
| `DATABASE_URL` | server | Neon **pooled** |
| `DIRECT_URL` | server | Neon direct, migrations only |
| `AUTH_SECRET` | server | 32-byte random |
| `AUTH_URL` | server | deployment URL |
| `ANTHROPIC_API_KEY` | server | optional — absence degrades to deterministic mode |
| `AI_TIMEOUT_MS` | server | default 3500 |
| `NEXT_PUBLIC_APP_NAME` | client | non-secret only |

Build: `prisma generate && prisma migrate deploy && next build`. Preview deployments bind to a Neon branch. Security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options) set in `next.config.ts`. `/api/health` for uptime checks.

---

## 13. Implementation Order

1. Scaffold, strict TS, lint/format, env validation, CI skeleton
2. Prisma schema + migrations + seed (50-node CS/AI graph, questions, hints, misconceptions)
3. Auth + RBAC + rate limiting + `withApi` + error taxonomy
4. Engine (`irt`, `bkt`, `decay`, `graph`, `path`, `recommender`) **with unit tests written alongside**
5. Diagnostic API + assessment/answer transaction + knowledge-state service
6. Path + recommendation services
7. Theme/design system + halftone/grid graphics + `MotionProvider` + motion tokens
8. Onboarding → diagnostic → dashboard → path → learn → assessment (end-to-end, real data)
9. **Knowledge graph + table twin** (layout engine, graph API, GSAP animations A1–A6)
10. AI layer: explanations, Socratic ladder, guardrails, fallback, cache
11. Review/spaced retrieval + progress + instructor cohort analytics
12. Accessibility pass + axe automation + reduced-motion verification
12. Full test suite completion, performance pass, security review, Vercel deploy, E2E verification against the deployment

---

## 14. Open Risks

| Risk | Mitigation |
|---|---|
| Neon cold start inflates first request | Pooled URL, health-check warm path, documented in the demo runbook |
| LLM latency exceeds Vercel function budget | 3.5s timeout, streaming, deterministic fallback (tested path) |
| Seed corpus quality gates perceived product quality | Author 50 concepts with reviewed content, ≥4 questions and a 4-level hint ladder each |
| Prisma bundle cold start | Route-level code splitting; engine stays pure and dependency-free |
| Cohort aggregates scanning large event tables | Covering indexes; pre-aggregation only if measured need appears |
