import { loadComponentAssets, loadMaterialsIfNotExists } from "../../utils.js";

class UiCardRetro extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._userColor = null;
    this._inheritedColor = null;
  }

  static get observedAttributes() {
    return ["text"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text" && oldValue !== newValue) {
      this.text = newValue ?? "";
      this.onConnected();
    }
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  async initializeOnce() {
    this.text = this.getAttribute("text") ?? "";
    this.comments = [];
    this._userColor = this._userColor ?? null;
    this._inheritedColor = this._inheritedColor ?? null;

    await loadComponentAssets(this, "ui-card-retro");

    await loadMaterialsIfNotExists("ui-menu-opcoes-m");
    await loadMaterialsIfNotExists("ui-text-editable-m");
    await loadMaterialsIfNotExists("ui-like-dislike-m");
    await loadMaterialsIfNotExists("ui-comment-button-m");

    this.cacheElements();
    this.attachListenersOnce();
    this.configureMenuOnce();
    this.setAttribute("data-ui-card-retro-comment-panel", "closed");
    this.applyEffectiveColor();
  }

  cacheElements() {
    this.textarea = this.shadowRoot.querySelector(".ui-card-retro-textarea");
    this.textDisplay = this.shadowRoot.querySelector(".ui-card-retro-text-display");

    this.likeMaterial = this.shadowRoot.querySelector("ui-like-dislike-m");

    this.saveButton = this.shadowRoot.querySelector(".ui-card-retro-save-button");
    this.menuOpcoes = this.shadowRoot.querySelector("ui-menu-opcoes-m");

    this.commentMaterial = this.shadowRoot.querySelector("ui-comment-button-m");
    this.commentsDisplayContainer = this.shadowRoot.querySelector(".ui-card-retro-comments-list");

    this.commentInputContainer = this.shadowRoot.querySelector(".ui-card-retro-comment-input-container");
    this.commentTextarea = this.commentInputContainer?.querySelector(".ui-card-retro-comment-textarea");
    this.commentSaveButton = this.commentInputContainer?.querySelector(
      ".ui-card-retro-comment-save-button"
    );
  }

  attachListenersOnce() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;

    if (this.textarea) {
      this.textarea.addEventListener("input", (event) => this.handleTextareaInput(event));
    }

    if (this.saveButton) {
      this.saveButton.addEventListener("click", () => this.handleSaveButtonClick());
    }

    if (this.commentMaterial) {
      this.commentMaterial.addEventListener("ui-comment-button-m:click", () =>
        this.handleCommentButtonClick()
      );
    }

    if (this.commentSaveButton) {
      this.commentSaveButton.addEventListener("click", () =>
        this.saveCommentFunction(this.commentTextarea)
      );
    }
  }

  configureMenuOnce() {
    this.preenchemenu();
  }

  getEffectiveColor() {
    return this._userColor ?? this._inheritedColor ?? "default";
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

  applyEffectiveColor() {
    const colorKey = this.getEffectiveColor();
    this.setAttribute("data-ui-card-retro-effective-color", colorKey);
  }

  setInheritedColor(color) {
    this._inheritedColor = this.getColorKey(color);
    this.applyEffectiveColor();
  }

  clearInheritedColor() {
    this._inheritedColor = null;
    this.applyEffectiveColor();
  }

  setUserColor(color) {
    this._userColor = this.getColorKey(color);
    this.applyEffectiveColor();
  }

  clearUserColor() {
    this._userColor = null;
    this.applyEffectiveColor();
  }

  onConnected() {
    if (!this._initialized) return;

    if (this.textarea) this.textarea.value = this.text;
    if (this.textDisplay) this.textDisplay.textContent = this.text;

    if (this.text === "") {
      this.setTextareaEditable(true);
    } else {
      this.setTextareaEditable(false);
    }

    this.updateCommentCount();
    this.updateUIState();
    this.renderComments();
  }

  handleTextareaInput(event) {
    this.text = event.target.value;
  }

  handleSaveButtonClick() {
    this.setTextareaEditable(false);

    this.updateUIState();

    this.dispatchEvent(
      new CustomEvent("save", {
        detail: { text: this.text },
        bubbles: true,
        composed: true,
      })
    );

    this.updateTextDisplay();
  }

  handleCommentButtonClick() {
    const commentInputContainer = this.shadowRoot.querySelector(".ui-card-retro-comment-input-container");
    const commentTextarea = commentInputContainer?.querySelector(".ui-card-retro-comment-textarea");

    if (!commentInputContainer) {
      console.error("Elemento '.ui-card-retro-comment-input-container' nao encontrado.");
      return;
    }

    const isOpen = this.getAttribute("data-ui-card-retro-comment-panel") === "open";
    const shouldOpen = !isOpen;

    if (shouldOpen) {
      this.setAttribute("data-ui-card-retro-comment-panel", "open");
      if (commentTextarea) commentTextarea.focus();
    } else {
      this.setAttribute("data-ui-card-retro-comment-panel", "closed");
      return;
    }

    this.renderComments();
  }

  saveCommentFunction(commentTextarea) {
    if (!commentTextarea) return;

    const commentText = commentTextarea.value.trim();
    if (!commentText) return;

    this.comments.push(commentText);
    commentTextarea.value = "";
    this.updateCommentCount();
    this.renderComments();
  }

  deleteCommentByIndex(commentIndex) {
    if (commentIndex < 0 || commentIndex >= this.comments.length) return;

    this.comments.splice(commentIndex, 1);
    this.updateCommentCount();
    this.renderComments();
  }

  renderComments() {
    if (!this.commentsDisplayContainer) return;

    this.commentsDisplayContainer.innerHTML = "";
    this.commentsDisplayContainer.hidden = this.comments.length === 0;

    if (this.comments.length === 0) return;

    this.comments.forEach((comment, index) => {
      const commentElement = document.createElement("div");
      commentElement.className = "ui-card-retro-comment";

      const commentTextElement = document.createElement("span");
      commentTextElement.className = "ui-card-retro-comment-text";
      commentTextElement.textContent = comment;

      const deleteCommentButton = document.createElement("button");
      deleteCommentButton.className = "ui-card-retro-delete-comment-button";
      deleteCommentButton.type = "button";
      deleteCommentButton.textContent = "X";
      deleteCommentButton.setAttribute("aria-label", "Deletar comentario");
      deleteCommentButton.addEventListener("click", () => this.deleteCommentByIndex(index));

      commentElement.appendChild(commentTextElement);
      commentElement.appendChild(deleteCommentButton);
      this.commentsDisplayContainer.appendChild(commentElement);
    });
  }

  updateCommentCount() {
    if (!this.commentMaterial) return;
    this.commentMaterial.value = this.comments.length;
  }

  handleEditOption() {
    this.setTextareaEditable(true);
    this.menuOpcoes.classList.remove("visible");
    this.updateUIState();
  }

  handleDeleteOption() {
    this.remove();
  }

  setTextareaEditable(editable) {
    this.textarea.disabled = !editable;
    this.setAttribute("data-ui-card-retro-mode", editable ? "edit" : "view");
    if (editable) this.setAttribute("data-ui-card-retro-comment-panel", "closed");
    this.updateUIState();
  }

  updateTextarea() {
    if (this.textarea) {
      this.textarea.value = this.text;
    }
  }

  preenchemenu() {
    const menuOpcoesItems = [
      {
        text: "Editar",
        action: () => this.handleEditOption(),
      },
      {
        text: "Deletar",
        action: () => this.handleDeleteOption(),
      },
      {
        text: "Mudar Cor",
        submenu: [
          { text: "Usar cor da coluna", action: () => this.clearUserColor() },
          { text: "Lavanda", action: () => this.changeCardBackground("#E6E6FA") },
          { text: "Salm\u00e3o", action: () => this.changeCardBackground("#FFDAB9") },
          { text: "Menta", action: () => this.changeCardBackground("#F5FFFA") },
          { text: "C\u00e9u Azul", action: () => this.changeCardBackground("#B0E0E6") },
          { text: "Amarelo Pastel", action: () => this.changeCardBackground("#FFFACD") },
        ],
      },
    ];

    this.menuOpcoes.items = menuOpcoesItems;
  }

  updateUIState() {
    if (this.textarea.disabled) {
      this.applyEffectiveColor();

      if (this.likeMaterial) {
        this.likeMaterial.hidden = false;
        this.likeMaterial.allowDislike = true;
      }

      if (this.commentMaterial) this.commentMaterial.hidden = false;

      this.menuOpcoes.classList.add("visible");
      return;
    }

    if (this.likeMaterial) {
      this.likeMaterial.hidden = true;
      this.likeMaterial.allowDislike = false;
    }

    if (this.commentMaterial) this.commentMaterial.hidden = true;
    this.menuOpcoes.classList.remove("visible");
  }

  updateTextDisplay() {
    this.textDisplay.textContent = this.text;
  }

  changeCardBackground(color) {
    this.setUserColor(color);
  }
}

customElements.define("ui-card-retro", UiCardRetro);
