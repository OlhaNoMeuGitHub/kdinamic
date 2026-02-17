import { loadMaterialsAssets } from "../../utils.js";

/**
 * @type Material
 * @contracts naming lifecycle events css-system
 */
class UiCommentButtonMaterial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._listenersInitialized = false;
    this._value = 0;
  }

  static get observedAttributes() {
    return ["value"];
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name !== "value") return;

    this._value = this.normalizeValue(newValue);
    this.syncUI();
  }

  async initializeOnce() {
    await loadMaterialsAssets(this, "ui-comment-button-m");

    this._button = this.shadowRoot.querySelector(".ui-comment-button-m-button");
    this._count = this.shadowRoot.querySelector(".ui-comment-button-m-count");

    this.attachListenersOnce();
  }

  onConnected() {
    this._value = this.normalizeValue(this.getAttribute("value"));
    this.syncUI();
  }

  attachListenersOnce() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;

    this._button?.addEventListener("click", () => {
      this.emitIntent("ui-comment-button-m:click");
    });
  }

  emitIntent(eventName) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail: { value: this._value },
      })
    );
  }

  normalizeValue(value) {
    const parsedValue = Number.parseInt(String(value ?? 0), 10);
    if (Number.isNaN(parsedValue)) return 0;
    return Math.max(0, parsedValue);
  }

  syncUI() {
    if (!this._initialized) return;
    if (this._count) this._count.textContent = String(this._value);
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    const normalizedValue = this.normalizeValue(nextValue);
    this._value = normalizedValue;

    if (this.getAttribute("value") !== String(normalizedValue)) {
      this.setAttribute("value", String(normalizedValue));
      return;
    }

    this.syncUI();
  }
}

customElements.define("ui-comment-button-m", UiCommentButtonMaterial);
