âœ… MASTER GENERATION PROMPT â€” Components & Materials (REVISED)

You are generating a Web Component following a strict architecture.

Before generating code, identify whether you are generating:

â¬œ Component
â¬œ Material

Then follow all rules below.

ðŸ·ï¸ NAMING CONVENTIONS â€” CHECKLIST (MANDATORY)
File & Folder Naming

â¬œ All folders and file base names use kebab-case
â¬œ Each component/material has exactly:

<name>.html

<name>.css

<name>.js

Examples:

comment-box/comment-box.html
text-area-material/text-area-material.js

Custom Element Tag Naming (NAMESPACED)

â¬œ All custom elements MUST be namespaced with ui-

Formats:

â¬œ Component tag: ui-<kebab-name>
â¬œ Material tag: ui-<kebab-name>-m

Examples:

Component: ui-comment-box

Material: ui-text-area-m

JavaScript Class Naming

â¬œ Class names use PascalCase
â¬œ All classes are prefixed with Ui

Formats:

â¬œ Component class: Ui<PascalName>
â¬œ Material class: Ui<PascalName>Material

Examples:

ui-comment-box â†’ UiCommentBox
ui-text-area-m â†’ UiTextAreaMaterial

Tag Consistency Rule (CRITICAL)

â¬œ The exact same tag string must be used in:

customElements.define(...)

asset loaders

HTML usage

One tag string per component/material.

CSS Naming (UPDATED â€” CONSISTENT WITH REAL CODE)

â¬œ Every CSS class or ID must start with the component/material name
â¬œ ui- prefix IS allowed in CSS
â¬œ No generic selectors (h1, p, button, etc.)

Example:

.ui-column-retro-root {}
.ui-board-gallery-shell {}

ðŸ”§ GENERAL STRUCTURE RULES
Files

Generate three files:

ðŸ“„ <name>.html
ðŸŽ¨ <name>.css
ðŸ§© <name>.js

HTML

â¬œ Only markup
â¬œ No <style> or <script>

CSS

â¬œ No generic selectors
â¬œ All selectors prefixed by component/material name

ðŸ§  ARCHITECTURAL BOUNDARY

System layers:

Material â†’ Component â†’ Behavior

âœ… MATERIAL CHECKLIST

A Material is a generic, self-contained UI primitive.

â¬œ Wraps a single UI element
â¬œ Defines HTML + CSS
â¬œ May manage internal UI state
â¬œ May emit generic events
â¬œ May expose callbacks

â¬œ Must NOT coordinate other components/materials
â¬œ Must NOT call loadComponentAssets
â¬œ Must NOT orchestrate domain logic

â¬œ Calls ONLY loadMaterialsAssets

âš ï¸ Render Rule (UPDATED)

â¬œ Render may attach listeners ONLY to newly created elements
â¬œ Render must not accumulate listeners across renders

âœ… COMPONENT CHECKLIST

A Component is the owner and orchestrator.

â¬œ Owns domain behavior
â¬œ Coordinates materials
â¬œ Owns state and workflows
â¬œ Calls loadComponentAssets

ðŸ”„ LIFECYCLE STRUCTURE (MANDATORY)

Each component/material must implement:

1) initializeOnce()

â¬œ Asset loading
â¬œ DOM queries
â¬œ Event listeners
â¬œ Internal setup

Guard:

if (this._initialized) return;
this._initialized = true;

2) onConnected()

â¬œ Sync state â†’ UI
â¬œ Refresh visuals

Required connectedCallback pattern:
async connectedCallback() {
  if (!this._initialized) {
    await this.initializeOnce();
    this._initialized = true;
  }
  this.onConnected();
}


Law: connectedCallback must be idempotent.


EVENT OWNERSHIP & SHADOW DOM RULE â€” CHECKLIST (MANDATORY)
EVENT EMISSION RULE (CHILD â†’ OWNER)

â¬œ Components must communicate intentions exclusively through custom events
â¬œ Events must propagate beyond Shadow DOM boundaries
â¬œ Components must not directly manipulate parent structures
â¬œ Components must not remove or reorder themselves when wrapped by an owner shell
â¬œ Components must express intent, not execution

Law:

A component expresses intent; the owner executes changes.

EVENT LISTENING RULE (OWNER)

â¬œ Owner components must listen to child events at the component boundary
â¬œ Owner components must not rely on internal DOM nodes for event listening
â¬œ Owner components must not attach listeners to dynamic containers for cross-component communication
â¬œ Internal DOM must be treated as unstable and non-authoritative

Law:

The owner listens at the highest stable boundary.

SHADOW DOM COMMUNICATION LAW

â¬œ Communication across components must not depend on internal DOM structure
â¬œ Shadow DOM boundaries must be assumed to interrupt container-based event delegation
â¬œ Component-level event listening is mandatory for cross-component coordination

Law:

Component boundaries define communication boundaries.

ðŸ§© COMPONENT OWNERSHIP RULE
â— Component cannot delete itself

If wrapped by a parent shell, the component must emit intent, not mutate DOM.

Example:

Component emits: ui-column-delete

Parent removes the shell.

ðŸ§± SHELL WRAPPER PATTERN (NEW â€” FORMALIZED)

When a parent needs to move/reorder child components:

â¬œ Parent must wrap the component in a shell element
â¬œ Shell is owned by the parent
â¬œ Shell is the draggable/reorderable unit

Example:

<div class="shell">
  <ui-column-retro></ui-column-retro>
</div>


Law:

A component is never draggable â€” only its parent shell is.

ðŸ§² DRAGGING & OWNERSHIP RULE (REVISED)
CORE LAW

â¬œ A component must never move itself
â¬œ A component must never reorder itself among siblings
â¬œ Only parents may reorder child components

â¬œ A component must never set draggable="true" on its host element
â¬œ Drag logic must never target the custom element tag itself

âœ… ALLOWED DRAGGING TYPES
ðŸ…°ï¸ HANDLE DRAG (MANDATORY for components)

Used for moving/reordering components (columns, widgets, etc.)

â¬œ Drag starts ONLY from a dedicated handle element
â¬œ Handle belongs to the parent shell
â¬œ If drag does not start from handle â†’ cancel

Example handles:

move icon

grip

header bar

ðŸ…±ï¸ FULL-ITEM DRAG (ALLOWED for internal items)

Used for internal list items (cards, rows, list items).

â¬œ Drag may start from any part of the internal item
â¬œ Item must NOT be the component host
â¬œ Item must be an internal shell element

Example:

<div class="card-shell" draggable="true">
  <ui-card-retro></ui-card-retro>
</div>

â— IMPORTANT DISTINCTION

Forbidden:

dragging a component tag (ui-column-retro)

component handling drag to move itself

Allowed:

dragging internal shells

parent orchestrating movement

ðŸ§  DRAG CONTEXT ISOLATION RULE

â¬œ Only one drag system may be active per gesture
â¬œ Components must ignore drag events outside their domain
â¬œ Parent drag must not break child drag
â¬œ Child drag must not interfere with parent drag

ðŸ§  COMPONENT DRAG RESPONSIBILITY SPLIT
Child Component Responsibilities

â¬œ Expose drop zone API (e.g. getDropZone())
â¬œ Create internal draggable shells
â¬œ Never orchestrate cross-component drag

Parent Component Responsibilities

â¬œ Detect drag context (column vs card)
â¬œ Compute drop targets
â¬œ Insert placeholders
â¬œ Move shells across components

Law:

Cross-component drag belongs to the parent.

ðŸ–¥ï¸ LAYOUT & SCROLLING RULE (REVISED)
ROOT LAYOUT RULES

â¬œ Root must fill viewport naturally
â¬œ Use min-height: 100dvh (or 100vh fallback)
â¬œ Do NOT set height: 100vh
â¬œ Do NOT set overflow-y on root

Result:

Page scroll happens only when content exceeds viewport.

SCROLL RESPONSIBILITY

â¬œ Vertical scroll â†’ document level
â¬œ Horizontal scroll â†’ allowed only for structural containers (boards, timelines)

FORBIDDEN PATTERNS

â¬œ height: 100vh + overflow:auto
â¬œ scroll trapped inside component
â¬œ nested vertical scroll without justification

ðŸ§  MATERIAL PUBLIC API RULE

Every material must implement:

â¬œ getNativeElement()
â¬œ focus() (if applicable)
â¬œ value getter/setter (if input-like)
â¬œ disabled forwarding

Forbidden:

â¬œ accessing material.shadowRoot externally
â¬œ domain logic inside materials

ðŸ§ª SELF-VERIFICATION CHECKLIST

Before output, verify:

â¬œ naming rules
â¬œ lifecycle separation
â¬œ no duplicate listeners
â¬œ correct asset loader
â¬œ no component is draggable
â¬œ drag only on shells/handles
â¬œ parent owns reordering
â¬œ scroll rules respected

If any rule fails â†’ regenerate.

ðŸ“¤ OUTPUT FORMAT

Return exactly:

ðŸ“„ <name>.html
ðŸŽ¨ <name>.css
ðŸ§© <name>.js
