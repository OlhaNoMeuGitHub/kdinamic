class MeuComponenteFilho extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
  
    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>
          p { color: green; }
        </style>
        <p>Eu sou o componente filho</p>
      `;
    }
  }
  
  customElements.define("meu-componente-filho", MeuComponenteFilho);
  