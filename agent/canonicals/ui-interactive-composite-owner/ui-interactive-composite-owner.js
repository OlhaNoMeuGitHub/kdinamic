import { loadCanonicalAssets } from "../_shared/load-canonical-assets.js";
import "../ui-ico-child/ui-ico-child.js";
import { createUiInteractiveCompositeOwnerModule } from "./ui-interactive-composite-owner.module.js";
import { createUiInteractiveCompositeOwnerService } from "./ui-interactive-composite-owner.service.js";
import { createUiInteractiveCompositeOwnerStore } from "./ui-interactive-composite-owner.store.js";

class UiInteractiveCompositeOwner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._unsubscribeStore = null;
    this._shellById = new Map();
    this._draggingShell = null;
    this._shellPlaceholder = null;
    this._store = null;
    this._service = null;
    this._module = null;
    this._ownsModule = false;
  }

  set store(value) {
    this._store = value;
    this.bindStore();
  }

  set service(value) {
    this._service = value;
  }

  set module(value) {
    this._module = value;
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }

    this.ensureDependencies();
    this.bindStore();
    this._module?.start();
  }

  disconnectedCallback() {
    this._unsubscribeStore?.();
    this._unsubscribeStore = null;

    if (this._ownsModule) {
      this._module?.dispose?.();
    }
  }

  async initializeOnce() {
    await loadCanonicalAssets(this, import.meta.url, "ui-interactive-composite-owner");

    this._board = this.shadowRoot.querySelector("#ui-interactive-composite-owner-board");
    this._status = this.shadowRoot.querySelector("#ui-interactive-composite-owner-status");
    this._reason = this.shadowRoot.querySelector("#ui-interactive-composite-owner-reason");
    this._updated = this.shadowRoot.querySelector("#ui-interactive-composite-owner-updated");
    this._btnAdd = this.shadowRoot.querySelector("#ui-interactive-composite-owner-add-child");
    this._btnRefresh = this.shadowRoot.querySelector("#ui-interactive-composite-owner-refresh");

    this._btnAdd?.addEventListener("click", () => {
      void this._module?.createColumn().catch(() => {});
    });

    this._btnRefresh?.addEventListener("click", () => {
      void this._module?.pollNow({ reason: "manual-refresh" }).catch(() => {});
    });

    this.addEventListener("ui-ico-child:delete", (event) => {
      const columnId = event.detail?.columnId;
      if (!columnId) {
        return;
      }

      void this._module?.deleteColumn({ columnId }).catch(() => {});
    });

    this._board?.addEventListener("dragstart", (event) => this.handleDragStart(event));
    this._board?.addEventListener("dragover", (event) => this.handleDragOver(event));
    this._board?.addEventListener("drop", (event) => this.handleDrop(event));
    this._board?.addEventListener("dragend", () => this.cleanupDrag());
  }

  ensureDependencies() {
    if (!this._store) {
      this._store = createUiInteractiveCompositeOwnerStore();
    }

    if (!this._service) {
      this._service = createUiInteractiveCompositeOwnerService({ mode: "mock" });
    }

    if (!this._module) {
      this._module = createUiInteractiveCompositeOwnerModule({
        store: this._store,
        service: this._service,
      });
      this._ownsModule = true;
    }
  }

  bindStore() {
    if (!this.isConnected || !this._initialized || !this._store?.subscribe) {
      return;
    }

    this._unsubscribeStore?.();
    this._unsubscribeStore = this._store.subscribe((state) => this.renderFromState(state));
  }

  renderFromState(state) {
    if (!this._initialized) {
      return;
    }

    if (this._status) {
      this._status.textContent = `${state.sync.status}${state.sync.paused ? " (paused)" : ""}`;
    }

    if (this._reason) {
      this._reason.textContent = `Reason: ${state.sync.lastReason || "unknown"}`;
    }

    if (this._updated) {
      this._updated.textContent = `Updated: ${
        state.sync.lastUpdatedAt ? new Date(state.sync.lastUpdatedAt).toLocaleTimeString() : "never"
      }`;
    }

    this.syncShells(state.columns);
  }

  syncShells(columns) {
    if (!this._board) {
      return;
    }

    const desiredIds = new Set(columns.map((column) => column.id));

    for (const [columnId, shell] of this._shellById.entries()) {
      if (!desiredIds.has(columnId)) {
        shell.remove();
        this._shellById.delete(columnId);
      }
    }

    columns.forEach((column) => {
      let shell = this._shellById.get(column.id);
      if (!shell) {
        shell = this.createChildShell(column.id);
        this._shellById.set(column.id, shell);
      }

      shell.dataset.columnId = column.id;

      const child = shell.querySelector("ui-ico-child");
      if (child) {
        child.store = this._store;
        child.columnId = column.id;
      }

      this._board.appendChild(shell);
    });
  }

  createChildShell(columnId) {
    const shell = document.createElement("div");
    shell.className = "ui-interactive-composite-owner-shell";
    shell.dataset.columnId = columnId;

    const handle = document.createElement("span");
    handle.className = "ui-interactive-composite-owner-handle";
    handle.textContent = "::::";
    handle.title = "Move shell";
    handle.setAttribute("draggable", "true");

    const child = document.createElement("ui-ico-child");
    child.store = this._store;
    child.columnId = columnId;

    shell.append(handle, child);
    return shell;
  }

  ensureShellPlaceholder() {
    if (this._shellPlaceholder) {
      return this._shellPlaceholder;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "ui-interactive-composite-owner-shell-placeholder";
    this._shellPlaceholder = placeholder;
    return placeholder;
  }

  handleDragStart(event) {
    const handle = event.target?.closest?.(".ui-interactive-composite-owner-handle");
    if (!handle) {
      return;
    }

    const shell = handle.closest(".ui-interactive-composite-owner-shell");
    if (!shell) {
      return;
    }

    this._draggingShell = shell;
    shell.classList.add("ui-interactive-composite-owner-dragging-shell");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", shell.dataset.columnId || "");
  }

  handleDragOver(event) {
    if (!this._draggingShell || !this._board) {
      return;
    }

    event.preventDefault();
    const placeholder = this.ensureShellPlaceholder();
    const afterElement = this.getDragAfterShell(this._board, event.clientX);

    if (afterElement) {
      this._board.insertBefore(placeholder, afterElement);
      return;
    }

    this._board.appendChild(placeholder);
  }

  handleDrop(event) {
    if (!this._draggingShell || !this._board) {
      return;
    }

    event.preventDefault();

    if (this._shellPlaceholder?.parentNode === this._board) {
      this._board.insertBefore(this._draggingShell, this._shellPlaceholder);
    }

    const orderedIds = [...this._board.querySelectorAll(".ui-interactive-composite-owner-shell")]
      .map((shell) => shell.dataset.columnId)
      .filter(Boolean);

    void this._module
      ?.reorderColumns({ orderedIds })
      .catch(() => {})
      .finally(() => this.cleanupDrag());
  }

  cleanupDrag() {
    this._draggingShell?.classList.remove("ui-interactive-composite-owner-dragging-shell");
    this._draggingShell = null;
    this._shellPlaceholder?.remove();
  }

  getDragAfterShell(container, x) {
    const shells = [
      ...container.querySelectorAll(
        ".ui-interactive-composite-owner-shell:not(.ui-interactive-composite-owner-dragging-shell)"
      ),
    ];

    return shells.reduce(
      (closest, shell) => {
        const box = shell.getBoundingClientRect();
        const offset = x - (box.left + box.width / 2);
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: shell };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }
}

if (!customElements.get("ui-interactive-composite-owner")) {
  customElements.define("ui-interactive-composite-owner", UiInteractiveCompositeOwner);
}
