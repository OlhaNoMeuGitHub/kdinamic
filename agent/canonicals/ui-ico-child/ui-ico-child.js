import { loadComponentAssets } from "../../utils.js";

/**
 * Child stub for canonical InteractiveCompositeOwner.
 *
 * @type LeafComponent
 * @contracts naming lifecycle events css-system
 *
 * Responsibilities:
 * - exposes getDropZone() API
 * - emits intent events (delete)
 * - does NOT orchestrate cross-component drag
 */
class UiIcoChild extends HTMLElement {
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
    await loadComponentAssets(this, "ui-ico-child");

    this._dropZone = this.shadowRoot.querySelector(".ui-ico-child-dropzone");
    this._btnDelete = this.shadowRoot.querySelector("#ui-ico-child-delete");

    this._btnDelete?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ui-ico-child:delete", {
          bubbles: true,
          composed: true,
          detail: { child: this },
        })
      );
    });
  }

  onConnected() {}

  getDropZone() {
    return this._dropZone;
  }
}

customElements.define("ui-ico-child", UiIcoChild);
