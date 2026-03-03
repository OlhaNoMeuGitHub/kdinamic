import { loadComponentAssets, loadMaterialsIfNotExists } from "../../utils.js";
import {
  selectCardById,
  selectColumnById,
} from "../ui-board-gallery/ui-board-gallery.store.js";

class UiCardRetro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._columnId = null;
    this._cardId = null;
    this._store = null;
    this._unsubscribeStore = null;
    this._mode = "view";
    this._commentPanelOpen = false;
    this._draftText = "";
    this._lastRenderedRevision = 0;
  }

  set columnId(value) {
    this._columnId = value;
    this.renderFromStore();
  }

  get columnId() {
    return this._columnId;
  }

  set cardId(value) {
    this._cardId = value;
    this.renderFromStore();
  }

  get cardId() {
    return this._cardId;
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
    await loadComponentAssets(this, "ui-card-retro");
    await loadMaterialsIfNotExists("ui-menu-opcoes-m");
    await loadMaterialsIfNotExists("ui-like-dislike-m");
    await loadMaterialsIfNotExists("ui-comment-button-m");

    this._textarea = this.shadowRoot.querySelector(".ui-card-retro-textarea");
    this._textDisplay = this.shadowRoot.querySelector(".ui-card-retro-text-display");
    this._likeMaterial = this.shadowRoot.querySelector("ui-like-dislike-m");
    this._saveButton = this.shadowRoot.querySelector(".ui-card-retro-save-button");
    this._menu = this.shadowRoot.querySelector("ui-menu-opcoes-m");
    this._commentMaterial = this.shadowRoot.querySelector("ui-comment-button-m");
    this._commentsList = this.shadowRoot.querySelector(".ui-card-retro-comments-list");
    this._commentTextarea = this.shadowRoot.querySelector(".ui-card-retro-comment-textarea");
    this._commentSaveButton = this.shadowRoot.querySelector(".ui-card-retro-comment-save-button");

    this.attachListenersOnce();
    this.configureMenuOnce();
    this.syncUiChrome();
  }

  attachListenersOnce() {
    if (this._listenersAttached) {
      return;
    }

    this._listenersAttached = true;

    this._textarea?.addEventListener("input", (event) => {
      this._draftText = event.target.value;
    });

    this._saveButton?.addEventListener("click", () => {
      this.emitIntent("ui-card-retro:update", {
        columnId: this._columnId,
        cardId: this._cardId,
        patch: {
          text: this._draftText,
        },
      });
      this.setMode("view");
    });

    this._likeMaterial?.addEventListener("ui-like-dislike-m:change", (event) => {
      this.emitIntent("ui-card-retro:update", {
        columnId: this._columnId,
        cardId: this._cardId,
        patch: {
          likes: Math.max(0, Number(event.detail?.value ?? 0)),
        },
      });
    });

    this._commentMaterial?.addEventListener("ui-comment-button-m:click", () => {
      this._commentPanelOpen = !this._commentPanelOpen;
      this.syncUiChrome();
      if (this._commentPanelOpen) {
        this._commentTextarea?.focus();
      }
    });

    this._commentSaveButton?.addEventListener("click", () => {
      const value = `${this._commentTextarea?.value ?? ""}`.trim();
      if (!value) {
        return;
      }

      this.emitIntent("ui-card-retro:add-comment", {
        columnId: this._columnId,
        cardId: this._cardId,
        value,
      });

      if (this._commentTextarea) {
        this._commentTextarea.value = "";
      }
    });
  }

  configureMenuOnce() {
    if (!this._menu) {
      return;
    }

    this._menu.items = [
      {
        text: "Editar",
        action: () => {
          this.setMode("edit");
          this._textarea?.focus();
        },
      },
      {
        text: "Deletar",
        action: () =>
          this.emitIntent("ui-card-retro:delete", {
            columnId: this._columnId,
            cardId: this._cardId,
          }),
      },
      {
        text: "Mudar Cor",
        submenu: [
          { text: "Usar cor da coluna", action: () => this.updateColor("") },
          { text: "Lavanda", action: () => this.updateColor("#E6E6FA") },
          { text: "Salmao", action: () => this.updateColor("#FFDAB9") },
          { text: "Menta", action: () => this.updateColor("#F5FFFA") },
          { text: "Ceu Azul", action: () => this.updateColor("#B0E0E6") },
          { text: "Amarelo Pastel", action: () => this.updateColor("#FFFACD") },
        ],
      },
    ];
  }

  updateColor(color) {
    this.emitIntent("ui-card-retro:update", {
      columnId: this._columnId,
      cardId: this._cardId,
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
    const card = state ? selectCardById(state, this._columnId, this._cardId) : null;
    const currentRevision = state?.sync?.revision || 0;
    const forceSync = currentRevision !== this._lastRenderedRevision;

    if (!card) {
      if (this._textDisplay) {
        this._textDisplay.textContent = "Card removido";
      }
      if (this._textarea) {
        this._textarea.value = "";
      }
      if (this._commentsList) {
        this._commentsList.innerHTML = "";
      }
      if (this._likeMaterial) {
        this._likeMaterial.value = 0;
      }
      return;
    }

    if (forceSync) {
      this._draftText = card.text || "";
      this._mode = card.text ? "view" : "edit";
      this._commentPanelOpen = false;
    } else if (this._mode !== "edit") {
      this._draftText = card.text || "";
    }

    if (this._textarea && this._mode !== "edit") {
      this._textarea.value = card.text || "";
    } else if (this._textarea && forceSync) {
      this._textarea.value = this._draftText;
    }

    if (this._textDisplay) {
      this._textDisplay.textContent = card.text || "";
    }

    if (this._likeMaterial) {
      this._likeMaterial.value = card.likes || 0;
      this._likeMaterial.allowDislike = true;
    }

    if (this._commentMaterial) {
      this._commentMaterial.value = (card.comments || []).length;
    }

    this.renderComments(card.comments || []);
    this.applyEffectiveColor(card.metadata?.color || "", column?.metadata?.color || "");
    this.syncUiChrome();
    this._lastRenderedRevision = currentRevision;
  }

  renderComments(comments) {
    if (!this._commentsList) {
      return;
    }

    this._commentsList.innerHTML = "";
    this._commentsList.hidden = comments.length === 0;

    if (!comments.length) {
      return;
    }

    comments.forEach((comment, index) => {
      const commentElement = document.createElement("div");
      commentElement.className = "ui-card-retro-comment";

      const commentText = document.createElement("span");
      commentText.className = "ui-card-retro-comment-text";
      commentText.textContent = comment;

      const deleteCommentButton = document.createElement("button");
      deleteCommentButton.className = "ui-card-retro-delete-comment-button";
      deleteCommentButton.type = "button";
      deleteCommentButton.textContent = "X";
      deleteCommentButton.setAttribute("aria-label", "Deletar comentario");
      deleteCommentButton.addEventListener("click", () => {
        this.emitIntent("ui-card-retro:delete-comment", {
          columnId: this._columnId,
          cardId: this._cardId,
          commentIndex: index,
        });
      });

      commentElement.append(commentText, deleteCommentButton);
      this._commentsList.appendChild(commentElement);
    });
  }

  syncUiChrome() {
    this.setAttribute("data-ui-card-retro-mode", this._mode);
    this.setAttribute(
      "data-ui-card-retro-comment-panel",
      this._commentPanelOpen ? "open" : "closed"
    );

    if (this._likeMaterial) {
      this._likeMaterial.hidden = this._mode !== "view";
    }

    if (this._commentMaterial) {
      this._commentMaterial.hidden = this._mode !== "view";
    }
  }

  setMode(mode) {
    this._mode = mode;
    this.syncUiChrome();
  }

  applyEffectiveColor(userColor, inheritedColor) {
    const colorKey = this.getColorKey(userColor || inheritedColor);
    this.setAttribute("data-ui-card-retro-effective-color", colorKey);
  }

  getColorKey(color) {
    const normalizedColor = `${color ?? ""}`.trim().toUpperCase();
    const colorMap = {
      "#E6E6FA": "lavanda",
      "#FFDAB9": "salmao",
      "#F5FFFA": "menta",
      "#B0E0E6": "ceu-azul",
      "#FFFACD": "amarelo-pastel",
    };
    return colorMap[normalizedColor] ?? "default";
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
}

if (!customElements.get("ui-card-retro")) {
  customElements.define("ui-card-retro", UiCardRetro);
}
