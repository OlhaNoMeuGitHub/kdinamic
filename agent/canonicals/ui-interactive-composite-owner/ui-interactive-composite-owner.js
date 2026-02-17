import { loadComponentAssets, loadComponentIfNotExists } from "../../utils.js";

/**
 * Canonical: InteractiveCompositeOwner
 *
 * @type InteractiveCompositeOwner
 * @contracts naming lifecycle events css-system drag-system layout-scroll
 *
 * Demonstrates:
 * - parent owns shells (reorder/movement)
 * - handle drag for shells (host never draggable)
 * - cross-child item drag orchestrated by parent
 * - child exposes drop zone API (getDropZone)
 * - intent events bubble + composed
 */
class UiInteractiveCompositeOwner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;

    // --- drag state: shells (children)
    this._draggingShell = null;
    this._shellPlaceholder = null;

    // --- drag state: items across children
    this._draggingItemShell = null;
    this._itemPlaceholder = null;
    this._activeDropZone = null;
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  async initializeOnce() {
    await loadComponentAssets(this, "ui-interactive-composite-owner");
    await loadComponentIfNotExists("ui-ico-child");

    this._btnAdd = this.shadowRoot.querySelector("#ui-interactive-composite-owner-add-child");
    this._board = this.shadowRoot.querySelector("#ui-interactive-composite-owner-board");

    this._btnAdd?.addEventListener("click", () => this.createChildShell());

    // Owner listens at stable boundary
    this._board?.addEventListener("dragstart", (e) => this.handleAnyDragStart(e));
    this._board?.addEventListener("dragover", (e) => this.handleAnyDragOver(e));
    this._board?.addEventListener("drop", (e) => this.handleAnyDrop(e));
    this._board?.addEventListener("dragend", () => this.handleAnyDragEnd());

    // Example intent from children (delete)
    // Example intent from children (delete)
    // Listen at the highest stable boundary: the host element
    this.addEventListener("ui-ico-child:delete", (e) => this.handleChildDelete(e));
  }

  onConnected() {
    // idempotent; sync state → UI here if you add state
  }

  // ------------------------------------------------------------
  // Parent-owned shells
  // ------------------------------------------------------------
  createChildShell() {
    if (!this._board) return;

    const shell = document.createElement("div");
    shell.className = "ui-interactive-composite-owner-shell";

    const handle = document.createElement("span");
    handle.className = "ui-interactive-composite-owner-handle";
    handle.textContent = "⋮⋮";
    handle.setAttribute("draggable", "true");
    handle.title = "Move shell";

    const child = document.createElement("ui-ico-child");

    shell.appendChild(handle);
    shell.appendChild(child);
    this._board.appendChild(shell);

    // Seed example items in child's drop zone (internal shells are draggable)
    const dropZone = child.getDropZone?.();
    if (!dropZone) return;

    dropZone.appendChild(this.createItemShell("Item A"));
    dropZone.appendChild(this.createItemShell("Item B"));
  }

  handleChildDelete(event) {
    const child = event.detail?.child;
    if (!child) return;
    const shell = child.closest(".ui-interactive-composite-owner-shell");
    shell?.remove();
  }

  // ------------------------------------------------------------
  // Item shells (internal): may be draggable
  // ------------------------------------------------------------
  createItemShell(label) {
    const shell = document.createElement("div");
    shell.className = "ui-ico-child-item-shell";
    shell.setAttribute("draggable", "true");
    shell.textContent = label;
    return shell;
  }

  // ------------------------------------------------------------
  // Drag dispatcher
  // ------------------------------------------------------------
  handleAnyDragStart(event) {
    const handle = event.target?.closest?.(".ui-interactive-composite-owner-handle");
    if (handle) {
      this.handleShellDragStart(event, handle);
      return;
    }

    const itemShell = this.findInComposedPath(event, (el) =>
      el?.classList?.contains?.("ui-ico-child-item-shell")
    );
    if (itemShell) {
      this.handleItemDragStart(event, itemShell);
      return;
    }
  }

  handleAnyDragOver(event) {
    if (this._draggingItemShell) return this.handleItemDragOver(event);
    if (this._draggingShell) return this.handleShellDragOver(event);
  }

  handleAnyDrop(event) {
    if (this._draggingItemShell) return this.handleItemDrop(event);
    if (this._draggingShell) return this.handleShellDrop(event);
  }

  handleAnyDragEnd() {
    this.handleShellDragEnd();
    this.handleItemDragEnd();
  }

  // ------------------------------------------------------------
  // Shell drag (reorder children)
  // ------------------------------------------------------------
  ensureShellPlaceholder() {
    if (this._shellPlaceholder) return this._shellPlaceholder;
    const ph = document.createElement("div");
    ph.className = "ui-interactive-composite-owner-shell-placeholder";
    this._shellPlaceholder = ph;
    return ph;
  }

  handleShellDragStart(event, handleEl) {
    const shell = handleEl.closest(".ui-interactive-composite-owner-shell");
    if (!shell) return;

    this._draggingShell = shell;
    shell.classList.add("ui-interactive-composite-owner-dragging-shell");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "");
  }

  handleShellDragOver(event) {
    if (!this._draggingShell || !this._board) return;
    event.preventDefault();

    const placeholder = this.ensureShellPlaceholder();
    const afterEl = this.getDragAfterShell(this._board, event.clientX);

    if (afterEl == null) this._board.appendChild(placeholder);
    else this._board.insertBefore(placeholder, afterEl);
  }

  handleShellDrop(event) {
    if (!this._draggingShell || !this._board) return;
    event.preventDefault();

    const placeholder = this._shellPlaceholder;
    if (placeholder && placeholder.parentNode === this._board) {
      this._board.insertBefore(this._draggingShell, placeholder);
      placeholder.remove();
    }

    this._draggingShell.classList.remove("ui-interactive-composite-owner-dragging-shell");
    this._draggingShell = null;
  }

  handleShellDragEnd() {
    if (this._draggingShell) {
      this._draggingShell.classList.remove("ui-interactive-composite-owner-dragging-shell");
      this._draggingShell = null;
    }
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
        if (offset < 0 && offset > closest.offset) return { offset, element: shell };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  // ------------------------------------------------------------
  // Item drag (cross-child)
  // ------------------------------------------------------------
  ensureItemPlaceholder() {
    if (this._itemPlaceholder) return this._itemPlaceholder;
    const ph = document.createElement("div");
    ph.className = "ui-interactive-composite-owner-item-placeholder";
    this._itemPlaceholder = ph;
    return ph;
  }

  handleItemDragStart(event, itemShell) {
    this._draggingItemShell = itemShell;
    itemShell.classList.add("ui-ico-child-dragging-item");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "");
  }

  handleItemDragOver(event) {
    event.preventDefault();
    if (!this._draggingItemShell) return;

    const child = this.findInComposedPath(event, (el) => el?.tagName === "UI-ICO-CHILD");
    if (!child) return;

    const dropZone = child.getDropZone?.();
    if (!dropZone) return;

    this._activeDropZone = dropZone;

    const placeholder = this.ensureItemPlaceholder();
    const afterEl = this.getDragAfterItem(dropZone, event.clientY);

    if (afterEl == null) dropZone.appendChild(placeholder);
    else dropZone.insertBefore(placeholder, afterEl);
  }

  handleItemDrop(event) {
    event.preventDefault();
    if (!this._draggingItemShell) return;

    const dropZone = this._activeDropZone;
    const placeholder = this._itemPlaceholder;

    if (dropZone && placeholder && placeholder.parentNode === dropZone) {
      dropZone.insertBefore(this._draggingItemShell, placeholder);
      placeholder.remove();
    }

    this._draggingItemShell.classList.remove("ui-ico-child-dragging-item");
    this._draggingItemShell = null;
    this._activeDropZone = null;
  }

  handleItemDragEnd() {
    if (this._draggingItemShell) {
      this._draggingItemShell.classList.remove("ui-ico-child-dragging-item");
      this._draggingItemShell = null;
    }
    this._itemPlaceholder?.remove();
    this._activeDropZone = null;
  }

  getDragAfterItem(dropZone, y) {
    const items = [
      ...dropZone.querySelectorAll(
        ".ui-ico-child-item-shell:not(.ui-ico-child-dragging-item)"
      ),
    ];

    return items.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  findInComposedPath(event, predicate) {
    const path = event.composedPath?.() || [];
    for (const el of path) {
      if (predicate(el)) return el;
    }
    return null;
  }
}

customElements.define("ui-interactive-composite-owner", UiInteractiveCompositeOwner);
