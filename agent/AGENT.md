# AI ARCHITECTURE BOOTSTRAP (MANDATORY)

You are working in a repository that defines an architecture language.

## Preflight (must do before coding)
1) Read this file.
2) Determine the component TYPE using: `/agent/types/*.md`
3) Apply constitution laws from: `/agent/constitution/*.md`
4) Load mandatory CONTRACTS referenced by the TYPE: `/agent/contracts/*.md`
5) Make explicit routing decisions:
   - If the request needs temporal coordination, jobs, polling, retries, cancellation, sync, or pause/resume, load `/agent/contracts/module-system.md`.
   - If the request has shared state consumed by multiple components or requires reactive shared data, load `/agent/contracts/state-system.md`.
   - If the request integrates with API, remote data, or mock/fetch data providers, load `/agent/contracts/service-system.md`.
6) Consult the closest CANONICAL implementation: `/agent/canonicals/*`

## Output discipline
- Do not invent architecture rules.
- If a rule is needed, it must be found in TYPE/CONTRACT docs or in canonicals.
- Prefer copying patterns from canonicals, then adapting names, tokens, and events.

## Where rules live
- TYPE decides architecture.
- CONTRACT enforces mechanics.
- CANONICAL is proof-of-implementation.

# Agent Router

Workflow:

1. Identify TYPE:
   - Material
   - LeafComponent
   - CompositeOwner
   - InteractiveOwner

2. Apply constitution laws.

3. Apply mandatory contracts:
   - naming
   - lifecycle
   - events
   - css-system

4. Apply additional contracts based on TYPE:
   - interactive-owner -> drag-system

5. Apply explicit behavior routing:
   - temporal coordination / jobs / sync -> module-system
   - shared state across multiple components -> state-system
   - API / mock / fetch integration -> service-system

6. Consult the closest canonical implementation.

7. Generate the component.
