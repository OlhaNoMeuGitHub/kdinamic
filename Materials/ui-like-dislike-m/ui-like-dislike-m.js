import { loadMaterialsAssets } from "../../utils.js";

/**
 * @type Material
 * @contracts naming lifecycle events css-system
 */
class UiLikeDislikeMaterial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._listenersInitialized = false;
    this._value = 0;
  }

  static get observedAttributes() {
    return ["value", "allow-dislike"];
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

    if (name === "value") {
      this._value = this.normalizeValue(newValue);
    }

    this.syncUI();
  }

  async initializeOnce() {
    await loadMaterialsAssets(this, "ui-like-dislike-m");

    this._likeButton = this.shadowRoot.querySelector(".ui-like-dislike-m-like-button");
    this._dislikeButton = this.shadowRoot.querySelector(".ui-like-dislike-m-dislike-button");
    this._count = this.shadowRoot.querySelector(".ui-like-dislike-m-count");

    this.attachListenersOnce();
  }

  onConnected() {
    this._value = this.normalizeValue(this.getAttribute("value"));
    this.syncUI();
  }

  attachListenersOnce() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;

    this._likeButton?.addEventListener("click", () => {
      this.value = this._value + 1;
      this.emitIntent("ui-like-dislike-m:like");
      this.emitIntent("ui-like-dislike-m:change");
    });

    this._dislikeButton?.addEventListener("click", () => {
      if (this._value === 0) return;
      this.value = this._value - 1;
      this.emitIntent("ui-like-dislike-m:dislike");
      this.emitIntent("ui-like-dislike-m:change");
    });
  }

  normalizeValue(value) {
    const parsedValue = Number.parseInt(String(value ?? 0), 10);
    if (Number.isNaN(parsedValue)) return 0;
    return Math.max(0, parsedValue);
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

  syncUI() {
    if (!this._initialized) return;

    if (this._count) this._count.textContent = String(this._value);

    const shouldShowDislike = this.allowDislike && this._value > 0;
    this.setAttribute("data-dislike-visible", shouldShowDislike ? "true" : "false");
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

  get allowDislike() {
    return this.hasAttribute("allow-dislike");
  }

  set allowDislike(value) {
    if (value) this.setAttribute("allow-dislike", "");
    else this.removeAttribute("allow-dislike");
  }
}

customElements.define("ui-like-dislike-m", UiLikeDislikeMaterial);
