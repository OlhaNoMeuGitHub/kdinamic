import { loadComponentAssets, loadComponentIfNotExists } from "../../utils.js";

class UiBoardGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;

    // Drag state (columns)
    this._draggingShell = null;
    this._columnPlaceholder = null;

    // Drag state (cards)
    this._draggingCardShell = null;
    this._cardPlaceholder = null;
    this._cardDropZone = null;

    // Column color state (per column instance)
    this._columnColors = new WeakMap(); // columnEl -> color
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  async initializeOnce() {
    await loadComponentAssets(this, "ui-board-gallery");
    await loadComponentIfNotExists("ui-column-retro");

    this._btnCreateColumn = this.shadowRoot.querySelector("#ui-board-gallery-create-column");
    this._columnsContainer = this.shadowRoot.querySelector("#ui-board-gallery-columns-container");

    if (this._btnCreateColumn) {
      this._btnCreateColumn.addEventListener("click", () => this.createColumn());
    }

    if (this._columnsContainer) {
      // Drag delegation
      this._columnsContainer.addEventListener("dragstart", (e) => this.handleAnyDragStart(e));
      this._columnsContainer.addEventListener("dragover", (e) => this.handleAnyDragOver(e));
      this._columnsContainer.addEventListener("drop", (e) => this.handleAnyDrop(e));
      this._columnsContainer.addEventListener("dragend", () => this.handleAnyDragEnd());

      // ✅ Intent events (owner responsibility)
      this._columnsContainer.addEventListener("ui-column-delete", (e) => this.handleColumnDelete(e));
      this._columnsContainer.addEventListener("ui-column-change-color", (e) =>
        this.handleColumnChangeColor(e)
      );
    }
  }

  onConnected() {}

  createColumn() {
    const container = this._columnsContainer;
    if (!container) return;

    const columnCount = container.querySelectorAll("ui-column-retro").length + 1;

    const shell = document.createElement("div");
    shell.className = "ui-board-gallery-column-shell";

    const icon = document.createElement("span");
    icon.className = "ui-board-gallery-move-icon";
    icon.textContent = "⋮⋮";
    icon.setAttribute("draggable", "true");
    icon.title = "Move column";

    const column = document.createElement("ui-column-retro");
    column.columnTitle = `teste ${columnCount}`;

    shell.appendChild(icon);
    shell.appendChild(column);
    container.appendChild(shell);
  }

  // ============================================================
  // ✅ OWNER: column delete
  // ============================================================
  handleColumnDelete(event) {
    const columnEl = event.detail?.column;
    if (!columnEl) return;

    const shell = columnEl.closest(".ui-board-gallery-column-shell");
    if (!shell) return;

    shell.remove();
  }

  // ============================================================
  // ✅ OWNER: column color change
  // detail must include: { column, color }
  // ============================================================
  handleColumnChangeColor(event) {
    const columnEl = event.detail?.column;
    const color = event.detail?.color ?? null;
    if (!columnEl) return;

    // store for future (new cards)
    this._columnColors.set(columnEl, color);

    // tell the column (so it can apply color to cards created later)
    if (typeof columnEl.setCardsInheritedColor === "function") {
      columnEl.setCardsInheritedColor(color);
    } else {
      // fallback: simple property (your column can read this)
      columnEl._cardsInheritedColor = color;
    }

    // apply to current cards already inside the column
    const dropZone = typeof columnEl.getDropZone === "function" ? columnEl.getDropZone() : null;
    if (!dropZone) return;

    const shells = dropZone.querySelectorAll(".ui-column-retro-card-wrapper");
    shells.forEach((shell) => {
      const card = shell.querySelector("ui-card-retro");
      if (!card) return;
      if (typeof card.setInheritedColor === "function") card.setInheritedColor(color);
    });
  }

  // ============================================================
  // DRAG DISPATCHER
  // ============================================================
  handleAnyDragStart(event) {
    const icon = event.target?.closest?.(".ui-board-gallery-move-icon");
    if (icon) {
      this.handleShellDragStart(event, icon);
      return;
    }

    const cardShell = this.findInComposedPath(event, (el) =>
      el?.classList?.contains("ui-column-retro-card-wrapper")
    );
    if (cardShell) {
      this.handleCardShellDragStart(event, cardShell);
      return;
    }
  }

  handleAnyDragOver(event) {
    if (this._draggingCardShell) return this.handleCardShellDragOver(event);
    if (this._draggingShell) return this.handleShellDragOver(event);
  }

  handleAnyDrop(event) {
    if (this._draggingCardShell) return this.handleCardShellDrop(event);
    if (this._draggingShell) return this.handleShellDrop(event);
  }

  handleAnyDragEnd() {
    this.handleShellDragEnd();
    this.handleCardShellDragEnd();
  }

  // ============================================================
  // COLUMN DRAG
  // ============================================================
  ensureColumnPlaceholder() {
    if (this._columnPlaceholder) return this._columnPlaceholder;

    const ph = document.createElement("div");
    ph.className = "ui-board-gallery-placeholder";
    this._columnPlaceholder = ph;
    return ph;
  }

  handleShellDragStart(event, iconEl) {
    const shell = iconEl.closest(".ui-board-gallery-column-shell");
    if (!shell) return;

    this._draggingShell = shell;
    shell.classList.add("ui-board-gallery-dragging-shell");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "");
  }

  handleShellDragOver(event) {
    if (!this._draggingShell) return;
    event.preventDefault();

    const container = this._columnsContainer;
    if (!container) return;

    const placeholder = this.ensureColumnPlaceholder();
    const afterElement = this.getDragAfterShell(container, event.clientX);

    if (afterElement == null) container.appendChild(placeholder);
    else container.insertBefore(placeholder, afterElement);
  }

  handleShellDrop(event) {
    if (!this._draggingShell) return;
    event.preventDefault();

    const container = this._columnsContainer;
    if (!container) return;

    const placeholder = this._columnPlaceholder;
    if (placeholder && placeholder.parentNode === container) {
      container.insertBefore(this._draggingShell, placeholder);
      placeholder.remove();
    }

    this._draggingShell.classList.remove("ui-board-gallery-dragging-shell");
    this._draggingShell = null;
  }

  handleShellDragEnd() {
    if (this._draggingShell) {
      this._draggingShell.classList.remove("ui-board-gallery-dragging-shell");
      this._draggingShell = null;
    }
    if (this._columnPlaceholder) this._columnPlaceholder.remove();
  }

  getDragAfterShell(container, x) {
    const shells = [
      ...container.querySelectorAll(
        ".ui-board-gallery-column-shell:not(.ui-board-gallery-dragging-shell)"
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

  // ============================================================
  // CARD DRAG (cross-column)
  // ============================================================
  ensureCardPlaceholder() {
    if (this._cardPlaceholder) return this._cardPlaceholder;

    const ph = document.createElement("div");
    ph.className = "ui-board-gallery-card-placeholder";
    this._cardPlaceholder = ph;
    return ph;
  }

  handleCardShellDragStart(event, cardShell) {
    this._draggingCardShell = cardShell;
    cardShell.classList.add("ui-board-gallery-dragging-card");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "");
  }

  handleCardShellDragOver(event) {
    event.preventDefault();
    if (!this._draggingCardShell) return;

    const columnEl = this.findInComposedPath(event, (el) => el?.tagName === "UI-COLUMN-RETRO");
    if (!columnEl) return;

    const dropZone = typeof columnEl.getDropZone === "function" ? columnEl.getDropZone() : null;
    if (!dropZone) return;

    this._cardDropZone = dropZone;

    const placeholder = this.ensureCardPlaceholder();
    const afterEl = this.getDragAfterCard(dropZone, event.clientY);

    if (afterEl == null) dropZone.appendChild(placeholder);
    else dropZone.insertBefore(placeholder, afterEl);
  }

  handleCardShellDrop(event) {
    event.preventDefault();
    if (!this._draggingCardShell) return;

    const dropZone = this._cardDropZone;
    const placeholder = this._cardPlaceholder;

    if (dropZone && placeholder && placeholder.parentNode === dropZone) {
      dropZone.insertBefore(this._draggingCardShell, placeholder);
      placeholder.remove();
    }

    this._draggingCardShell.classList.remove("ui-board-gallery-dragging-card");
    this._draggingCardShell = null;
    this._cardDropZone = null;
  }

  handleCardShellDragEnd() {
    if (this._draggingCardShell) {
      this._draggingCardShell.classList.remove("ui-board-gallery-dragging-card");
      this._draggingCardShell = null;
    }
    if (this._cardPlaceholder) this._cardPlaceholder.remove();
    this._cardDropZone = null;
  }

  getDragAfterCard(dropZone, y) {
    const cards = [
      ...dropZone.querySelectorAll(
        ".ui-column-retro-card-wrapper:not(.ui-board-gallery-dragging-card)"
      ),
    ];

    return cards.reduce(
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

customElements.define("ui-board-gallery", UiBoardGallery);
