# Lifecycle Contract

initializeOnce()
- asset loading
- DOM queries
- listener setup

onConnected()
- sync state → UI

connectedCallback must be idempotent.
