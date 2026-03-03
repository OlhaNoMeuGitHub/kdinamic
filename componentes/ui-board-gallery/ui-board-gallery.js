import { loadComponentAssets, loadComponentIfNotExists } from "../../utils.js";
import { createUiBoardGalleryModule } from "../../modules/ui-board-gallery/ui-board-gallery.module.js";
import { createUiBoardGalleryService } from "../../services/ui-board-gallery/ui-board-gallery.service.js";
import { createUiBoardGalleryStore } from "../../stores/ui-board-gallery/ui-board-gallery.store.js";

function createDefaultMetadata() {
  return {
    label: "",
    color: "",
  };
}

function createLocalColumn(index) {
  const token = `${Date.now()}-${index}`;
  return {
    id: `column-local-${token}`,
    text: `Coluna ${index}`,
    comments: [],
    likes: 0,
    metadata: createDefaultMetadata(),
    cards: [],
  };
}

function createLocalCard(index) {
  const token = `${Date.now()}-${index}`;
  return {
    id: `card-local-${token}`,
    text: `Card local ${index}`,
    comments: [],
    likes: 0,
    metadata: createDefaultMetadata(),
  };
}

function reorderColumns(columns, orderedIds) {
  const orderedSet = new Set(orderedIds);
  const orderedColumns = orderedIds
    .map((columnId) => columns.find((column) => column.id === columnId))
    .filter(Boolean);
  const remainingColumns = columns.filter((column) => !orderedSet.has(column.id));
  return [...orderedColumns, ...remainingColumns];
}

function moveCard(columns, { cardId, fromColumnId, toColumnId, toIndex }) {
  const nextColumns = columns.map((column) => ({
    ...column,
    metadata: {
      ...createDefaultMetadata(),
      ...(column.metadata || {}),
    },
    cards: [...(column.cards || [])],
  }));

  const sourceColumn = nextColumns.find((column) => column.id === fromColumnId);
  const targetColumn = nextColumns.find((column) => column.id === toColumnId);

  if (!sourceColumn || !targetColumn) {
    return columns;
  }

  const cardIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
  if (cardIndex < 0) {
    return columns;
  }

  const [card] = sourceColumn.cards.splice(cardIndex, 1);
  const safeIndex = Math.max(0, Math.min(toIndex, targetColumn.cards.length));
  targetColumn.cards.splice(safeIndex, 0, card);

  return nextColumns;
}

class UiBoardGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._unsubscribeStore = null;
    this._store = null;
    this._service = null;
    this._module = null;
    this._ownsModule = false;
    this._shellById = new Map();
    this._draggingShell = null;
    this._columnPlaceholder = null;
    this._draggingCardShell = null;
    this._draggingCardId = null;
    this._draggingCardColumnId = null;
    this._cardPlaceholder = null;
    this._cardDropZone = null;
    this._cardDropColumnId = null;
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
      this._module = null;
      this._ownsModule = false;
    }
  }

  async initializeOnce() {
    await loadComponentAssets(this, "ui-board-gallery");
    await loadComponentIfNotExists("ui-column-retro");

    this._titleEl = this.shadowRoot.querySelector(".ui-board-gallery-title");
    this._btnCreateColumn = this.shadowRoot.querySelector("#ui-board-gallery-create-column");
    this._columnsContainer = this.shadowRoot.querySelector("#ui-board-gallery-columns-container");

    this.attachListenersOnce();
  }

  attachListenersOnce() {
    if (this._listenersAttached) {
      return;
    }

    this._listenersAttached = true;

    this._btnCreateColumn?.addEventListener("click", () => this.createColumn());

    this.addEventListener("ui-column-retro:delete", (event) => this.handleColumnDeleteIntent(event));
    this.addEventListener("ui-column-retro:update", (event) => this.handleColumnUpdateIntent(event));
    this.addEventListener("ui-column-retro:add-comment", (event) =>
      this.handleColumnAddCommentIntent(event)
    );
    this.addEventListener("ui-column-retro:update-comment", (event) =>
      this.handleColumnUpdateCommentIntent(event)
    );
    this.addEventListener("ui-column-retro:delete-comment", (event) =>
      this.handleColumnDeleteCommentIntent(event)
    );
    this.addEventListener("ui-column-retro:create-card", (event) =>
      this.handleCreateCardIntent(event)
    );

    this.addEventListener("ui-card-retro:update", (event) => this.handleCardUpdateIntent(event));
    this.addEventListener("ui-card-retro:delete", (event) => this.handleCardDeleteIntent(event));
    this.addEventListener("ui-card-retro:add-comment", (event) =>
      this.handleCardAddCommentIntent(event)
    );
    this.addEventListener("ui-card-retro:update-comment", (event) =>
      this.handleCardUpdateCommentIntent(event)
    );
    this.addEventListener("ui-card-retro:delete-comment", (event) =>
      this.handleCardDeleteCommentIntent(event)
    );

    this._columnsContainer?.addEventListener("dragstart", (event) => this.handleAnyDragStart(event));
    this._columnsContainer?.addEventListener("dragover", (event) => this.handleAnyDragOver(event));
    this._columnsContainer?.addEventListener("drop", (event) => this.handleAnyDrop(event));
    this._columnsContainer?.addEventListener("dragend", () => this.handleAnyDragEnd());
  }

  ensureDependencies() {
    if (!this._store) {
      this._store = createUiBoardGalleryStore();
    }

    if (!this._service) {
      this._service = createUiBoardGalleryService({ mode: "mock" });
    }

    if (!this._module) {
      this._module = createUiBoardGalleryModule({
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

    const gallery = state.gallery || {
      id: "",
      text: "",
      columns: [],
    };

    if (this._titleEl) {
      this._titleEl.textContent = gallery.text || "Gallery Component";
      this._titleEl.title = `${gallery.id || "gallery"} | ${state.sync.status}`;
    }

    this.syncShells(gallery.columns || []);
  }

  syncShells(columns) {
    if (!this._columnsContainer) {
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
        shell = this.createColumnShell(column.id);
        this._shellById.set(column.id, shell);
      }

      shell.dataset.columnId = column.id;

      const columnElement = shell.querySelector("ui-column-retro");
      if (columnElement) {
        columnElement.store = this._store;
        columnElement.columnId = column.id;
      }

      this._columnsContainer.appendChild(shell);
    });
  }

  createColumnShell(columnId) {
    const shell = document.createElement("div");
    shell.className = "ui-board-gallery-column-shell";
    shell.dataset.columnId = columnId;

    const icon = document.createElement("span");
    icon.className = "ui-board-gallery-move-icon";
    icon.textContent = "::";
    icon.title = "Move column";
    icon.setAttribute("draggable", "true");

    const column = document.createElement("ui-column-retro");
    column.store = this._store;
    column.columnId = columnId;

    shell.append(icon, column);
    return shell;
  }

  updateGallery(updater) {
    this._store?.setState((currentState) => ({
      ...currentState,
      gallery: updater(currentState.gallery),
    }));
  }

  updateColumn(columnId, updater) {
    this.updateGallery((gallery) => ({
      ...gallery,
      columns: (gallery.columns || []).map((column) =>
        column.id === columnId ? updater(column) : column
      ),
    }));
  }

  updateCard(columnId, cardId, updater) {
    this.updateColumn(columnId, (column) => ({
      ...column,
      cards: (column.cards || []).map((card) => (card.id === cardId ? updater(card) : card)),
    }));
  }

  normalizeText(value, fallback = "") {
    const normalizedValue = `${value ?? ""}`.trim();
    return normalizedValue || fallback || "";
  }

  createColumn() {
    this.updateGallery((gallery) => ({
      ...gallery,
      columns: [...(gallery.columns || []), createLocalColumn((gallery.columns || []).length + 1)],
    }));
  }

  handleColumnDeleteIntent(event) {
    const columnId = event.detail?.columnId;
    if (!columnId) {
      return;
    }

    this.updateGallery((gallery) => ({
      ...gallery,
      columns: (gallery.columns || []).filter((column) => column.id !== columnId),
    }));
  }

  handleColumnUpdateIntent(event) {
    const columnId = event.detail?.columnId;
    const patch = event.detail?.patch || {};
    if (!columnId) {
      return;
    }

    this.updateGallery((gallery) => {
      if (
        patch.id &&
        (gallery.columns || []).some(
          (column) => column.id === patch.id && column.id !== columnId
        )
      ) {
        return gallery;
      }

      return {
        ...gallery,
        columns: (gallery.columns || []).map((column) => {
          if (column.id !== columnId) {
            return column;
          }

          return {
            ...column,
            ...patch,
            metadata: {
              ...createDefaultMetadata(),
              ...(column.metadata || {}),
              ...(patch.metadata || {}),
            },
          };
        }),
      };
    });
  }

  handleColumnAddCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const value = this.normalizeText(event.detail?.value);
    if (!columnId || !value) {
      return;
    }

    this.updateColumn(columnId, (column) => ({
      ...column,
      comments: [...(column.comments || []), value],
    }));
  }

  handleColumnUpdateCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const commentIndex = Number(event.detail?.commentIndex);
    const value = this.normalizeText(event.detail?.value);
    if (!columnId || Number.isNaN(commentIndex)) {
      return;
    }

    this.updateColumn(columnId, (column) => ({
      ...column,
      comments: (column.comments || []).map((comment, index) =>
        index === commentIndex ? (value || comment) : comment
      ),
    }));
  }

  handleColumnDeleteCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const commentIndex = Number(event.detail?.commentIndex);
    if (!columnId || Number.isNaN(commentIndex)) {
      return;
    }

    this.updateColumn(columnId, (column) => ({
      ...column,
      comments: (column.comments || []).filter((_, index) => index !== commentIndex),
    }));
  }

  handleCreateCardIntent(event) {
    const columnId = event.detail?.columnId;
    if (!columnId) {
      return;
    }

    this.updateColumn(columnId, (column) => ({
      ...column,
      cards: [...(column.cards || []), createLocalCard((column.cards || []).length + 1)],
    }));
  }

  handleCardUpdateIntent(event) {
    const columnId = event.detail?.columnId;
    const cardId = event.detail?.cardId;
    const patch = event.detail?.patch || {};

    if (!columnId || !cardId) {
      return;
    }

    this.updateGallery((gallery) => {
      if (
        patch.id &&
        (gallery.columns || []).some((column) =>
          (column.cards || []).some((card) => card.id === patch.id && card.id !== cardId)
        )
      ) {
        return gallery;
      }

      return {
        ...gallery,
        columns: (gallery.columns || []).map((column) => {
          if (column.id !== columnId) {
            return column;
          }

          return {
            ...column,
            cards: (column.cards || []).map((card) => {
              if (card.id !== cardId) {
                return card;
              }

              return {
                ...card,
                ...patch,
                metadata: {
                  ...createDefaultMetadata(),
                  ...(card.metadata || {}),
                  ...(patch.metadata || {}),
                },
              };
            }),
          };
        }),
      };
    });
  }

  handleCardDeleteIntent(event) {
    const columnId = event.detail?.columnId;
    const cardId = event.detail?.cardId;
    if (!columnId || !cardId) {
      return;
    }

    this.updateColumn(columnId, (column) => ({
      ...column,
      cards: (column.cards || []).filter((card) => card.id !== cardId),
    }));
  }

  handleCardAddCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const cardId = event.detail?.cardId;
    const value = this.normalizeText(event.detail?.value);
    if (!columnId || !cardId || !value) {
      return;
    }

    this.updateCard(columnId, cardId, (card) => ({
      ...card,
      comments: [...(card.comments || []), value],
    }));
  }

  handleCardUpdateCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const cardId = event.detail?.cardId;
    const commentIndex = Number(event.detail?.commentIndex);
    const value = this.normalizeText(event.detail?.value);
    if (!columnId || !cardId || Number.isNaN(commentIndex)) {
      return;
    }

    this.updateCard(columnId, cardId, (card) => ({
      ...card,
      comments: (card.comments || []).map((comment, index) =>
        index === commentIndex ? (value || comment) : comment
      ),
    }));
  }

  handleCardDeleteCommentIntent(event) {
    const columnId = event.detail?.columnId;
    const cardId = event.detail?.cardId;
    const commentIndex = Number(event.detail?.commentIndex);
    if (!columnId || !cardId || Number.isNaN(commentIndex)) {
      return;
    }

    this.updateCard(columnId, cardId, (card) => ({
      ...card,
      comments: (card.comments || []).filter((_, index) => index !== commentIndex),
    }));
  }

  handleAnyDragStart(event) {
    const icon = event.target?.closest?.(".ui-board-gallery-move-icon");
    if (icon) {
      this.handleShellDragStart(event, icon);
      return;
    }

    const columnElement = this.findInComposedPath(event, (element) => element?.tagName === "UI-COLUMN-RETRO");
    const cardShell =
      typeof columnElement?.getCardShellFromEvent === "function"
        ? columnElement.getCardShellFromEvent(event)
        : null;

    if (cardShell) {
      this.handleCardShellDragStart(event, cardShell);
    }
  }

  handleAnyDragOver(event) {
    if (this._draggingCardShell) {
      this.handleCardShellDragOver(event);
      return;
    }

    if (this._draggingShell) {
      this.handleShellDragOver(event);
    }
  }

  handleAnyDrop(event) {
    if (this._draggingCardShell) {
      this.handleCardShellDrop(event);
      return;
    }

    if (this._draggingShell) {
      this.handleShellDrop(event);
    }
  }

  handleAnyDragEnd() {
    this.handleShellDragEnd();
    this.handleCardShellDragEnd();
  }

  ensureColumnPlaceholder() {
    if (this._columnPlaceholder) {
      return this._columnPlaceholder;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "ui-board-gallery-placeholder";
    this._columnPlaceholder = placeholder;
    return placeholder;
  }

  handleShellDragStart(event, iconElement) {
    const shell = iconElement.closest(".ui-board-gallery-column-shell");
    if (!shell) {
      return;
    }

    this._draggingShell = shell;
    shell.classList.add("ui-board-gallery-dragging-shell");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", shell.dataset.columnId || "");
  }

  handleShellDragOver(event) {
    if (!this._draggingShell || !this._columnsContainer) {
      return;
    }

    event.preventDefault();

    const placeholder = this.ensureColumnPlaceholder();
    const afterElement = this.getDragAfterShell(this._columnsContainer, event.clientX);

    if (afterElement == null) {
      this._columnsContainer.appendChild(placeholder);
      return;
    }

    this._columnsContainer.insertBefore(placeholder, afterElement);
  }

  handleShellDrop(event) {
    if (!this._draggingShell || !this._columnsContainer) {
      return;
    }

    event.preventDefault();

    const placeholder = this._columnPlaceholder;
    if (placeholder?.parentNode === this._columnsContainer) {
      this._columnsContainer.insertBefore(this._draggingShell, placeholder);
    }

    const orderedIds = [...this._columnsContainer.querySelectorAll(".ui-board-gallery-column-shell")]
      .map((shell) => shell.dataset.columnId)
      .filter(Boolean);

    this.updateGallery((gallery) => ({
      ...gallery,
      columns: reorderColumns(gallery.columns || [], orderedIds),
    }));

    this.handleShellDragEnd();
  }

  handleShellDragEnd() {
    if (this._draggingShell) {
      this._draggingShell.classList.remove("ui-board-gallery-dragging-shell");
      this._draggingShell = null;
    }

    this._columnPlaceholder?.remove();
  }

  getDragAfterShell(container, x) {
    const shells = [...container.querySelectorAll(".ui-board-gallery-column-shell")].filter(
      (shell) => shell !== this._draggingShell
    );

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

  ensureCardPlaceholder() {
    if (this._cardPlaceholder) {
      return this._cardPlaceholder;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "ui-board-gallery-card-placeholder";
    this._cardPlaceholder = placeholder;
    return placeholder;
  }

  handleCardShellDragStart(event, cardShell) {
    this._draggingCardShell = cardShell;
    this._draggingCardId = cardShell.dataset.cardId || null;
    this._draggingCardColumnId = cardShell.dataset.columnId || null;
    cardShell.classList.add("ui-column-retro-dragging-card");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", this._draggingCardId || "");
  }

  handleCardShellDragOver(event) {
    event.preventDefault();
    if (!this._draggingCardShell) {
      return;
    }

    const columnElement = this.findInComposedPath(event, (element) => element?.tagName === "UI-COLUMN-RETRO");
    if (!columnElement) {
      return;
    }

    const dropZone = typeof columnElement.getDropZone === "function" ? columnElement.getDropZone() : null;
    if (!dropZone) {
      return;
    }

    this._cardDropZone = dropZone;
    this._cardDropColumnId = columnElement.columnId;

    const placeholder = this.ensureCardPlaceholder();
    const afterElement =
      typeof columnElement.getCardDragAfter === "function"
        ? columnElement.getCardDragAfter(event.clientY, this._draggingCardShell)
        : null;

    if (afterElement == null) {
      dropZone.appendChild(placeholder);
      return;
    }

    dropZone.insertBefore(placeholder, afterElement);
  }

  handleCardShellDrop(event) {
    event.preventDefault();
    if (!this._draggingCardShell || !this._draggingCardId || !this._draggingCardColumnId) {
      return;
    }

    const dropZone = this._cardDropZone;
    const placeholder = this._cardPlaceholder;
    const targetColumnId = this._cardDropColumnId || this._draggingCardColumnId;

    if (!dropZone || !placeholder || placeholder.parentNode !== dropZone || !targetColumnId) {
      this.handleCardShellDragEnd();
      return;
    }

    const targetIndex = this.getCardPlaceholderIndex(dropZone, placeholder);

    this.updateGallery((gallery) => ({
      ...gallery,
      columns: moveCard(gallery.columns || [], {
        cardId: this._draggingCardId,
        fromColumnId: this._draggingCardColumnId,
        toColumnId: targetColumnId,
        toIndex: targetIndex,
      }),
    }));

    this.handleCardShellDragEnd();
  }

  getCardPlaceholderIndex(dropZone, placeholder) {
    const entries = [...dropZone.children].filter(
      (child) =>
        child === placeholder ||
        (child.classList?.contains("ui-column-retro-card-wrapper") && child !== this._draggingCardShell)
    );

    return Math.max(entries.indexOf(placeholder), 0);
  }

  handleCardShellDragEnd() {
    if (this._draggingCardShell) {
      this._draggingCardShell.classList.remove("ui-column-retro-dragging-card");
      this._draggingCardShell = null;
    }

    this._draggingCardId = null;
    this._draggingCardColumnId = null;
    this._cardPlaceholder?.remove();
    this._cardDropZone = null;
    this._cardDropColumnId = null;
  }

  findInComposedPath(event, predicate) {
    const path = event.composedPath?.() || [];
    for (const element of path) {
      if (predicate(element)) {
        return element;
      }
    }

    return null;
  }
}

if (!customElements.get("ui-board-gallery")) {
  customElements.define("ui-board-gallery", UiBoardGallery);
}
