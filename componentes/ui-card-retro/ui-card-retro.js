import { loadComponentAssets, loadComponentIfNotExists, loadMaterialsIfNotExists } from "../../utils.js";
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
        // safe even before initialized
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
      // state init ONCE
      this.likes = 0;
      this.text = this.getAttribute("text") ?? "";
      this.color = "#f9f9f9";
      this.comments = [];
      this._userColor = this._userColor ?? null;
      this._inheritedColor = this._inheritedColor ?? null;
  
      await loadComponentAssets(this, "ui-card-retro");
  
      // materials (if you have this helper)
      await loadMaterialsIfNotExists("ui-menu-opcoes-m");
      await loadMaterialsIfNotExists("ui-text-editable-m");
  
      this.cacheElements();
      this.attachListenersOnce();
      this.configureMenuOnce();
    }
  
    cacheElements() {
      this.textarea = this.shadowRoot.querySelector("textarea");
      this.textDisplay = this.shadowRoot.querySelector(".text-display");
  
      this.likeButton = this.shadowRoot.querySelector(".like-button");
      this.likeCount = this.shadowRoot.querySelector(".like-count");
  
      this.saveButton = this.shadowRoot.querySelector(".save-button");
  
      // ✅ updated tag: material tag
      this.menuOpcoes = this.shadowRoot.querySelector("ui-menu-opcoes-m");
  
      this.cardContainer = this.shadowRoot.querySelector(".card-container");
  
      this.commentButton = this.shadowRoot.querySelector(".comment-button");
      this.commentSection = this.shadowRoot.querySelector(".comment-section");
      this.commentsDisplayContainer = this.shadowRoot.querySelector(".comments-display-container");
  
      this.commentInputContainer = this.shadowRoot.querySelector(".comment-input-container");
      this.commentTextarea = this.commentInputContainer?.querySelector(".comment-textarea");
    }
  
    attachListenersOnce() {
      if (this._listenersInitialized) return;
      this._listenersInitialized = true;
  
      if (this.textarea) {
        this.textarea.addEventListener("input", (e) => this.handleTextareaInput(e));
      }
  
      if (this.likeButton) {
        this.likeButton.addEventListener("click", () => this.handleLikeButtonClick());
      }
  
      if (this.saveButton) {
        this.saveButton.addEventListener("click", () => this.handleSaveButtonClick());
      }
  
      if (this.commentButton) {
        this.commentButton.addEventListener("click", () => this.handleCommentButtonClick());
      }
  
      if (this.commentTextarea) {
        this.commentTextarea.addEventListener("input", () => this.handleAjustHighComment());
      }
    }
  
    configureMenuOnce() {
      // menu items are configuration (one-time)
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
      // IMPORTANT: do NOT overwrite _userColor here
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
      // Runs every time the element is connected OR text attribute changes.
      // Must be safe to call multiple times.
  
      if (!this._initialized) return; // attributeChangedCallback may call early
  
      // Sync text -> UI
      if (this.textarea) this.textarea.value = this.text;
      if (this.textDisplay) this.textDisplay.textContent = this.text;
  
      // Decide editable state based on current text
      if (this.text === "") {
        this.setTextareaEditable(true);
      } else {
        this.setTextareaEditable(false);
      }
  
      // Ensure counts and state are reflected
      if (this.likeCount) this.likeCount.textContent = `${this.likes}`;
  
      this.updateUIState();
      this.renderComments(); // safe if you implement it idempotently
    }
    handleTextareaInput(event) {
        this.text = event.target.value;
    }

    handleLikeButtonClick() {
        this.likes++;
        this.likeCount.textContent = `${this.likes}`;
    }

    handleAjustHighComment() {
        this.style.height = "auto"; // Redefine a altura
            this.style.height = `${this.scrollHeight}px`; // Ajusta para o conteúdo
    }

    handleSaveButtonClick() {
        this.setTextareaEditable(false);

        this.updateUIState();

        this.dispatchEvent(new CustomEvent("save", {
            detail: { text: this.text },
            bubbles: true,
            composed: true,
        }));
        this.updateTextDisplay();
    }
    handleCommentButtonClick() {
        const commentInputContainer = this.shadowRoot.querySelector(".comment-input-container");
        const commentSection = this.shadowRoot.querySelector(".comment-section");
        const commentTextarea = commentInputContainer.querySelector(".comment-textarea");
        if (!commentInputContainer) {
            console.error("Elemento 'comment-input-container' não encontrado.");
            return;
        }
    
        // Alterna o estado do display entre "none" e "flex"
        if (commentInputContainer.style.display === "none" || !commentInputContainer.style.display || commentSection.style.display === "none") {
            commentInputContainer.style.display = "flex"; // Torna visível
            commentSection.style.display = "block"
            if (commentTextarea) {
                commentTextarea.focus(); // Move o foco para o textarea
            }
        } else {
            commentSection.style.display = "none"; // Esconde o container
            commentInputContainer.style.display = "none";
            return // Esconde o container
        }
    
        // Configura o botão de salvar sem alterar o estado do display ao salvar
        

        const saveCommentButton = commentInputContainer.querySelector(".save-comment-button");
    
        if (saveCommentButton) {
            saveCommentButton.onclick = () => this.saveCommentFunction(commentTextarea)
    
        }
        this.renderComments();
    }

    saveCommentFunction(commentTextarea) {
        const commentText = commentTextarea.value.trim();
        if (commentText) {
            this.comments.push(commentText); // Adiciona o comentário
            commentTextarea.value = ""; // Limpa o campo
            this.renderComments();
        }
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
        this.textarea.style.display = editable ? "block" : "none"; // Mostra ou oculta o textarea
        this.textDisplay.style.display = editable ? "none" : "block"; // Mostra ou oculta a div
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
                { text: "Salmão", action: () => this.changeCardBackground("#FFDAB9") },
                { text: "Menta", action: () => this.changeCardBackground("#F5FFFA") },
                { text: "Céu Azul", action: () => this.changeCardBackground("#B0E0E6") },
                { text: "Amarelo Pastel", action: () => this.changeCardBackground("#FFFACD") },
              ],
            },
            
        ];
        this.menuOpcoes.items = menuOpcoesItems;
    }
    

    updateUIState() {
        if (this.textarea.disabled) {
            // Modo bloqueado
            this.cardContainer.style.backgroundColor = this.getEffectiveColor();
            this.applyEffectiveColor();
            this.likeButton.style.display = "inline-block";
            this.commentButton.style.display = "inline-block";
            this.likeCount.style.display = "inline-block";
            this.saveButton.style.display = "none";
            this.menuOpcoes.classList.add("visible");
        } else {
            // Modo editável
            this.cardContainer.style.backgroundColor = "#ffffff";
            this.likeButton.style.display = "none";
            this.likeCount.style.display = "none";
            this.commentButton.style.display = "none";
        }
    }

    updateTextDisplay() {
        this.textDisplay.textContent = this.text; // Define o texto na div
    }

    changeCardBackground(color) {
      this.setUserColor(color);
    }
}

// Registra o componente
customElements.define("ui-card-retro", UiCardRetro);
