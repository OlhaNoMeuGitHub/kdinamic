# Canonical InteractiveOwner

This canonical demonstrates the full layered pattern for static front-end with Shadow Components:

- `ui-interactive-composite-owner.store.js`
  - observable store
  - single source of truth for shared board data
- `ui-interactive-composite-owner.service.js`
  - pure mock/fetch service contract
  - no DOM access
- `ui-interactive-composite-owner.module.js`
  - polling, single-flight, backoff, cancellation, page visibility pause/resume
  - dependency injection between UI, store, and service
- `ui-interactive-composite-owner.js`
  - owner subscribes to store
  - owner handles child intents and structural DOM changes
- `../ui-ico-child/ui-ico-child.js`
  - leaf UI subscribes to the same store
  - emits point-in-time delete intent events

Flow:

1. UI subscribes to the store.
2. Module calls the service.
3. Service returns data without touching DOM.
4. Module commits the result into the store.
5. Owner and child instances react from store state.
6. Child intents bubble to the owner.
7. Owner translates the intent into module commands and applies structural changes through store-driven rendering.
