# Adaptiq Implementation & UX / Feature Roadmap (TODO)

Generated from `adaptive_learning_intelligence_system_prd.md`, `CLAUDE.md`, and system architecture documents against the current codebase status.

---

## 📊 Summary of Current Progress

- **Scaffolding & Architecture:** Complete Next.js 16 + TypeScript strict setup.
- **Database & Data Layer:** Neon PostgreSQL connected, Prisma schema (27 models) validated & migrated (`init`, `llm_credentials`), seed script active (26 concepts, 38 edges, 2 goals, 16 lenses, 9 questions, 36 hints, 9 misconceptions).
- **Core Adaptive Engine (`src/engine/`):** Pure TypeScript mathematical algorithms written with 92 passing unit tests (`irt`, `bkt`, `decay`, `graph`, `cat`, `path`, `layout`, `recommender`).
- **Auth Layer:** Auth.js v5 credentials flow, bcrypt-12 hashing, registration API & validation, login/register UI.
- **AI Infrastructure:** 4-tier LLM resolution (`src/ai/resolve.ts`), Anthropic + OpenAI-compatible connectors, AES-256-GCM encrypted BYOK credentials model.
- **Landing Page & Foundation Theme:** MUI v9 Light Theme with graph-paper ground, halftone density mastery visualization (`MasteryDots`).

---

## 🎯 PRD Implementation & UX Action Items (TODO)

### 1. Dynamic Cold-Start & Diagnostic Onboarding (Module 1 / FR-1.1–FR-1.3)
- [ ] **Onboarding Workflow UI (`app/(learner)/onboarding/`)**
  - [ ] Goal selection step (choose active goal e.g., "Build Distributed Systems", "Foundational ML")
  - [ ] Cognitive lens preference selector (Analogical, Code-First, First-Principles, Visual)
  - [ ] CAT Diagnostic runner view with live question stream, timer/progress, and confidence band indicator
- [ ] **Diagnostic API Integration & State Persistence**
  - [ ] Complete connection between `src/services/diagnostic.ts` and `app/api/diagnostic/` (`sessions`, `next`, `answers`, `complete`)
  - [ ] Fisher information 2PL IRT item selection & real-time $\theta$ ability computation with dynamic prerequisite routing upon failure
  - [ ] Seed initial `KnowledgeState` across target concept graph upon diagnostic completion

### 2. Evolving Knowledge State & Adaptive Dashboard (Module 2 & 6 / FR-2.1–FR-2.3, FR-6.1)
- [ ] **Metacognitive Learner Dashboard (`app/(learner)/dashboard/`)**
  - [ ] Summary cards: Knowledge Velocity, Active Goal Progress, Concepts Mastered, Fragile Concepts requiring review
  - [ ] Ranked Next Action recommendations with clear explainability badge / rationale (e.g. *Prerequisite Bridge*, *Review Probe*, *Next Concept*)
  - [ ] Misconception Tracker card highlighting logged recurring logical errors & targeted disambiguation links
- [ ] **Spaced Retrieval & Decay Engine Integration (FR-2.2)**
  - [ ] Active session review queue (`app/(learner)/review/`) for items where $R(t) < 0.70$
  - [ ] Automated micro-probe generation prior to starting dependent downstream modules

### 3. Interactive Knowledge Graph & Table Twin (Module 6 / FR-6.1, Spec §2)
- [ ] **React Flow Visual Concept Map (`src/ui/graph/KnowledgeGraph.tsx`)**
  - [ ] Layered DAG layout derived deterministically from `src/engine/layout.ts`
  - [ ] Custom concept nodes rendering halftone dot mastery density (`MasteryDots`) and circular retrievability drain ring
  - [ ] Animated prerequisite edges with unlock pulses when mastery crosses $\ge 0.70$ threshold
  - [ ] Node selection drawer: details, mastery score, decay state, prerequisite blockers, and "Start Learning" CTA
- [ ] **Accessible Knowledge Table Twin (`src/ui/graph/KnowledgeTable.tsx`)**
  - [ ] Synchronized full keyboard-navigable, sortable & filterable view of all concept states
  - [ ] Status filters: Mastered, Fragile, In Progress, Gap, Locked

### 4. Multi-Lens Content & Interactive Learning Experience (Module 3 & 4 / FR-3.1–FR-3.2, FR-4.1–FR-4.2)
- [ ] **Concept Learning Hub (`app/(learner)/learn/[conceptSlug]/`)**
  - [ ] Multi-Lens view switcher tabs (Analogy, First-Principles, Code, Visual Diagram) with animated transitions
  - [ ] In-flow formative micro-assessments appearing dynamically during study sessions (MCQ, code prediction, architectural discrimination)
  - [ ] ZPD difficulty tuning targeting 25%–35% error rate for optimal learning challenge

### 5. Socratic Dialogue & Cognitive Scaffolding Agent (Module 5 / FR-5.1–FR-5.2)
- [ ] **Socratic AI Tutor Interface (`src/ui/tutor/SocraticTutor.tsx`)**
  - [ ] 4-Tier Scaffolding Ladder: Level 1 (Clarifying Question) $\rightarrow$ Level 2 (Conceptual Reminder) $\rightarrow$ Level 3 (Isomorphic Example) $\rightarrow$ Level 4 (Step-by-step Walkthrough + fresh challenge)
  - [ ] Real-time output guardrails with answer-leakage protection and prompt injection scrubbing
  - [ ] Clear hint provenance badges (AI-generated vs. Deterministic fallback ladder)
  - [ ] Graceful fallback (< 3.5s timeout / unconfigured key) to database-backed deterministic hint ladders

### 6. User Experience & Design Polish (Design & Motion System)
- [ ] **GSAP Micro-Animations (`src/ui/motion/`)**
  - [ ] Register centralized GSAP plugins and `MotionProvider`
  - [ ] Respect `prefers-reduced-motion` and user profile motion overrides (`SYSTEM | FULL | REDUCED`)
  - [ ] Button press micro-feedback, hint ladder rung animations, mastery bloom counter on answer submission
- [ ] **BYOK (Bring-Your-Own-Key) Settings Modal (`app/(learner)/profile/`)**
  - [ ] Connect personal Anthropic / OpenAI keys with live provider verification and masked display (last-4 chars)
- [ ] **Instructor & Cohort Analytics View (`app/(instructor)/cohorts/[id]/` - FR-6.2)**
  - [ ] Aggregate class mastery heatmap and top 5 systemic curriculum bottlenecks

### 7. End-to-End Testing & Verification (PRD §9)
- [ ] **Automated E2E Test Suite (Playwright + Axe-Core)**
  - [ ] `TC-E2E-01`: Cold-start onboarding to target path generation
  - [ ] `TC-E2E-02`: Misconception trigger & Socratic hint escalation
  - [ ] `TC-E2E-03`: Prerequisite gap interception & route-back traversal
  - [ ] `TC-E2E-04`: Ebbinghaus decay & interleaved probe injection
  - [ ] `TC-E2E-05`: LLM timeout & deterministic fallback validation
  - [ ] WCAG 2.2 AA accessibility and keyboard navigation audit across all routes
