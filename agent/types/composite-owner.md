# Type: CompositeOwner

Definition:
Component that coordinates child components.

Characteristics:
- owns workflows
- listens to child intent events
- parent controls structure
- may consume shared store state when multiple children must stay synchronized

Rules:
- children never manipulate parent DOM
- owner handles orchestration
- owner executes structural changes, but shared data persistence belongs in the store
- owner routes API work to services and temporal jobs to modules when those concerns exist
