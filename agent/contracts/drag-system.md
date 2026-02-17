# Drag System

Core laws:
- component never moves itself
- only parent reorders
- host element never draggable

Handle drag:
- drag starts from handle element

Internal drag:
- allowed on internal shell only

Cross-component drag:
- owned by parent


Shell Pattern:

<div class="shell">
  <handle draggable="true"></handle>
  <component></component>
</div>

Parent Responsibilities:

- detect drag context
- compute drop targets
- insert placeholder

Child Responsibilities:

- expose drop API