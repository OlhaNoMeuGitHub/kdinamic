/**
 * @type LeafComponent
 * @contracts naming lifecycle events css-system
 * @trait leaf-stateful-intent-emitter
 */

// TRAIT: leaf-stateful-intent-emitter
// This canonical demonstrates a leaf-component trait with internal state,
// idempotent lifecycle behavior, and intent emission to the owner.
class UiLeafComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;

    this.text = "";
    this.likes = 0;
  }

  async connectedCallback() {
    // TRAIT: lifecycle-idempotent-mount
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  async initializeOnce() {
    // TRAIT: lazy-template-hydration
    const template = document.createElement("template");
    template.innerHTML = `<link rel="stylesheet" href="./leaf-component.css">${html}`;
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._textarea = this.shadowRoot.querySelector(".ui-leaf-textarea");
    this._textDisplay = this.shadowRoot.querySelector(".ui-leaf-text-display");
    this._likeButton = this.shadowRoot.querySelector(".ui-leaf-like-button");
    this._likeCount = this.shadowRoot.querySelector(".ui-leaf-like-count");

    this.attachListenersOnce();
  }

  attachListenersOnce() {
    // TRAIT: local-state-ownership
    this._textarea?.addEventListener("input", (e) => {
      this.text = e.target.value;
      this.onConnected();
    });

    // TRAIT: intent-event-emitter
    this._likeButton?.addEventListener("click", () => {
      this.likes++;
      this.dispatchEvent(new CustomEvent("ui-leaf:like", { bubbles: true, composed: true }));
      this.onConnected();
    });
  }

  onConnected() {
    if (this._textarea) this._textarea.value = this.text;
    if (this._textDisplay) this._textDisplay.textContent = this.text;

    const mode = this.text === "" ? "edit" : "view";
    this.setAttribute("data-mode", mode);

    if (this._likeCount) this._likeCount.textContent = String(this.likes);
  }
}

customElements.define("ui-leaf-component", UiLeafComponent);
