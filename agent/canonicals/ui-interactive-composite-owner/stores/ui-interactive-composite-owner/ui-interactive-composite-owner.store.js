function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createDefaultState() {
  return {
    columns: [],
    sync: {
      status: "idle",
      paused: false,
      error: null,
      lastReason: "bootstrap",
      lastUpdatedAt: null,
    },
  };
}

export function createUiInteractiveCompositeOwnerStore(initialState = {}) {
  let state = {
    ...createDefaultState(),
    ...cloneValue(initialState),
    sync: {
      ...createDefaultState().sync,
      ...(initialState.sync || {}),
    },
  };

  const listeners = new Set();

  function getState() {
    return state;
  }

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function setState(nextStateOrUpdater) {
    const nextState =
      typeof nextStateOrUpdater === "function" ? nextStateOrUpdater(state) : nextStateOrUpdater;
    state = nextState;
    notify();
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(state);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    getState,
    setState,
    subscribe,
  };
}

export function selectColumnById(state, columnId) {
  return state.columns.find((column) => column.id === columnId) || null;
}
