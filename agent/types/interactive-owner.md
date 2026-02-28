# Type: InteractiveOwner

Definition:
CompositeOwner with interaction control.

Characteristics:
- drag/reorder ownership
- shell wrapper pattern
- interaction orchestration
- may consume shared store state across many child instances

Rules:
- drag via handle only
- component host never draggable
- parent moves shells
- owner executes structural changes but must not persist shared state outside the store
- owner translates child intents into store/module commands when shared data or temporal work is involved

Additional contracts:
- drag-system
- state-system when state is shared across components
- module-system when jobs, polling, retries, cancellation, or sync are required
- service-system when API or mock/fetch integration exists

Canonical:
ui-interactive-composite-owner
