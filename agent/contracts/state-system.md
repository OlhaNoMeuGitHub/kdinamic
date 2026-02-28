# State System

Purpose:
- define the shared reactive state boundary
- keep shared data outside UI instances

Store contract:
- expose `getState()`
- expose `subscribe(listener)`
- `subscribe` must return an unsubscribe function, or the store must expose an equivalent `unsubscribe`
- updates must notify all active subscribers

Core laws:
- the store is the single source of truth for shared data
- shared data consumed by multiple components must live in the store
- UI may keep only local ephemeral state outside the store
- UI must not persist shared data in component fields, datasets, globals, or DOM

Reactive rules:
- multiple component instances may subscribe to the same store
- when the store changes, subscribed UIs must re-read store state and react from that source
- cached derived values inside UI are disposable mirrors, never the authoritative shared state

Boundaries:
- store code does not query or mutate component DOM
- events remain point-in-time intent signals
- shared reactivity and durable shared data live in the store

Lifecycle:
- subscribe on setup/connection
- unsubscribe on teardown/disconnection
