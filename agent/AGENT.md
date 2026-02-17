# AI ARCHITECTURE BOOTSTRAP (MANDATORY)

You are working in a repository that defines an architecture language.

## Preflight (must do before coding)
1) Read this file.
2) Determine the component TYPE using: /types/*.md
3) Load mandatory CONTRACTS referenced by the TYPE: /contracts/*.md
4) If the request involves special behavior, load TRAITS: /traits/*.md
5) Consult the closest CANONICAL implementation: /canonical/*
6) follow the constitution/*.md

## Output discipline
- Do not invent architecture rules.
- If a rule is needed, it must be found in TYPE/CONTRACT/TRAIT docs or in canonicals.
- Prefer copying patterns from canonicals, then adapting names/tokens/events.

## Where rules live
- TYPE decides architecture.
- CONTRACT enforces mechanics.
- TRAIT adds optional capabilities.
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
   - interactive-owner → drag-system

5. Consult closest canonical implementation.

6. Generate component.
