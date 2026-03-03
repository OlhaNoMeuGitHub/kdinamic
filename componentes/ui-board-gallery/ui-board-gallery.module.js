function createAbortError() {
  try {
    return new DOMException("The operation was aborted.", "AbortError");
  } catch {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";
    return error;
  }
}

export function createUiBoardGalleryModule({
  store,
  service,
  pollIntervalMs = 5_000,
  maxBackoffMs = 20_000,
  documentRef = globalThis.document,
} = {}) {
  if (!store) {
    throw new Error("Module requires a store.");
  }

  if (!service) {
    throw new Error("Module requires a service.");
  }

  let running = false;
  let timerId = null;
  let activeController = null;
  let inflightPoll = null;
  let retryCount = 0;
  let disposed = false;

  const canObserveVisibility =
    !!documentRef && typeof documentRef.addEventListener === "function";

  const onVisibilityChange = () => {
    if (isPageHidden()) {
      clearScheduledPoll();
      abortActiveRequest();
      setSyncState({
        status: "paused",
        paused: true,
        error: null,
        lastReason: "page-hidden",
      });
      return;
    }

    if (running) {
      void pollNow({ reason: "visibility-resume" }).catch(() => {});
    }
  };

  function isPageHidden() {
    return canObserveVisibility && documentRef.visibilityState === "hidden";
  }

  function setSyncState(patch) {
    store.setState((currentState) => ({
      ...currentState,
      sync: {
        ...currentState.sync,
        ...patch,
      },
    }));
  }

  function commitSnapshot(snapshot, reason) {
    store.setState((currentState) => ({
      ...currentState,
      gallery: snapshot.gallery,
      sync: {
        ...currentState.sync,
        status: "synced",
        paused: false,
        error: null,
        lastReason: reason,
        lastUpdatedAt: snapshot.timestamp || new Date().toISOString(),
        revision: snapshot.revision || currentState.sync.revision,
      },
    }));
  }

  function clearScheduledPoll() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function abortActiveRequest() {
    if (activeController) {
      activeController.abort(createAbortError());
      activeController = null;
    }
  }

  function scheduleNextPoll(delayMs = pollIntervalMs) {
    clearScheduledPoll();

    if (!running || isPageHidden()) {
      return;
    }

    timerId = setTimeout(() => {
      void pollNow({ reason: "interval" }).catch(() => {});
    }, delayMs);
  }

  async function runWithController(job) {
    abortActiveRequest();
    activeController = new AbortController();

    try {
      return await job(activeController.signal);
    } finally {
      activeController = null;
    }
  }

  async function pollNow({ reason = "manual" } = {}) {
    if (disposed) {
      return null;
    }

    if (inflightPoll) {
      return inflightPoll;
    }

    setSyncState({
      status: isPageHidden() ? "paused" : "loading",
      paused: isPageHidden(),
      error: null,
      lastReason: reason,
    });

    inflightPoll = runWithController(async (signal) => {
      try {
        const snapshot = await service.fetchGallery({ signal });
        retryCount = 0;
        commitSnapshot(snapshot, reason);
        scheduleNextPoll();
        return snapshot;
      } catch (error) {
        if (error?.name === "AbortError") {
          setSyncState({
            status: isPageHidden() ? "paused" : "idle",
            paused: isPageHidden(),
          });
          return null;
        }

        retryCount += 1;
        const nextDelay = Math.min(pollIntervalMs * 2 ** retryCount, maxBackoffMs);
        setSyncState({
          status: "error",
          paused: false,
          error: error?.message || "Unknown polling error",
          lastReason: reason,
        });
        scheduleNextPoll(nextDelay);
        throw error;
      } finally {
        inflightPoll = null;
      }
    });

    return inflightPoll;
  }

  function start() {
    if (disposed || running) {
      return;
    }

    running = true;

    if (canObserveVisibility) {
      documentRef.addEventListener("visibilitychange", onVisibilityChange);
    }

    void pollNow({ reason: "start" }).catch(() => {});
  }

  function stop() {
    running = false;
    clearScheduledPoll();
    abortActiveRequest();

    if (canObserveVisibility) {
      documentRef.removeEventListener("visibilitychange", onVisibilityChange);
    }

    setSyncState({
      status: isPageHidden() ? "paused" : "idle",
      paused: isPageHidden(),
      lastReason: "stop",
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }

    stop();
    disposed = true;
  }

  return {
    start,
    stop,
    dispose,
    pollNow,
  };
}
