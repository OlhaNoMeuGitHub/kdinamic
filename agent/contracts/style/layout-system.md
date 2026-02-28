# CONTRACT: Layout System

This contract defines a stable layout grammar to prevent:
- accidental overlap
- unexpected horizontal resizing
- scroll traps
- text-driven container growth

It is written as a small “pattern language” for layout.

---

## L0–L3 Layer Model (Structural Flow)

### L0 — Page Flow
**Vertical scroll belongs to the document.**

Rules:
- Do not trap vertical scroll inside components by default.
- Avoid `height: 100vh` + `overflow: auto` as a default pattern.

Allowed:
- Local vertical scroll only when explicitly justified (e.g., virtualized lists).

### L1 — App Shell (Page regions)
Use **Grid** for page-level areas (header/sidebar/content).

### L2 — Region Layout (Within an area)
Choose layout by dimensionality:
- **Grid** for 2D structure (rows + columns, responsive tracks).
- **Flex** for 1D alignment (toolbars, stacks, button rows).

### L3 — Component Internals
Internal layout must apply the invariants below:
- bounded surfaces
- shrink permission
- text rules
- no accidental overlay

---

## Pattern A — Size Boundaries (Content-independent width)

**Goal:** container width/height is decided by layout, not by content.

Rules:
- Structural containers MUST declare width boundaries:
  - `inline-size` via `clamp()` OR
  - grid tracks via `minmax()` OR
  - flex-basis with min/max constraints.
- Prefer using `max-inline-size: 100%` on internal blocks.

Recommended (board columns):
- `grid-auto-columns: clamp(240px, 22vw, 360px)` OR equivalent in flex.

Anti-patterns:
- letting long text expand the container width
- relying on implicit sizing for structural containers

---

## Pattern B — Shrink Permission (Mandatory `min-width: 0`)

**Problem:** flex/grid children default to `min-width: auto`, preventing shrink → overflow.

Rule (mandatory):
- Any flex/grid child that contains text or inputs MUST have:
  - `min-width: 0`

Apply to:
- column content wrappers
- card body wrappers
- header rows with text and buttons

---

## Pattern C — No Accidental Overlay

Overlap must be an explicit feature, not a layout accident.

Rules:
- Growing content (textareas, comment bodies, lists) MUST stay in normal flow.
- Do NOT use `position: absolute` for content that can grow.
- Use `box-sizing: border-box` on interactive surfaces.

Allowed overlays (only by design):
- menus, tooltips, modals with explicit anchoring and z-index scale (see overlays contract).

---

## Pattern D — Input Surfaces are Bounded

All inputs/textarea must follow the bounded surface signature:

- `display: block;`
- `inline-size: 100%;`
- `max-inline-size: 100%;`
- `box-sizing: border-box;`

Textarea policy:
- If JS auto-resizes height: `overflow: hidden; resize: none;`
- If not auto-resizing: `overflow: auto; resize: vertical;`

Anti-patterns:
- textarea without `max-inline-size: 100%`
- inputs with implicit sizing in a shrinking flex row

---

## Pattern E — Scroll Policy

Rules:
- Vertical scroll: document-level (L0).
- Horizontal scroll: allowed only for structural containers (boards/timelines).

Forbidden by default:
- nested vertical scroll containers without explicit justification

---

## Pattern F — Containment (Optional for stability)

Optional (use sparingly):
- `contain: layout paint;` for complex internal layouts to reduce reflow side-effects.

Do NOT use containment if the component depends on outside sizing/positioning in unusual ways.

---

## Self Verification (Agent)

Before output ensure:
- Structural containers have explicit size boundaries.
- Flex/grid wrappers containing text/inputs have `min-width: 0`.
- Text uses an explicit text rule (see `text-rules.md`).
- Inputs/textarea follow bounded surface signature.
- No accidental overlay for growing content.
- No vertical scroll trap unless explicitly justified.
