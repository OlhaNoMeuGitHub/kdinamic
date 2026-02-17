import {
  loadComponentAssets,
  loadComponentIfNotExists,
  loadMaterialsIfNotExists,
} from "../../utils.js";

class UiColumnRetro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  async initializeOnce() {
    await loadComponentAssets(this, "ui-column-retro");
    await loadComponentIfNotExists("ui-card-retro");
    await loadMaterialsIfNotExists("ui-menu-opcoes-m");

    // Internal state (once)
    this._titleText = "";
    this._isEditingTitle = false;
    this._cardsColor = null;

    // Cache DOM refs
    this._titleEl = this.shadowRoot.querySelector("#ui-column-retro-title");
    this._btnCreateCard = this.shadowRoot.querySelector("#ui-column-retro-create-card");
    this._cardsContainer = this.shadowRoot.querySelector("#ui-column-retro-cards");
    this.addEventListener("ui-column-delete", (e) => {
    
      const columnEl = e.detail?.column;
      if (!columnEl) return;
    
      const shell = columnEl.closest(".ui-board-gallery-column-shell");
      if (shell) shell.remove();
    });

    // Menu material ref (once)
    this._menu = this.shadowRoot.querySelector(".ui-column-retro-menu");

    // Listeners ONCE
    if (this._btnCreateCard) {
      this._btnCreateCard.addEventListener("click", () => this.handleCreateCardClick());
    }

    if (this._titleEl) {
      this._titleEl.addEventListener("click", () => this.handleTitleClick());
    }

    // Configure material actions (component-owned)
    this.configureMenuActions();

    this.updateTitle();
  }

  onConnected() {
    this.updateTitle();
  }

  // ---------------------------
  // Menu (ui-menu-opcoes-m)
  // ---------------------------
  configureMenuActions() {
    if (!this._menu) return;
  
    this._menu.items = [
      {
        text: "Delete column",
        action: () => this.handleDeleteClick(),
      },
      {
        text: "Mudar Cor",
        submenu: [
          { text: "Lavanda", action: () => this.handleChangeColorClick("#E6E6FA") },
          { text: "Salmão", action: () => this.handleChangeColorClick("#FFDAB9") },
          { text: "Menta", action: () => this.handleChangeColorClick("#F5FFFA") },
          { text: "Céu Azul", action: () => this.handleChangeColorClick("#B0E0E6") },
          { text: "Amarelo Pastel", action: () => this.handleChangeColorClick("#FFFACD") },
        ],
      },
    ];
  }
  

  handleDeleteClick() {
    // ✅ Child emits intent. Parent removes shell.
    this.dispatchEvent(
      new CustomEvent("ui-column-delete", {
        bubbles: true,
        composed: true,
        detail: { column: this },
      })
    );
  }

  handleChangeColorClick(color) {
    if (!color) return;
  
    this._cardsColor = color;
    this.applyInheritedColorToCards(color);
  
    this.dispatchEvent(
      new CustomEvent("ui-column-change-color", {
        bubbles: true,
        composed: true,
        detail: { column: this, color },
      })
    );
    
  }
  
  setCardsInheritedColor(color) {
    this._cardsColor = color ?? null;
  
    const shells = this._cardsContainer?.querySelectorAll(".ui-column-retro-card-wrapper") ?? [];
    shells.forEach((shell) => {
      const card = shell.querySelector("ui-card-retro");
      if (card && typeof card.setInheritedColor === "function") {
        card.setInheritedColor(this._cardsColor);
      }
    });
  }

  applyInheritedColorToCards(color) {
    if (!this._cardsContainer) return;
  
    const cards = this._cardsContainer.querySelectorAll("ui-card-retro");
    cards.forEach((card) => this.applyColorToCard(card, color));
  }
  
  
  applyColorToCard(cardEl, color) {
    if (!cardEl || !color) return;
  
    // Choose ONE stable public API in UiCardRetro:
    // Option A: method
    if (typeof cardEl.setInheritedColor === "function") {
      cardEl.setInheritedColor(color);
      return;
    }
  
    // Option B: attribute
    cardEl.setAttribute("inherited-color", color);
  }
  // ---------------------------
  // Public API (property)
  // ---------------------------
  set columnTitle(value) {
    this._titleText = `${value ?? ""}`;
    this.updateTitle();
  }

  get columnTitle() {
    return this._titleText;
  }

  updateTitle() {
    if (this._titleEl) {
      this._titleEl.textContent = this._titleText || "Nova Coluna";
    }
  }

  // ---------------------------
  // Cards (create shell)
  // ---------------------------
  handleCreateCardClick() {
    if (!this._cardsContainer) return;

    // Shell (draggable unit) — drag orchestration is owned by the GALLERY
    const shell = document.createElement("div");
    shell.className = "ui-column-retro-card-wrapper";
    shell.setAttribute("draggable", "true");

    const card = document.createElement("ui-card-retro");
    if (typeof card.setInheritedColor === "function") {
      card.setInheritedColor(this._cardsColor);
      
    }
    shell.appendChild(card);

    this._cardsContainer.appendChild(shell);
  }

  // ---------------------------
  // Minimal public API for Gallery
  // ---------------------------
  getDropZone() {
    return this._cardsContainer;
  }

  // ---------------------------
  // Title editing
  // ---------------------------
  handleTitleClick() {
    if (this._isEditingTitle) return;
    this._isEditingTitle = true;

    const current = this._titleText || "Nova Coluna";

    const input = document.createElement("input");
    input.type = "text";
    input.value = current;
    input.className = "ui-column-retro-title-input";

    if (this._titleEl) this._titleEl.replaceWith(input);
    input.focus();

    const restoreTitle = (text) => {
      const h2 = document.createElement("h2");
      h2.id = "ui-column-retro-title";
      h2.className = "ui-column-retro-title";
      h2.textContent = text;

      input.replaceWith(h2);
      this._titleEl = h2;

      // Re-attach listener to the new element
      this._titleEl.addEventListener("click", () => this.handleTitleClick());

      this._isEditingTitle = false;
    };

    const commit = () => {
      const newTitle = input.value.trim() || "Nova Coluna";
      this._titleText = newTitle;
      restoreTitle(newTitle);
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") restoreTitle(current);
    });
  }
}

customElements.define("ui-column-retro", UiColumnRetro);
