# Module System

Purpose:
- coordinate temporal jobs and wire shared dependencies

Responsibilities:
- polling and schedulers
- backoff and retry policies
- cancellation via `AbortController`
- single-flight or single-polling guards
- pause/resume based on page visibility or equivalent platform lifecycle
- wiring and dependency injection between UI, store, and services

Core laws:
- module coordinates jobs; it does not render UI
- module may call services and commit results into the store
- module may observe platform lifecycle signals such as `document.visibilityState`, but must not query or mutate component DOM

Limits:
- module is not the single source of truth; the store is
- module does not contain template, CSS, or presentation logic
- module does not persist shared domain data outside the store
- module does not replace owner responsibilities for structural DOM changes

Wiring rules:
- inject store and services into the module
- inject store and module into UI at the composition root or owner bootstrap
- owner receives intent events, translates them into module/store commands, and applies structural changes when needed

Filesystem layout:
- module implementation must live in a dedicated `modules/` sibling folder, not inside the component folder
- preferred path pattern: `modules/<owner-name>/<owner-name>.module.js`
- example sibling layout:
  - `componentes/ui-board-gallery/ui-board-gallery.js`
  - `modules/ui-board-gallery/ui-board-gallery.module.js`
