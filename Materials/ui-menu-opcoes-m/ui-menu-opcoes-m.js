import { loadMaterialsAssets } from "../../utils.js";

class UiMenuOpcoesMaterial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initialized = false;
    this._items = [];
    this._isOpen = false;

    this._handleDocumentClick = (event) => {
      if (!this._isOpen) return;
      const path = event.composedPath?.() || [];
      if (!path.includes(this)) this.closeMenu();
    };

    this._handleViewportChange = () => {
      if (this._isOpen) this.positionMenu();
    };
  }

  static get observedAttributes() {
    return ["disabled"];
  }

  async connectedCallback() {
    if (!this._initialized) {
      await this.initializeOnce();
      this._initialized = true;
    }
    this.onConnected();
  }

  attributeChangedCallback(name) {
    if (name === "disabled") this.applyDisabledState();
  }

  async initializeOnce() {
    if (this._initialized) return;
    this._initialized = true;

    await loadMaterialsAssets(this, "ui-menu-opcoes-m");

    this._root = this.shadowRoot.querySelector("#ui-menu-opcoes-m-root");
    this._icon = this.shadowRoot.querySelector("#ui-menu-opcoes-m-icon");
    this._menu = this.shadowRoot.querySelector("#ui-menu-opcoes-m-context");

    if (this._icon) {
      this._icon.addEventListener("click", () => this.toggleMenu());
    }

    if (this._root) {
      this._root.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.closeMenu();
      });
    }

    document.addEventListener("click", this._handleDocumentClick);
    window.addEventListener("resize", this._handleViewportChange);
    window.addEventListener("scroll", this._handleViewportChange, true);

    this.applyDisabledState();
    this.render();
  }

  onConnected() {
    this.syncAria();
  }

  // Public API
  getNativeElement() {
    return this._menu;
  }

  focus() {
    if (this._icon) this._icon.focus();
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  get items() {
    return this._items || [];
  }

  set items(value) {
    this._items = Array.isArray(value) ? value : [];
    this.render();
  }

  applyDisabledState() {
    const isDisabled = this.disabled;
    if (this._icon) {
      this._icon.disabled = isDisabled;
      this._icon.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    }
    if (isDisabled) this.closeMenu();
  }

  toggleMenu() {
    if (this.disabled) return;
    if (this._isOpen) this.closeMenu();
    else this.openMenu();
  }

  openMenu() {
    if (!this._menu) return;
    this._isOpen = true;
    this._menu.classList.remove("ui-menu-opcoes-m-hidden");
    this._menu.classList.add("ui-menu-opcoes-m-visible");
    this._menu.style.visibility = "hidden";
    this.positionMenu();
    this._menu.style.visibility = "visible";
    this.syncAria();
  }

  closeMenu() {
    if (!this._menu) return;
    this._isOpen = false;
    this._menu.classList.add("ui-menu-opcoes-m-hidden");
    this._menu.classList.remove("ui-menu-opcoes-m-visible");
    this.syncAria();
  }

  syncAria() {
    if (this._icon) {
      this._icon.setAttribute("aria-expanded", this._isOpen ? "true" : "false");
    }
  }

  positionMenu() {
    if (!this._menu || !this._icon) return;

    const iconRect = this._icon.getBoundingClientRect();
    const menuRect = this._menu.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 8;

    let left = iconRect.right + gap;
    let top = iconRect.top;

    if (left + menuRect.width > window.innerWidth - viewportPadding) {
      left = iconRect.left - menuRect.width - gap;
    }
    if (left < viewportPadding) left = viewportPadding;

    if (top + menuRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - menuRect.height - viewportPadding;
    }
    if (top < viewportPadding) top = viewportPadding;

    this._menu.style.left = `${Math.round(left)}px`;
    this._menu.style.top = `${Math.round(top)}px`;
  }

  render() {
    if (!this._menu) return;

    this._menu.innerHTML = "";

    const createMenuItems = (menuItems) => {
      const fragment = document.createDocumentFragment();

      (menuItems || []).forEach(({ text, action, submenu }) => {
        const item = document.createElement("li");
        item.className = "ui-menu-opcoes-m-item";
        item.setAttribute("role", "menuitem");
        item.textContent = text ?? "";

        if (typeof action === "function") {
          item.addEventListener("click", () => {
            action();
            this.closeMenu();
          });
        }

        if (Array.isArray(submenu) && submenu.length > 0) {
          const submenuList = document.createElement("ul");
          submenuList.className = "ui-menu-opcoes-m-submenu";
          submenuList.setAttribute("role", "menu");
          submenuList.appendChild(createMenuItems(submenu));
          item.appendChild(submenuList);
        }

        fragment.appendChild(item);
      });

      return fragment;
    };

    this._menu.appendChild(createMenuItems(this._items));
  }
}

customElements.define("ui-menu-opcoes-m", UiMenuOpcoesMaterial);
