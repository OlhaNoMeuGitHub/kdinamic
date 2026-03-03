import {
  loadComponentAssets,
  loadComponentIfNotExists,
  loadMaterialsIfNotExists,
} from "../../utils.js";
import { selectColumnById } from "../ui-board-gallery/ui-board-gallery.store.js";

class UiColumnRetro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._columnId = null;
    this._store = null;
    this._unsubscribeStore = null;
    this._cardShellById = new Map();
    this._lastRenderedRevision = 0;
    this._isEditingTitle = false;
  }

  set columnId(value) {
    this._columnId = value;
    this.renderFromStore();
  }

  get columnId() {
    return this._columnId;
  }

  set store(value) {
    if (this._store === value) {
      return;
    }

    this._unsubscribeStore?.();
    this._store = value;
    this.bindStore();
  }

  get store() {
    return this._store;
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }

    this.bindStore();
    this.renderFromStore();
  }

  disconnectedCallback() {
    this._unsubscribeStore?.();
    this._unsubscribeStore = null;
  }

  async initializeOnce() {
    await loadComponentAssets(this, "ui-column-retro");
    await loadComponentIfNotExists("ui-card-retro");
    await loadMaterialsIfNotExists("ui-menu-opcoes-m");

    this._titleEl = this.shadowRoot.querySelector("#ui-column-retro-title");
    this._btnCreateCard = this.shadowRoot.querySelector("#ui-column-retro-create-card");
    this._cardsContainer = this.shadowRoot.querySelector("#ui-column-retro-cards");
    this._menu = this.shadowRoot.querySelector(".ui-column-retro-menu");

    this.attachListenersOnce();
    this.configureMenuActions();
  }

  attachListenersOnce() {
    if (this._listenersAttached) {
      return;
    }

    this._listenersAttached = true;

    this._btnCreateCard?.addEventListener("click", () => {
      this.emitIntent("ui-column-retro:create-card", {
        columnId: this._columnId,
      });
    });

    this._titleEl?.addEventListener("click", () => this.startTitleEdit());
  }

  configureMenuActions() {
    if (!this._menu) {
      return;
    }

    this._menu.items = [
      {
        text: "Delete column",
        action: () =>
          this.emitIntent("ui-column-retro:delete", {
            columnId: this._columnId,
          }),
      },
      {
        text: "Mudar Cor",
        submenu: [
          { text: "Limpar", action: () => this.updateColumnColor("") },
          { text: "Lavanda", action: () => this.updateColumnColor("#E6E6FA") },
          { text: "Salmao", action: () => this.updateColumnColor("#FFDAB9") },
          { text: "Menta", action: () => this.updateColumnColor("#F5FFFA") },
          { text: "Ceu Azul", action: () => this.updateColumnColor("#B0E0E6") },
          { text: "Amarelo Pastel", action: () => this.updateColumnColor("#FFFACD") },
        ],
      },
    ];
  }

  updateColumnColor(color) {
    this.emitIntent("ui-column-retro:update", {
      columnId: this._columnId,
      patch: {
        metadata: {
          color: color ?? "",
        },
      },
    });
  }

  bindStore() {
    if (!this.isConnected || !this._initialized || !this._store?.subscribe) {
      return;
    }

    this._unsubscribeStore?.();
    this._unsubscribeStore = this._store.subscribe(() => this.renderFromStore());
  }

  renderFromStore() {
    if (!this._initialized) {
      return;
    }

    const state = this._store?.getState?.();
    const column = state ? selectColumnById(state, this._columnId) : null;
    this._lastRenderedRevision = state?.sync?.revision || 0;

    if (!column) {
      if (this._titleEl) {
        this._titleEl.textContent = "Coluna removida";
      }
      if (this._cardsContainer) {
        this._cardsContainer.innerHTML = "";
      }
      return;
    }

    if (this._titleEl && !this._isEditingTitle) {
      this._titleEl.textContent = column.text || "Nova Coluna";
      this._titleEl.title = column.id || "";
    }

    this.syncCards(column.cards || []);
  }

  syncCards(cards) {
    if (!this._cardsContainer) {
      return;
    }

    const desiredIds = new Set(cards.map((card) => card.id));

    for (const [cardId, shell] of this._cardShellById.entries()) {
      if (!desiredIds.has(cardId)) {
        shell.remove();
        this._cardShellById.delete(cardId);
      }
    }

    cards.forEach((card) => {
      let shell = this._cardShellById.get(card.id);
      if (!shell) {
        shell = this.createCardShell(card.id);
        this._cardShellById.set(card.id, shell);
      }

      shell.dataset.cardId = card.id;
      shell.dataset.columnId = this._columnId || "";

      const cardElement = shell.querySelector("ui-card-retro");
      if (cardElement) {
        cardElement.store = this._store;
        cardElement.columnId = this._columnId;
        cardElement.cardId = card.id;
      }

      this._cardsContainer.appendChild(shell);
    });
  }

  createCardShell(cardId) {
    const shell = document.createElement("div");
    shell.className = "ui-column-retro-card-wrapper";
    shell.dataset.cardId = cardId;
    shell.dataset.columnId = this._columnId || "";
    shell.setAttribute("draggable", "true");

    const card = document.createElement("ui-card-retro");
    card.store = this._store;
    card.columnId = this._columnId;
    card.cardId = cardId;

    shell.appendChild(card);
    return shell;
  }

  startTitleEdit() {
    if (this._isEditingTitle || !this._titleEl) {
      return;
    }

    this._isEditingTitle = true;

    const currentTitle = this._titleEl.textContent || "Nova Coluna";
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentTitle;
    input.className = "ui-column-retro-title-input";

    this._titleEl.replaceWith(input);
    input.focus();

    const restoreTitle = (text) => {
      const title = document.createElement("h2");
      title.id = "ui-column-retro-title";
      title.className = "ui-column-retro-title";
      title.textContent = text;
      title.title = this._columnId || "";
      title.addEventListener("click", () => this.startTitleEdit());

      input.replaceWith(title);
      this._titleEl = title;
      this._isEditingTitle = false;
    };

    const commit = () => {
      const nextText = `${input.value ?? ""}`.trim() || currentTitle;
      this.emitIntent("ui-column-retro:update", {
        columnId: this._columnId,
        patch: {
          text: nextText,
        },
      });
      restoreTitle(nextText);
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        commit();
      }

      if (event.key === "Escape") {
        restoreTitle(currentTitle);
      }
    });
  }

  getDropZone() {
    return this._cardsContainer;
  }

  getCardShellFromEvent(event) {
    return this.findInComposedPath(event, (element) =>
      element?.classList?.contains("ui-column-retro-card-wrapper")
    );
  }

  getCardDragAfter(y, excludedShell = null) {
    const cards = [...(this._cardsContainer?.querySelectorAll(".ui-column-retro-card-wrapper") ?? [])].filter(
      (shell) => shell !== excludedShell
    );

    return cards.reduce(
      (closest, shell) => {
        const box = shell.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: shell };
        }

        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  emitIntent(eventName, detail) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail,
      })
    );
  }

  findInComposedPath(event, predicate) {
    const path = event.composedPath?.() || [];
    for (const element of path) {
      if (predicate(element)) {
        return element;
      }
    }

    return null;
  }
}

if (!customElements.get("ui-column-retro")) {
  customElements.define("ui-column-retro", UiColumnRetro);
}
