# Adaptiq — Knowledge Graph, Visual Language & Motion System

**Companion to:** [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DAR-TECH-STACK.md`](DAR-TECH-STACK.md)
**Status:** Proposed — awaiting sign-off before implementation

---

## 0. The governing rule

> **Motion is a data channel, not decoration.**

Every animation in Adaptiq must encode something the learner needs to understand: how much they know, how fast it is fading, what just unlocked, why the system routed them backwards. If an animation carries no information, it does not ship. This is the reconciliation between "make learning playful" and the accessibility mandate not to add unnecessary animation — and it is enforced by a review checklist in §9, not by good intentions.

Three corollaries:

1. **Every animated signal has a static equivalent.** Halftone density is also a number; a drain ring is also a "Needs review" label; an unlock pulse is also a status change in the table twin. Turn all motion off and the interface loses delight, never meaning.
2. **Reduced motion is a first-class state, not a fallback.** End states are always applied; only the interpolation is removed.
3. **Motion never gates interaction.** Buttons are clickable during their own animation; the graph is navigable while it is entering.

---

## 1. Visual Language

### 1.1 The motif: halftone as a mastery substrate

The product's subject is *partial, probabilistic knowledge*. A solid colour fill communicates a binary; a **halftone dot field communicates a quantity you can see at a glance and still read in greyscale**. So mastery is rendered as dot density.

```
GAP 0.15          IN PROGRESS 0.45        FRAGILE 0.72          MASTERED 0.93
·   ·   ·          · · · · ·              ·•·•·•·•·             ●●●●●●●●
  ·   ·   ·        · · · · ·              •·•·•·•·•             ●●●●●●●●
·   ·   ·          · · · · ·              ·•·•·•·•·             ●●●●●●●●
sparse, small      even, mid              dense, growing        near-solid
```

Implementation: eight quantised density buckets rendered as SVG `<pattern>` definitions declared **once** in a shared `<defs>` and referenced by `fill="url(#halftone-5)"`. Nodes never own private patterns — that is the difference between a smooth graph and a janky one. Mastery changes animate `r` (dot radius) on the active pattern instance for the focused node only; bulk nodes snap between buckets.

Why this matters for accessibility: density survives greyscale printing, colour-blindness, and low-contrast displays. Colour is the *fourth* redundant encoding, after density, icon, and text label.

### 1.2 The ground: graph grids

The canvas beneath the product is engineering graph paper — the surface a learner would actually work a problem out on.

| Layer | Spec | Opacity | Where |
|---|---|---|---|
| Minor grid | 8px repeating linear gradients, 1px lines | 0.035 | App background, card interiors at 0.02 |
| Major grid | 48px, 1px lines | 0.06 | App background |
| Halftone vignette | Radial dot field, density falling off from a corner | 0.08 → 0 | Empty states, onboarding, auth, hero panels |
| Node-edge watermark | Faint concept-graph line art | 0.04 | Onboarding, empty dashboard |

Grids are **static and non-parallax**. Scroll-linked background motion is a common cause of vestibular discomfort and buys nothing here.

### 1.3 Colour tokens (light Material, contrast-verified)

| Token | Role | Hex | Contrast on surface |
|---|---|---|---|
| `primary` | Actions, in-progress | `#1A5FD0` | 6.4:1 |
| `mastered` | Mastered status | `#1B7F4B` | 5.1:1 |
| `fragile` | Needs review | `#8A5A00` | 5.3:1 (amber text is darkened; the *fill* is `#F5B942`) |
| `gap` | Gap / blocking | `#B3261E` | 6.2:1 |
| `locked` | Locked node | `#5F6368` | 6.9:1 |
| `surface` | Card | `#FFFFFF` | — |
| `background` | App | `#F7F8FA` | — |
| `grid` | Grid lines | `#0B1F3A` @ 3.5–6% | — |

Status is **never** colour alone. Canonical pairing:

| Status | Colour | Icon | Halftone | Text |
|---|---|---|---|---|
| Mastered | green | ✓ check | 0.85–1.0 density | "Mastered · 93%" |
| Fragile | amber | ⚠ warning + drain ring | 0.6–0.85, drifting | "Needs review · 72%" |
| In progress | blue | ◐ half-circle | 0.3–0.6 | "In progress · 45%" |
| Gap | red | ! exclamation | <0.3 | "Gap · 15%" |
| Locked | grey | 🔒 lock | flat, no dots | "Locked · 2 prerequisites" |
| Not started | grey | ○ outline | none | "Not started" |

---

## 2. The Learner Knowledge Graph

The centrepiece. It answers, in one view: **what do I know, what is fading, what is blocked, and why.**

### 2.1 Data contract

`GET /api/knowledge-state/graph?goal=<slug>` → (learner-scoped, session-derived `userId`, paginated by subgraph not by row)

```ts
type GraphNode = {
  conceptId: string; slug: string; title: string;
  rawMastery: number;        // BKT posterior, 0–1
  retrievability: number;    // Ebbinghaus R(t), 0–1
  effectiveMastery: number;  // raw × R(t) — what the halftone renders
  status: 'MASTERED'|'FRAGILE'|'IN_PROGRESS'|'GAP'|'LOCKED'|'NOT_STARTED';
  attempts: number; correct: number; lastInteractionAt: string|null;
  unmetPrerequisites: string[];   // drives "why is this locked"
  goalWeight: number;             // relevance to the active goal
  rank: number; order: number; x: number; y: number;  // server layout
};
type GraphEdge = {
  from: string; to: string; strength: number;
  satisfied: boolean;      // prerequisite mastery ≥ 0.70
};
```

### 2.2 Layout is computed on the server, once

A force-directed simulation would re-tumble the graph on every visit — the learner's mental map would never stabilise, tests would be non-deterministic, and the browser would burn CPU on physics.

Instead: **layered DAG layout (Sugiyama-lite)** computed in `src/engine/layout.ts` — longest-path ranking for the y-axis, barycentre ordering within each rank to cut edge crossings — persisted in a `ConceptLayout` table keyed by `(goalId, conceptId)` and invalidated only when the concept graph itself changes. The layout is a pure function of the curriculum, so **it is identical for every learner and stable across sessions**: the map a learner memorises stays put. Only the *node states* are personal.

Pure function, unit-testable: given a fixed DAG, ranks and orders are asserted exactly.

### 2.3 Rendering

React Flow (`@xyflow/react`) for viewport, pan/zoom, and edge routing; **custom node and edge components** so GSAP owns every animatable property. Nodes are SVG-in-HTML: an outer MUI `Paper` for elevation and focus ring, an inner `<svg>` carrying the halftone field and the retrievability ring.

Both the graph route and React Flow are dynamically imported — the dashboard's first paint never pays for them.

### 2.4 The six animations, and what each one teaches

| # | Animation | What the learner learns | Spec |
|---|---|---|---|
| **A1** | **Topological entrance** — nodes fade/scale in ordered by prerequisite rank, roots first, cascading downstream; edges draw in behind them | *Knowledge has a direction; foundations come first* | `stagger: {each: 0.03, from: rank}`, `dur.fast`, `ease.standard`; total ≤ 900ms regardless of node count (stagger auto-compresses) |
| **A2** | **Mastery bloom** — on returning from an answered question, the affected node pulses `scale 1 → 1.06 → 1`, halftone dot radius tweens to the new density, the ring arc sweeps to the new value, and the percentage counts up | *That answer changed something specific and measurable* | `dur.base`, counter via `gsap.to(obj, {value, onUpdate})`, single node only |
| **A3** | **Prerequisite unlock flow** — when a prerequisite crosses 0.70, its edge draws (`strokeDashoffset → 0`), a dot travels the path via MotionPath, the dashed edge becomes solid, and the downstream node desaturates→saturates as its lock icon cross-fades to an arrow | *This is exactly why the next thing opened up* — the core adaptive mechanic, made visible | `dur.slow` chained; queued so multiple unlocks play in sequence, never simultaneously |
| **A4** | **Route-back traversal** — on a prerequisite gap interception, the viewport pans and zooms from the failed node along the highlighted edge to the missing prerequisite, which then pulses | *The system did not just say "no" — it found the cause* | Viewport tween 700ms `ease.emphasized`; announced in a live region: "Moving to prerequisite: Pointers" |
| **A5** | **Decay drift** — fragile nodes' halftone dots drift and dim on a slow ambient loop; the retrievability ring visibly drains | *This is fading; retrieve it before it's gone* | `dur.ambient` yoyo loop, opacity 1 → 0.72 only; **never runs under reduced motion**; auto-kills when off-screen |
| **A6** | **Focus lens** — hover/keyboard-focus lifts the node, highlights its direct prerequisites and dependents, and dims unrelated nodes to 35% | *Here is this concept's neighbourhood* | `dur.instant`, opacity + elevation only |

### 2.5 Accessibility of the graph — the table twin

The graph is **never the only path to a concept.** Every knowledge-graph view ships a toggle to an equal-status **Knowledge Table**: sortable and filterable by status, mastery, retrievability, last practised, and blocking prerequisites. Both render the same API payload; neither is a downgrade.

In the graph itself:
- Nodes are real `<button>`s in a `role="application"` container with documented keys: `Tab` between nodes in topological order, `↑/↓` to prerequisites/dependents, `←/→` between siblings at the same rank, `Enter` to open, `Esc` to exit the graph, `?` for the key map.
- Every node has an accessible name carrying the whole story: *"Recursion — In progress, 45 percent mastery, needs review in 3 days, 1 unmet prerequisite: Call Stack."*
- A `role="status"` live region narrates state changes (A2, A3, A4) so unlocks are announced, not merely animated.
- Focus rings are drawn **outside** node bounds at 3:1 contrast and are never suppressed by a tween.
- Pan/zoom has button equivalents (zoom in/out/fit) — no gesture-only control.
- A legend panel maps every colour, icon, and density band to text.

---

## 3. Motion Tokens

Named constants in `src/ui/motion/tokens.ts`. No literal durations or eases anywhere else in the codebase — lint rule enforced.

```ts
export const DUR = {
  instant: 0.12,  // hover, focus, press
  fast:    0.20,  // icon transitions, chips, tooltips
  base:    0.32,  // cards, panels, counters, mastery updates
  slow:    0.50,  // unlocks, route-back, celebratory moments
  ambient: 2.40,  // decay drift loops only
} as const;

export const EASE = {
  standard:   'power2.out',    // Material decelerate — most entrances
  emphasized: 'power3.out',    // unlocks, viewport moves
  exit:       'power2.in',     // dismissals
  spring:     'back.out(1.4)', // reserved: correctness confirmation only
} as const;

export const STAGGER = { tight: 0.03, base: 0.06, loose: 0.10 } as const;
```

Budget rule: **no single interaction exceeds 900ms end-to-end.** Learning flow beats choreography.

---

## 4. GSAP Integration Architecture

### 4.1 Setup

- `gsap` + `@gsap/react`; plugins `useGSAP`, `DrawSVGPlugin`, `MotionPathPlugin`, `SplitText` (headline reveals only), `ScrollTrigger` (progress timeline only). All free under GSAP's current no-charge licence — no commercial licensing risk.
- Registered **once** in `src/ui/motion/register.ts`, imported by the motion provider. Never registered inside components.
- `'use client'` boundary: GSAP is client-only. Server Components render the full, correct, static markup; motion enhances it after hydration. **A learner with JS disabled or a failed hydration sees a complete, readable interface** — animation is never a rendering dependency.

### 4.2 `useGSAP` everywhere — no bare `gsap.to` in components

```tsx
const scope = useRef<HTMLDivElement>(null);
useGSAP(() => {
  gsap.from('[data-anim="node"]', { opacity: 0, scale: 0.94, ...ENTRANCE });
}, { scope, dependencies: [graphVersion] });
```

`useGSAP` scopes selectors to the ref and **auto-reverts every tween on unmount** — this is what prevents the classic React 19 / StrictMode double-invoke leak where timelines stack up and memory climbs across route changes.

### 4.3 The reduced-motion kill switch

One `gsap.matchMedia()` in `MotionProvider` wraps all conditional motion:

```ts
mm.add({
  full:    '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
}, (ctx) => {
  const { reduced } = ctx.conditions!;
  gsap.defaults({ duration: reduced ? 0 : DUR.base, ease: EASE.standard });
  if (!reduced) startAmbientLoops();   // A5 decay drift never starts
});
```

Under `reduced`: durations collapse to 0 so **end states still apply** (no missing content), counters `set` instead of tween, ambient loops never start, MotionPath travellers are skipped, viewport moves become instant jumps with the live-region announcement preserved.

### 4.4 Learner-level override, persisted

OS-level reduced-motion is not available to every learner (shared machines, locked-down lab images, personal preference that differs by context). So `LearnerProfile.motionPreference` — `SYSTEM | FULL | REDUCED` — is stored in Postgres, exposed in Profile settings, and resolved server-side into the initial `data-motion` attribute on `<html>` so there is **no flash of animated content** before hydration. `SYSTEM` defers to the media query.

### 4.5 Performance discipline

| Rule | Reason |
|---|---|
| Animate `transform` / `opacity` only (plus SVG `r`, `strokeDashoffset` on ≤1 focused element) | Compositor-only properties; no layout thrash |
| No `width`/`height`/`top`/`left` tweens, ever | Forced reflow |
| `will-change` applied on tween start, removed on complete | Permanent `will-change` costs GPU memory |
| Shared `<defs>` halftone patterns, 8 buckets | One pattern per node would be hundreds of paint sources |
| Ambient loops kill on `IntersectionObserver` exit | Off-screen nodes cost nothing |
| Graph virtualises above 150 nodes (viewport + 1-hop neighbours) | Bounded DOM regardless of curriculum size |
| Unlock animations queue on a single timeline | Ten simultaneous unlocks would be noise, not information |
| GSAP core + `useGSAP` ≈ 25KB gzipped, loaded in the client bundle; plugins dynamically imported per route | Dashboard first paint stays lean |

---

## 5. Micro-Animation Catalogue

Each entry states the information it carries. Anything that cannot fill that column is rejected.

### 5.1 Controls

| Element | Motion | Information carried |
|---|---|---|
| Primary button | Press `scale 0.97` (`instant`); trailing icon nudges `x +3` on hover | Affordance and directionality — "this moves you forward" |
| Icon button | Icon rotates/cross-fades between states (e.g. lens switcher) | State changed, and to *what* |
| Lens tabs (analogy/maths/code/visual) | Active indicator slides between tabs; content cross-fades `y 6 → 0` | The same concept, re-framed — not new content |
| Chip filter | Fill sweeps in from the leading edge | Selection is applied |
| FAB "Continue learning" | Idle: none. On new recommendation: single attention pulse, once | Something new is waiting — fires once, never loops |
| Disabled control | No motion; tooltip explains why | Absence of motion is itself the signal |

### 5.2 Learning flow

| Moment | Motion | Information carried |
|---|---|---|
| **Correct answer** | Check mark draws on via `DrawSVG` (`fast`, `spring`); mastery meter counts up; halftone densifies | Not just "right" — *how much it moved you* |
| **Incorrect answer** | Card shakes `x ±6`, 2 cycles, 220ms; misconception chip fades in below | Wrong, and here is the *named* reason |
| **Socratic hint ladder** | Each hint rises from below with the ladder rail drawing upward alongside; the rung counter increments | Escalation has a cost and a position — you are on rung 2 of 4 |
| **AI fallback engaged** | Hint arrives with a static "offline hint" badge, no streaming shimmer | Honest signal that this hint is rule-based, not model-generated |
| **Diagnostic convergence** | Question cards slide out left / in right; the confidence band around θ **visibly narrows** with each answer | *Every question is telling the system more* — makes CAT legible |
| **Concept complete** | Node bloom (A2) + path node ticks over + next recommendation card slides in with its rationale | The loop closed; here is what's next and why |
| **Review due** | Due count badge ticks up with a soft scale pop | Something is fading |

### 5.3 Structural

| Moment | Motion |
|---|---|
| Skeleton → content | Skeleton fades out, content enters `y 8 → 0`, `STAGGER.base`, `dur.fast` |
| Route change | Content-only cross-fade, 150ms — no page slides, no layout shift |
| Dialog | MUI transition + focus trap; `dur.fast` scale from 0.96 |
| Toast / error | Slide from bottom, auto-dismiss ≥ 6s (WCAG 2.2 timing), pause on hover/focus |
| Empty state | Halftone vignette fades in beneath the illustration once |
| Progress timeline | `ScrollTrigger` reveals milestones as they enter the viewport, once, non-reversing |

---

## 6. Schema & API Additions

| Change | Purpose |
|---|---|
| `ConceptLayout(goalId, conceptId, rank, order, x, y)` — unique `(goalId, conceptId)`, index `(goalId)` | Persisted deterministic DAG layout |
| `LearnerProfile.motionPreference` enum `SYSTEM \| FULL \| REDUCED`, default `SYSTEM` | Learner-level motion override |
| `GET /api/knowledge-state/graph?goal=` | Nodes + edges + layout + learner state in one round trip |
| `PATCH /api/profile/preferences` extended with `motionPreference` | Zod-validated, `.strict()` |

The graph endpoint returns the whole personalised subgraph in **one** query pair (nodes via indexed join on `KnowledgeState`, edges via recursive CTE) — no N+1, no per-node fetches.

---

## 7. Project Structure Additions

```
src/ui/motion/
  MotionProvider.tsx     # matchMedia, defaults, ambient registry, DB preference
  register.ts            # one-time plugin registration
  tokens.ts              # DUR / EASE / STAGGER
  useEntrance.ts         # staggered entrance hook
  useCountUp.ts          # numeric tween, reduced-motion aware
  useUnlockQueue.ts      # serialises A3 unlock timelines
src/ui/graphics/
  Halftone.tsx           # shared <defs> pattern bank, 8 buckets
  GridBackground.tsx     # minor/major graph grid
  MasteryRing.tsx        # retrievability arc
src/ui/graph/
  KnowledgeGraph.tsx     # React Flow canvas (dynamic import)
  ConceptNode.tsx        # halftone + ring + status + a11y name
  PrerequisiteEdge.tsx   # dashed/solid, DrawSVG-able
  GraphLegend.tsx        # colour/icon/density key
  KnowledgeTable.tsx     # the equal-status table twin
src/engine/layout.ts     # pure Sugiyama-lite ranking + ordering
```

---

## 8. Testing the Motion Layer

| Concern | Approach |
|---|---|
| Determinism | Playwright default project runs with `reducedMotion: 'reduce'` — all functional E2E assertions land on end states, never on timing |
| Motion correctness | A dedicated `motion.spec.ts` project runs with motion **on**, driving `gsap.globalTimeline.timeScale(50)` and asserting final DOM/attribute state (halftone bucket, edge `stroke-dasharray`, ring value) |
| Reduced-motion contract | Assert that under `reduce`, no `requestAnimationFrame` loop persists after settle **and** that all end states are correct — the critical failure mode is content stuck invisible at `opacity: 0` |
| Leak safety | Mount/unmount the graph route 20×, assert `gsap.globalTimeline.getChildren().length` returns to baseline |
| Layout purity | Unit-test `layout.ts`: fixed DAG → exact ranks and orders, cycle input throws |
| A11y | axe on graph and table views; keyboard traversal test walks prerequisite→dependent and opens a concept; live-region announcement asserted on unlock |
| Performance | Lighthouse budget in CI: graph route TBT < 200ms, CLS < 0.05, no long task > 50ms during entrance |

---

## 9. Animation Review Checklist (merge gate)

An animation may merge only if **all** are true:

- [ ] It encodes information the learner needs; the "information carried" column is filled and honest.
- [ ] A static equivalent conveys the same meaning (text, icon, number, or table row).
- [ ] It animates transform/opacity (or an approved SVG attribute on a single focused element).
- [ ] It respects `matchMedia` reduced motion, and end states are verified correct in that mode.
- [ ] It does not block, delay, or gate any interaction.
- [ ] It is scoped by `useGSAP` and reverts on unmount.
- [ ] Total duration ≤ 900ms; ambient loops are the only exception and they kill off-screen.
- [ ] Durations/eases come from tokens, not literals.
- [ ] It does not loop indefinitely in the user's central field of view.
- [ ] State changes it depicts are announced to assistive tech where they matter.
