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
    this.color = "#f9f9f9";
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
  }

  cacheElements() {
    this.textarea = this.shadowRoot.querySelector(".card-textarea");
    this.textDisplay = this.shadowRoot.querySelector(".text-display");

    this.likeMaterial = this.shadowRoot.querySelector("ui-like-dislike-m");

    this.saveButton = this.shadowRoot.querySelector(".save-button");
    this.menuOpcoes = this.shadowRoot.querySelector("ui-menu-opcoes-m");

    this.cardContainer = this.shadowRoot.querySelector(".card-container");

    this.commentMaterial = this.shadowRoot.querySelector("ui-comment-button-m");
    this.commentSection = this.shadowRoot.querySelector(".comment-section");
    this.commentsDisplayContainer = this.shadowRoot.querySelector(".comments-display-container");

    this.commentInputContainer = this.shadowRoot.querySelector(".comment-input-container");
    this.commentTextarea = this.commentInputContainer?.querySelector(".comment-textarea");
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

    if (this.commentTextarea) {
      this.commentTextarea.addEventListener("input", () => this.handleAjustHighComment());
    }
  }

  configureMenuOnce() {
    this.preenchemenu();
  }

  getEffectiveColor() {
    return this._userColor ?? this._inheritedColor ?? "#f9f9f9";
  }

  applyEffectiveColor() {
    if (!this._initialized) return;
    if (!this.cardContainer) return;
    this.cardContainer.style.backgroundColor = this.getEffectiveColor();
  }

  setInheritedColor(color) {
    this._inheritedColor = color ?? null;
    this.applyEffectiveColor();
  }

  clearInheritedColor() {
    this._inheritedColor = null;
    this.applyEffectiveColor();
  }

  setUserColor(color) {
    this._userColor = color ?? null;
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

  handleAjustHighComment() {
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
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
    const commentInputContainer = this.shadowRoot.querySelector(".comment-input-container");
    const commentSection = this.shadowRoot.querySelector(".comment-section");
    const commentTextarea = commentInputContainer?.querySelector(".comment-textarea");

    if (!commentInputContainer) {
      console.error("Elemento 'comment-input-container' n\u00e3o encontrado.");
      return;
    }

    const shouldOpen =
      commentInputContainer.style.display === "none" ||
      !commentInputContainer.style.display ||
      commentSection.style.display === "none";

    if (shouldOpen) {
      commentInputContainer.style.display = "flex";
      commentSection.style.display = "block";
      if (commentTextarea) commentTextarea.focus();
    } else {
      commentSection.style.display = "none";
      commentInputContainer.style.display = "none";
      return;
    }

    const saveCommentButton = commentInputContainer.querySelector(".save-comment-button");
    if (saveCommentButton) {
      saveCommentButton.onclick = () => this.saveCommentFunction(commentTextarea);
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

  renderComments() {
    if (!this.commentsDisplayContainer) return;

    this.commentsDisplayContainer.innerHTML = "";

    if (this.comments.length === 0) {
      this.commentsDisplayContainer.style.display = "none";
      return;
    }

    this.commentsDisplayContainer.style.display = "block";

    this.comments.forEach((comment) => {
      const commentElement = document.createElement("div");
      commentElement.className = "comment";
      commentElement.textContent = comment;
      this.commentsDisplayContainer.appendChild(commentElement);
    });
  }

  updateCommentCount() {
    if (!this.commentMaterial) return;
    this.commentMaterial.value = this.comments.length;
  }

  handleEditOption() {
    this.setTextareaEditable(true);
    this.saveButton.style.display = "inline-block";
    this.menuOpcoes.classList.remove("visible");
    this.updateUIState();
  }

  handleDeleteOption() {
    this.remove();
  }

  setTextareaEditable(editable) {
    this.textarea.disabled = !editable;
    this.textarea.style.display = editable ? "block" : "none";
    this.textDisplay.style.display = editable ? "none" : "block";
    this.saveButton.style.display = editable ? "inline-block" : "none";
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
      this.cardContainer.style.backgroundColor = this.getEffectiveColor();
      this.applyEffectiveColor();

      if (this.likeMaterial) {
        this.likeMaterial.hidden = false;
        this.likeMaterial.allowDislike = true;
      }

      if (this.commentMaterial) this.commentMaterial.hidden = false;

      this.saveButton.style.display = "none";
      this.menuOpcoes.classList.add("visible");
      return;
    }

    this.cardContainer.style.backgroundColor = "#ffffff";

    if (this.likeMaterial) {
      this.likeMaterial.hidden = true;
      this.likeMaterial.allowDislike = false;
    }

    if (this.commentMaterial) this.commentMaterial.hidden = true;
  }

  updateTextDisplay() {
    this.textDisplay.textContent = this.text;
  }

  changeCardBackground(color) {
    this.setUserColor(color);
  }
}

customElements.define("ui-card-retro", UiCardRetro);
