# Type: CompositeOwner

Definition:
Component that coordinates child components.

Characteristics:
- owns workflows
- listens to child intent events
- parent controls structure

Rules:
- children never manipulate parent DOM
- owner handles orchestration
