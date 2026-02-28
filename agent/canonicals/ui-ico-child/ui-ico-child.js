import { loadCanonicalAssets } from "../_shared/load-canonical-assets.js";
import { selectColumnById } from "../ui-interactive-composite-owner/ui-interactive-composite-owner.store.js";

class UiIcoChild extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._columnId = null;
    this._store = null;
    this._unsubscribeStore = null;
  }

  set columnId(value) {
    this._columnId = value;
    this.renderFromStore();
  }

  get columnId() {
    return this._columnId;
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
    await loadCanonicalAssets(this, import.meta.url, "ui-ico-child");

    this._title = this.shadowRoot.querySelector(".ui-ico-child-title");
    this._meta = this.shadowRoot.querySelector(".ui-ico-child-meta");
    this._sync = this.shadowRoot.querySelector(".ui-ico-child-sync");
    this._items = this.shadowRoot.querySelector(".ui-ico-child-items");
    this._btnDelete = this.shadowRoot.querySelector("#ui-ico-child-delete");

    this._btnDelete?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ui-ico-child:delete", {
          bubbles: true,
          composed: true,
          detail: {
            columnId: this._columnId,
            child: this,
          },
        })
      );
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

    if (!column) {
      if (this._title) this._title.textContent = "Removed";
      if (this._meta) this._meta.textContent = "Waiting for store data";
      if (this._sync) this._sync.textContent = "State source unavailable";
      if (this._items) this._items.innerHTML = "";
      return;
    }

    if (this._title) this._title.textContent = column.title;
    if (this._meta) this._meta.textContent = `${column.items.length} shared items`;

    const lastUpdatedAt = state.sync.lastUpdatedAt
      ? new Date(state.sync.lastUpdatedAt).toLocaleTimeString()
      : "never";

    if (this._sync) {
      this._sync.textContent = `${state.sync.status} via ${state.sync.lastReason} at ${lastUpdatedAt}`;
    }

    if (this._items) {
      this._items.innerHTML = column.items
        .map((item) => `<li class="ui-ico-child-item">${item}</li>`)
        .join("");
    }
  }
}

if (!customElements.get("ui-ico-child")) {
  customElements.define("ui-ico-child", UiIcoChild);
}
