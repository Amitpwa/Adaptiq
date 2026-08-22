# Adaptiq

**An adaptive learning intelligence system that models what you actually know — and teaches you accordingly.**

Adaptiq is the implementation of the [NextGen Adaptive Learning Intelligence System PRD](adaptive_learning_intelligence_system_prd.md). It continuously estimates a learner's knowledge state across a concept graph, finds the exact boundary of what they have and haven't mastered, generates a personalised path to their goal, and tutors Socratically — without ever handing over the answer.

> **Project status:** architecture approved for implementation, application build in progress. This README documents the product as specified and the system as designed. Sections marked _(Phase 2/3)_ are explicitly out of MVP scope — nothing described as shipped is mocked.

---

## The problem

Traditional courses are designed for everyone and optimised for no one. Learners arrive with different prior knowledge, move at different speeds, carry different misconceptions, and understand concepts through different mental representations.

Four failures follow (PRD §2.1):

1. **Static linear curricula** — strong learners are bored, struggling learners accumulate unaddressed prerequisite debt until later topics become impossible.
2. **Coarse-grained assessment** — right/wrong scoring records the outcome and discards the cause: a slip and a deep misconception look identical.
3. **Passive consumption** — watching and reading produce the illusion of competence without retrieval practice.
4. **Delayed feedback** — help that arrives hours later misses the moment when it would have mattered.

## What Adaptiq does about it

```
Learner
  → Goal selection + cognitive preference
  → Adaptive diagnostic (5–7 items, CAT/IRT)
  → Knowledge state per concept (Bayesian tracing)
  → Gaps + unmet prerequisites identified
  → Personalised topological learning path
  → Multi-lens explanation, calibrated to current mastery
  → In-flow micro-assessment
  → Socratic scaffolding on failure (4 tiers, never the answer)
  → Knowledge state updated (audited, per interaction)
  → Ranked recommendation, with the reason shown
  → Next learning activity
```

Every arrow in that loop is a real API call writing to real Postgres tables. The chain is the product; the screens exist to serve it.

---

## Core capabilities

### 1. Cold-start diagnostic that finds the boundary, not the score
A Computerised Adaptive Test picks each next question to maximise information about the learner's ability (Fisher information under a 2PL Item Response Theory model), stopping when the standard error drops below threshold or after 7 items. **Failing a concept immediately routes the next question to its prerequisites** — so the system localises exactly where competence ends instead of reporting an average. _(PRD FR-1.1)_

### 2. A knowledge state that evolves and forgets
Each concept carries a mastery probability updated per interaction by Bayesian Knowledge Tracing — an O(1) update, never a recomputation of history. Mastery then decays on an Ebbinghaus curve `R(t) = e^(−t/S)` with a per-learner stability term, applied at read time. When retrievability falls below 0.70, Adaptiq schedules an interleaved micro-probe rather than waiting for the learner to discover the gap in an exam. _(FR-2.1, FR-2.2)_

### 3. Misconception cataloguing
Wrong answers are attributable: distractors are tagged to named misconceptions, recurrences are counted against the learner profile, and repeated patterns trigger targeted disambiguation drills. _(FR-2.3)_

### 4. Multi-lens explanations
Every concept can be rendered through four lenses — intuitive analogy, first-principles formulation, code, and visual/diagrammatic — selected by stated preference and adjusted for current mastery. Curated content is grounded in the database; AI personalisation layers on top and is cached. _(FR-3.1, FR-3.2)_

### 5. Socratic tutoring with real guardrails
A four-tier hint ladder — clarifying question → conceptual reminder → isomorphic example → worked walkthrough plus a fresh challenge. Answer-leakage checks run against the stored canonical answer before anything reaches the learner, learner text is scrubbed for prompt injection, and hint level can only advance one step per request. _(FR-5.1, FR-5.2, PRD §8.2)_

### 6. Graceful degradation, by design
If the AI provider is slow (>3.5s), rate-limited, or entirely unconfigured, Adaptiq falls back to database-backed deterministic hints and curated content. The session does not break, and the transcript honestly labels which hints came from the model. **The application is fully functional with no AI key present.** _(PRD §7.2, TC-E2E-05)_

### 7. A knowledge graph you can actually read
The learner's metacognitive centrepiece: an interactive map of the concepts behind their goal, showing what they know, what is fading, what is blocked, and why.

- **Mastery is drawn as halftone dot density**, not just colour — sparse dots for a gap, near-solid for mastery. It reads correctly in greyscale, at low contrast, and with any form of colour blindness.
- **A ring around each node drains as memory decays**, so fading knowledge is visible before it's lost.
- **Prerequisite edges animate when they unlock** — the edge draws in, a pulse travels along it, and the downstream concept wakes up. The core adaptive mechanic, made literal.
- **When the system routes you back to a missing prerequisite, the view travels there** along the highlighted edge, so the reasoning is legible rather than mysterious.
- **Layout is deterministic and server-computed**, identical for every learner and stable across sessions — the map you memorise stays put; only your state changes.
- **Everything has an equal-status Knowledge Table twin**: sortable, filterable, fully keyboard-navigable. The graph is never the only way in.

_(FR-6.1 — full spec in [docs/DESIGN-MOTION-SYSTEM.md](docs/DESIGN-MOTION-SYSTEM.md))_

### 8. Motion that carries information
GSAP micro-animations throughout — icon transitions, button feedback, mastery counters, the Socratic hint ladder climbing rung by rung, the diagnostic's confidence band visibly narrowing as the system converges on your ability. The rule is strict: **every animation must encode something the learner needs to know**, must have a static equivalent, and must respect reduced motion (with a learner-level override stored in the database, since the OS setting isn't available to everyone). Playful, not noisy.

The visual ground is engineering graph paper and halftone fields — the surface a learner would work a problem out on, and a texture that matches a product about probabilistic, partial knowledge.

### 9. Instructor cohort view
Aggregated mastery heatmaps and the top class-wide conceptual bottlenecks, computed from live learner data. _(FR-6.2)_

---

## Personas served (PRD §4)

| Persona | Need | How Adaptiq meets it |
|---|---|---|
| **Priya** — mid-career pivot into ML | Skip what she knows, bridge hidden maths gaps | Diagnostic prunes mastered nodes from the path; prerequisite interception routes back to the missing foundation |
| **Marcus** — undergrad, illusion of understanding | Active retrieval and immediate, specific feedback | In-flow micro-probes every few minutes; Socratic hints that name the exact logical misstep |
| **Elena** — L&D lead, 120 engineers | See systemic failure before end of quarter | Cohort heatmap and ranked conceptual bottlenecks from live learner data |

---

## Architecture at a glance

```
Next.js 15 (App Router, TypeScript strict) — one Vercel deployment
  ├─ UI        MUI v6 (Material Design, light theme) · React Flow knowledge map · GSAP motion layer
  ├─ API       Route Handlers: rate limit → session → Zod → RBAC → service
  ├─ Auth      Auth.js v5 (credentials, JWT) · bcrypt hashing · DB-verified roles
  ├─ Engine    Pure TypeScript: IRT/CAT · BKT · decay · DAG pathing · recommender
  ├─ AI        Claude (explanations + Socratic hints only) · guardrails · timeout · fallback
  └─ Data      Prisma 6 → Neon Serverless PostgreSQL
```

**The load-bearing decision:** the adaptive engine is deterministic code, not a language model. Mastery, item selection, grading, unlocking, and path generation are computed by unit-tested pure functions. The LLM writes explanations and hints. That is what makes the system testable, explainable to the learner, and honest about what it knows.

Full rationale, alternatives, and scoring: **[docs/DAR-TECH-STACK.md](docs/DAR-TECH-STACK.md)**
System design, data model, API surface, and test plan: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## Success metrics (PRD §3)

North star: **Mastery Velocity Index** — time to verified 85% mastery of a target competency graph, against a standard baseline.

| Metric | Baseline | Target |
|---|---|---|
| Time-to-mastery | 100% | −35% (MVP) |
| 30-day concept recall | ~28% | ≥68% |
| Module completion | 8–12% | ≥48% |
| Items answered in the 60–80% accuracy band (ZPD fit) | n/a | ≥85% |
| Problems solved unassisted after ≤2 hints | n/a | ≥75% |

These are measured from `KnowledgeStateEvent`, `AssessmentItem`, and `TutorMessage` records — the instrumentation is part of the schema, not an afterthought.

---

## Engineering standards

- **Real data only.** Every displayed value traces to a database row or a computation over one. No hardcoded metrics, no static "recommendations", no fixture users.
- **Security.** Server-side authorization on every route; ownership enforced in the query, not the UI; strict Zod schemas block mass assignment; rate limiting on auth and AI endpoints; secrets server-only; parameterised SQL throughout.
- **Accessibility.** WCAG 2.2 AA target: semantic HTML, full keyboard operation, visible focus, labelled fields, accessible error messaging, no colour-only status, reduced-motion support, automated axe checks in CI.
- **Testing.** Unit tests on the engine against hand-computed values; integration tests against real Postgres; API tests including cross-user access denial; Playwright E2E across all critical journeys plus the PRD's five holistic verification scenarios.
- **Performance.** O(1) knowledge updates, lazy decay, SQL-side aggregation, paginated reads, cached AI generations, code-split heavy client components.

---

## Scope boundaries (stated, not hidden)

| PRD element | MVP status | Why |
|---|---|---|
| DKT with Bi-LSTM/Transformer | Deferred to Phase 2 | Requires a GPU host and training data that does not exist pre-launch; BKT+IRT ships behind the same interface |
| Executable code sandbox | Deferred to Phase 2 | Arbitrary code execution needs a hardened isolate; Vercel provides none, and `eval` is a remote-code-execution vulnerability. Code items ship as completion/output-prediction, graded deterministically against stored answers |
| Neo4j, Redis, DynamoDB | Not used | PostgreSQL covers graph traversal (recursive CTEs), rate limiting, and history at MVP scale; extra datastores add vendors and failure modes without benefit |
| FastAPI / LangGraph service | Not used | A second always-on host conflicts with single-deployment Vercel delivery; orchestration is a typed state machine in the app |
| Peer matching, RLHF fine-tuning, syllabus ingestion | Phase 3 | Per PRD roadmap |

Each is recorded with its reversal cost in the [assumptions register](docs/DAR-TECH-STACK.md#14-assumptions-register-requires-sign-off).

---

## Running it

_(Commands become live as the application scaffold lands; the deployment target is Vercel with a Neon PostgreSQL database.)_

```bash
npm install
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

**Environment variables** (all server-side; nothing secret is exposed to the browser):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled connection string |
| `DIRECT_URL` | yes | Neon direct connection, migrations only |
| `AUTH_SECRET` | yes | Session signing key |
| `AUTH_URL` | yes | Deployment URL |
| `ANTHROPIC_API_KEY` | no | Enables AI explanations and Socratic phrasing; without it the system runs on curated content and deterministic hints |
| `AI_TIMEOUT_MS` | no | LLM timeout before fallback (default 3500) |

**Quality gates**

```bash
npm run lint && npm run typecheck && npm run test && npm run test:e2e
```

---

## Documentation

| Document | Contents |
|---|---|
| [adaptive_learning_intelligence_system_prd.md](adaptive_learning_intelligence_system_prd.md) | Product requirements — the source of truth |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, project structure, data model, adaptive engine maths, AI guardrails, API surface, UX, performance, testing, deployment |
| [docs/DAR-TECH-STACK.md](docs/DAR-TECH-STACK.md) | Decision Analysis & Resolution — weighted criteria, alternatives, scoring, resolutions, assumptions, rejected options |
| [docs/DESIGN-MOTION-SYSTEM.md](docs/DESIGN-MOTION-SYSTEM.md) | Knowledge graph spec, halftone/grid visual language, GSAP architecture, motion tokens, micro-animation catalogue, animation merge gate |
| [CLAUDE.md](CLAUDE.md) | Living project context — agenda, current state, decisions, conventions, next actions |
