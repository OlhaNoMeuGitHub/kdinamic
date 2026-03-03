# Service System

Purpose:
- isolate data access behind a pure service boundary

Core laws:
- services are pure relative to UI: they do not query DOM, mutate DOM, or depend on component instances
- services do not import component internals or Shadow DOM structure
- the same contract applies to fetch and mock implementations

Service rules:
- keep method names, inputs, outputs, and error semantics aligned across mock and fetch variants
- accept external dependencies via injection when needed, such as `fetch`, base URLs, clocks, or fixtures
- return data, promises, or thrown errors; never render UI
- support `AbortSignal` when network or long-running work can be cancelled

Boundaries:
- service owns I/O and data transformation only
- service does not become a store
- service does not dispatch UI events for shared state propagation

Filesystem layout:
- service implementation must live in a dedicated `services/` sibling folder, not inside the component folder
- preferred path pattern: `services/<owner-name>/<owner-name>.service.js`
- example sibling layout:
  - `componentes/ui-board-gallery/ui-board-gallery.js`
  - `services/ui-board-gallery/ui-board-gallery.service.js`
