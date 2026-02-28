const defaultColumns = [
  {
    id: "column-1",
    title: "Inbox",
    items: ["Briefing", "Warm-up"],
  },
  {
    id: "column-2",
    title: "Doing",
    items: ["Shadow UI review", "Polling wiring"],
  },
];

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function createAbortError() {
  try {
    return new DOMException("The operation was aborted.", "AbortError");
  } catch {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";
    return error;
  }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timerId);
      cleanup();
      reject(createAbortError());
    }

    function cleanup() {
      signal?.removeEventListener("abort", onAbort);
    }

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Service request failed with status ${response.status}`);
  }

  return response.json();
}

export function createUiInteractiveCompositeOwnerService({
  mode = "mock",
  baseUrl = "/api/ui-interactive-composite-owner",
  fetchImpl = globalThis.fetch?.bind(globalThis),
  initialColumns = defaultColumns,
} = {}) {
  let mockColumns = cloneValue(initialColumns);
  let revision = 0;

  function buildSnapshot() {
    revision += 1;
    return {
      columns: cloneValue(mockColumns),
      revision,
      timestamp: new Date().toISOString(),
    };
  }

  async function fetchBoard({ signal } = {}) {
    if (mode === "fetch") {
      return requestJson(fetchImpl, baseUrl, { signal });
    }

    await delay(180, signal);
    return buildSnapshot();
  }

  async function createColumn({ signal } = {}) {
    if (mode === "fetch") {
      return requestJson(fetchImpl, baseUrl, {
        method: "POST",
        signal,
      });
    }

    await delay(120, signal);
    const nextIndex = mockColumns.length + 1;
    mockColumns.push({
      id: `column-${Date.now()}-${nextIndex}`,
      title: `Column ${nextIndex}`,
      items: [`Task ${nextIndex}.1`, `Task ${nextIndex}.2`],
    });
    return buildSnapshot();
  }

  async function deleteColumn({ columnId, signal } = {}) {
    if (mode === "fetch") {
      return requestJson(fetchImpl, `${baseUrl}/${columnId}`, {
        method: "DELETE",
        signal,
      });
    }

    await delay(100, signal);
    mockColumns = mockColumns.filter((column) => column.id !== columnId);
    return buildSnapshot();
  }

  async function reorderColumns({ orderedIds, signal } = {}) {
    if (mode === "fetch") {
      return requestJson(fetchImpl, `${baseUrl}/reorder`, {
        method: "POST",
        body: JSON.stringify({ orderedIds }),
        signal,
      });
    }

    await delay(90, signal);
    const orderedSet = new Set(orderedIds);
    const orderedColumns = orderedIds
      .map((id) => mockColumns.find((column) => column.id === id))
      .filter(Boolean);
    const remaining = mockColumns.filter((column) => !orderedSet.has(column.id));
    mockColumns = [...orderedColumns, ...remaining];
    return buildSnapshot();
  }

  return {
    fetchBoard,
    createColumn,
    deleteColumn,
    reorderColumns,
  };
}
