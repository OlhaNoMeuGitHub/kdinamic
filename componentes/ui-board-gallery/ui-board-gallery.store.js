function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function createEmptyMetadata() {
  return {
    label: "",
    color: "",
  };
}

function createEmptyCard() {
  return {
    id: "",
    text: "",
    comments: [],
    likes: 0,
    metadata: createEmptyMetadata(),
  };
}

function createEmptyColumn() {
  return {
    id: "",
    text: "",
    comments: [],
    likes: 0,
    metadata: createEmptyMetadata(),
    cards: [],
  };
}

function createEmptyGallery() {
  return {
    id: "",
    text: "",
    comments: [],
    likes: 0,
    metadata: createEmptyMetadata(),
    columns: [],
  };
}

function createDefaultState() {
  return {
    gallery: createEmptyGallery(),
    sync: {
      status: "idle",
      paused: false,
      error: null,
      lastReason: "bootstrap",
      lastUpdatedAt: null,
      revision: 0,
    },
  };
}

export function createUiBoardGalleryStore(initialState = {}) {
  const defaultState = createDefaultState();

  let state = {
    ...defaultState,
    ...cloneValue(initialState),
    gallery: {
      ...defaultState.gallery,
      ...(initialState.gallery ? cloneValue(initialState.gallery) : {}),
      metadata: {
        ...defaultState.gallery.metadata,
        ...(initialState.gallery?.metadata ? cloneValue(initialState.gallery.metadata) : {}),
      },
    },
    sync: {
      ...defaultState.sync,
      ...(initialState.sync ? cloneValue(initialState.sync) : {}),
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

export function selectGallery(state) {
  return state?.gallery || null;
}

export function selectColumnById(state, columnId) {
  return state?.gallery?.columns?.find((column) => column.id === columnId) || null;
}

export function selectCardById(state, columnId, cardId) {
  const column = selectColumnById(state, columnId);
  return column?.cards?.find((card) => card.id === cardId) || null;
}

export function findCardLocation(state, cardId) {
  const columns = state?.gallery?.columns || [];

  for (const column of columns) {
    const card = column.cards.find((entry) => entry.id === cardId);
    if (card) {
      return {
        column,
        card,
      };
    }
  }

  return null;
}
