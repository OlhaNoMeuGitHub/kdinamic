import { loadComponentAssets } from "../../utils.js";

class MeuComponenteFilho extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._valorInicial = 0;
    this.valorAtual = 0;
    this._textoEFuncao = null;
  }

  get valorInicial() {
    return this._valorInicial;
  }

  set valorInicial(valor) {
    this._valorInicial = valor;
    this.valorAtual = valor;
    this.iniciarContagem();
  }

  // Define o getter e setter para `textoEFuncao`
  get textoEFuncao() {
    return this._textoEFuncao;
  }

  set textoEFuncao([texto, funcao]) {
    this._textoEFuncao = { texto, funcao };
    this.iniciarIntervalo();
  }

  async connectedCallback() {
    await loadComponentAssets(this, "meu-componente-filho");
  }

  iniciarContagem() {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.valorAtual += this.valorInicial;
      this.render();
    }, 5000);
  }

  iniciarIntervalo() {
    // Limpa qualquer intervalo anterior
    clearInterval(this.interval);
    
    // Inicia o intervalo para chamar a função a cada 5 segundos
    this.interval = setInterval(() => {
      if (this._textoEFuncao && this._textoEFuncao.funcao) {
        this._textoEFuncao.funcao(); // Chama a função do array
        this.render(); // Atualiza a renderização com o texto atual
      }
    }, 5000);
  }

  render() {
    const valorElemento = this.shadowRoot.querySelector("p");
    if (valorElemento) {
      valorElemento.textContent = `Valor atual: ${this.valorAtual}`;
    }
    let html = document.createElement("div");
    html.innerHTML = `
    <style>
      p { color: green; font-style: italic; }
    </style>
    <h1>${this._textoEFuncao ? this._textoEFuncao.texto : ""}</h1>
  `;
    this.shadowRoot.appendChild(html)
}
  

  disconnectedCallback() {
    clearInterval(this.interval);
  }
}

customElements.define("meu-componente-filho", MeuComponenteFilho);
