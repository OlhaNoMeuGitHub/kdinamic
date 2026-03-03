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

const defaultGallerySnapshot = {
  gallery: {
    id: "gallery-api-001",
    text: "Gallery sincronizada por polling",
    comments: ["Snapshot entregue pela API mock.", "Edicoes locais somem no proximo ciclo."],
    likes: 12,
    metadata: {
      label: "mock-api",
      color: "#9ad1ff",
    },
    columns: [
      {
        id: "column-backlog",
        text: "Backlog",
        comments: ["Itens aguardando refinamento."],
        likes: 3,
        metadata: {
          label: "entrada",
          color: "#E6E6FA",
        },
        cards: [
          {
            id: "card-b-1",
            text: "Modelar snapshot completo do gallery.",
            comments: ["Incluir comments, likes e metadata."],
            likes: 5,
            metadata: {
              label: "owner: ana",
              color: "",
            },
          },
          {
            id: "card-b-2",
            text: "Garantir overwrite total no proximo poll.",
            comments: ["Nao preservar dirty state compartilhado."],
            likes: 2,
            metadata: {
              label: "owner: dev",
              color: "#FFFACD",
            },
          },
        ],
      },
      {
        id: "column-doing",
        text: "Doing",
        comments: ["Sincronizando store, service e module."],
        likes: 7,
        metadata: {
          label: "execucao",
          color: "#F5FFFA",
        },
        cards: [
          {
            id: "card-d-1",
            text: "Polling a cada 5 segundos com single-flight.",
            comments: ["AbortController pronto para stop/dispose."],
            likes: 8,
            metadata: {
              label: "owner: rafael",
              color: "",
            },
          },
          {
            id: "card-d-2",
            text: "Re-renderizar a arvore inteira a partir do store.",
            comments: ["Gallery -> Columns -> Cards."],
            likes: 4,
            metadata: {
              label: "owner: ui",
              color: "#FFDAB9",
            },
          },
        ],
      },
      {
        id: "column-done",
        text: "Done",
        comments: ["Mock pronto para substituir API real depois."],
        likes: 6,
        metadata: {
          label: "saida",
          color: "#B0E0E6",
        },
        cards: [
          {
            id: "card-f-1",
            text: "Separacao de responsabilidades mantida.",
            comments: ["Service sem DOM.", "Store como fonte unica."],
            likes: 9,
            metadata: {
              label: "owner: arch",
              color: "",
            },
          },
        ],
      },
    ],
  },
};

export function createUiBoardGalleryService({
  mode = "mock",
  baseUrl = "/api/ui-board-gallery",
  fetchImpl = globalThis.fetch?.bind(globalThis),
  snapshot = defaultGallerySnapshot,
} = {}) {
  let revision = 0;

  async function fetchGallery({ signal } = {}) {
    if (mode === "fetch") {
      return requestJson(fetchImpl, baseUrl, { signal });
    }

    await delay(140, signal);
    revision += 1;

    return {
      gallery: cloneValue(snapshot.gallery),
      revision,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    fetchGallery,
  };
}
