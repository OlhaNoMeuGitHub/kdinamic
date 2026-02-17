# TYPE: LeafComponent

---

## Purpose

LeafComponent represents a self-contained UI unit.

Responsibilities:

- encapsulate rendering and internal state
- expose behavior through intent events
- operate independently without coordinating other components

Law:

LeafComponent expresses intent.
Owner components execute structural changes.

---

## Recognition Signals

Use this TYPE when:

- component does NOT orchestrate other components
- no structural ownership required
- internal state drives UI
- emits events but does not coordinate hierarchy
- interaction stays local to the component

Avoid when:

- component manages ordering or structure → use InteractiveCompositeOwner
- component coordinates multiple children → use CompositeOwner
- component is UI primitive → use Material

---

## Ownership Model

LeafComponent owns:

- internal state
- rendering
- UI interaction
- intent event emission

LeafComponent does NOT own:

- parent structure
- sibling ordering
- drag orchestration across components

Forbidden:

- removing itself from parent DOM
- mutating parent structure
- accessing parent internal DOM

---

## Architectural Laws

- lifecycle must be idempotent
- internal state drives UI updates
- communication via custom events only
- Shadow DOM boundaries respected
- no structural orchestration

---

## Mandatory Contracts

- lifecycle
- events
- naming
- css-system

Optional Contracts:

- token-styling
- state-driven-ui

---

## Canonical Reference

canonical-leaf-component

---

## Anti-patterns

- directly manipulating parent DOM
- coordinating other components
- using container delegation for cross-component communication
- adding drag behavior to host element

---

## Self Verification (Agent)

Before output ensure:

- component does not orchestrate children
- initializeOnce exists
- connectedCallback idempotent
- events use bubbles + composed
- CSS selectors prefixed with component name