class MeuComponentePai extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    // Carrega o código do componente filho dinamicamente quando necessário


    if (!customElements.get("meu-componente-filho")) {
      await import("/componentes/meu-componente-filho.js");
    }


    
    this.shadowRoot.innerHTML = `
      <style>
        div { color: blue; border: 1px solid blue; padding: 10px; }
      </style>
      <div>
        <p>Eu sou o componente pai</p>
        <meu-componente-filho></meu-componente-filho>
      </div>
    `;
  }
}

customElements.define("meu-componente-pai", MeuComponentePai);
