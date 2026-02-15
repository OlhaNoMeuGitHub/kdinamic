import { loadComponentAssets,loadComponentIfNotExists } from "../../utils.js";

class MeuComponentePai extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // Método para obter o valor do atributo "inicial" do contador
  get inicial() {
    return parseInt(this.getAttribute("inicial")) || 1; // Valor padrão é 1
  }

  get texto() {
    return this.getAttribute("texto") || "Texto padrão"; // Valor padrão é "Texto padrão"
  }


  async connectedCallback() {
    // Usa a função utilitária para carregar o componente filho
    await loadComponentIfNotExists("meu-componente-filho");
    await loadComponentAssets(this, "meu-componente-pai");

     // Define o array com o texto e a função
     const textoEFuncao = [
      this.texto,
      () => this.exibirTextoNoConsole(this.texto)
    ];

    
    // Seleciona o componente filho e passa o valor inicial para ele
    const filho = this.shadowRoot.querySelector("meu-componente-filho");
    filho.valorInicial = this.inicial;
    filho.textoEFuncao = textoEFuncao;
}

exibirTextoNoConsole(texto) {
  console.log(texto);
}

}

customElements.define("meu-componente-pai", MeuComponentePai);