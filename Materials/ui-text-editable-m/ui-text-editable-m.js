import { loadMaterialsAssets } from "../../utils.js";

class UiTextEditableMaterial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.onSaveCallback = null;
    this.text = "";

    await loadMaterialsAssets(this, "ui-text-editable-m");

    this._textDisplay = this.shadowRoot.querySelector(".texteditable-display");
    this._textarea = this.shadowRoot.querySelector(".texteditable-textarea");
    this._editButton = this.shadowRoot.querySelector(".edit-texteditable-button");
    this._saveButton = this.shadowRoot.querySelector(".save-texteditable-button");

    this._editButton?.addEventListener("click", () => {
      this.toggleEditMode(true, this._textDisplay, this._textarea, this._editButton, this._saveButton);
    });

    this._saveButton?.addEventListener("click", () => {
      this.saveText(this._textDisplay, this._textarea, this._editButton, this._saveButton);
    });

    this.renderText();
  }

  // ✅ Public API (required)
  getNativeElement() {
    return this._textarea;
  }

  focus() {
    this.getNativeElement()?.focus();
  }

  get value() {
    return this.getNativeElement()?.value ?? "";
  }

  set value(v) {
    const el = this.getNativeElement();
    if (el) el.value = v ?? "";
  }

  set onSave(fn) {
    this.onSaveCallback = fn;
  }

  setText(newText) {
    this.text = newText ?? "";
    this.renderText();
  }

  renderText() {
    if (!this._textDisplay || !this._textarea) return;
    this._textDisplay.textContent = this.text;
    this._textarea.value = this.text;
  }

  toggleEditMode(isEditing, textDisplay, textarea, editButton, saveButton) {
    if (!textDisplay || !textarea || !editButton || !saveButton) return;

    if (isEditing) {
      this.toggleVisibility(textarea, "show");
      this.toggleVisibility(textDisplay, "hide");
      this.toggleVisibility(editButton, "hide");
      this.toggleVisibility(saveButton, "show");
      textarea.value = textDisplay.textContent;
    } else {
      this.toggleVisibility(textarea, "hide");
      this.toggleVisibility(textDisplay, "show");
      this.toggleVisibility(editButton, "show");
      this.toggleVisibility(saveButton, "hide");
    }
  }

  saveText(textDisplay, textarea, editButton, saveButton) {
    if (!textDisplay || !textarea) return;

    textDisplay.textContent = textarea.value;
    this.toggleEditMode(false, textDisplay, textarea, editButton, saveButton);

    if (typeof this.onSaveCallback === "function") {
      this.onSaveCallback(textarea.value);
    }

    // keep internal state consistent
    this.text = textarea.value;
  }

  toggleVisibility(element, action) {
    if (!element) return;

    if (action === "hide") {
      element.style.display = "none";
    } else if (action === "show") {
      element.style.display = "";
    } else {
      element.classList.toggle("hidden");
    }
  }
}

customElements.define("ui-text-editable-m", UiTextEditableMaterial);
