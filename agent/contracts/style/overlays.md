# CONTRACT: Overlays

This contract defines how to build overlays (menus, tooltips, modals) without accidental overlap bugs.

Overlays are allowed ONLY when explicitly designed and must follow the rules below.

---

## Overlay Types

### O1 — Menu / Popover (anchored)
- anchored to a trigger element
- can overflow outside component bounds
- must have explicit z-index

### O2 — Tooltip (anchored)
- small anchored overlay
- should not capture focus by default

### O3 — Modal / Dialog (global)
- `position: fixed`
- blocks interaction behind it

---

## Core Laws

1) **No accidental overlay**
   - growing content must not be positioned absolute
   - overlays exist as explicit overlay nodes only

2) **Anchoring must be explicit**
   - menus/popovers must be positioned relative to a known anchor
   - do not depend on incidental DOM layout

3) **Z-index uses a scale**
   - do not invent arbitrary z-index per component

---

## Z-Index Scale (Recommended)

Use tokens/variables (preferred):
- `--ui-z-base: 0`
- `--ui-z-sticky: 10`
- `--ui-z-dropdown: 100`
- `--ui-z-tooltip: 200`
- `--ui-z-modal: 1000`

Rules:
- menus/popovers: dropdown
- tooltips: tooltip
- modals: modal

---

## Positioning Rules

### Menus/Popovers
- Prefer `position: fixed` with coordinates computed from anchor rect (JS) for reliability across scroll containers.
- Alternative: `position: absolute` only if you control the nearest positioned ancestor and understand scroll implications.

Minimum CSS:
- `position: fixed;`
- `max-inline-size: min(320px, 90vw);`
- `max-block-size: min(60vh, 480px);`
- `overflow: auto;`
- `box-sizing: border-box;`

### Tooltips
- `pointer-events: none` by default
- keep small and non-interactive

### Modals
- `position: fixed; inset: 0;`
- backdrop + dialog surface
- trap focus only when needed

---

## Anti-patterns

- using z-index to “fix” accidental overlap
- absolute-positioned growing content (textarea/comment body)
- relying on a component's internal DOM structure for overlay anchoring
- multiple overlay systems competing in the same gesture/context

---

## Self Verification (Agent)

Before output ensure:
- overlay is explicit and intentional
- anchoring is defined
- z-index comes from the scale
- growing content remains in normal flow
