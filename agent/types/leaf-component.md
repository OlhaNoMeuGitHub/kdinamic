# TYPE: LeafComponent

---

## Purpose

LeafComponent represents a self-contained UI unit.

Responsibilities:

- encapsulate rendering and local ephemeral state
- expose behavior through intent events
- operate independently without coordinating other components

Law:

LeafComponent expresses intent.
Owner components execute structural changes.
Shared data lives in the store, not inside the leaf.

---

## Recognition Signals

Use this TYPE when:

- component does NOT orchestrate other components
- no structural ownership required
- internal state drives UI
- shared state, if any, is injected from an external store
- emits events but does not coordinate hierarchy
- interaction stays local to the component

Avoid when:

- component manages ordering or structure -> use InteractiveOwner
- component coordinates multiple children -> use CompositeOwner
- component is UI primitive -> use Material

---

## Ownership Model

LeafComponent owns:

- local ephemeral state
- rendering
- UI interaction
- intent event emission

LeafComponent does NOT own:

- parent structure
- sibling ordering
- drag orchestration across components
- shared state persisted across multiple component instances

Forbidden:

- removing itself from parent DOM
- mutating parent structure
- accessing parent internal DOM
- persisting shared data outside the store
- calling API directly from UI

---

## Architectural Laws

- lifecycle must be idempotent
- internal state drives UI updates
- shared reactive data must be read from the store when multiple components depend on it
- communication via custom events only
- Shadow DOM boundaries respected
- no structural orchestration

---

## Mandatory Contracts

- lifecycle
- events
- naming
- css-system

Additional Contracts When Applicable:

- state-system when the leaf consumes shared external state

---

## Canonical Reference

canonical-leaf-component

---

## Anti-patterns

- directly manipulating parent DOM
- coordinating other components
- using container delegation for cross-component communication
- adding drag behavior to host element
- persisting shared data in component properties instead of the store

---

## Self Verification (Agent)

Before output ensure:

- component does not orchestrate children
- initializeOnce exists
- connectedCallback idempotent
- events use bubbles + composed
- CSS selectors prefixed with component name
- shared data is not persisted outside the store
