import { loadComponentAssets,loadComponentIfNotExists, loadMaterialsIfNotExists} from "../../utils.js";

class MeuTeste extends HTMLElement {
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
    // await loadComponentIfNotExists("menu-opcoes");
    // await loadComponentIfNotExists("card-retro");
    await loadComponentAssets(this, "meu-teste");
    await loadMaterialsIfNotExists("text-Editable");

     // Define o array com o texto e a função
     const textoEFuncao = [
      this.texto,
      () => this.exibirTextoNoConsole(this.texto)
    ];
    this.menuOpcoes = this.shadowRoot.querySelector("menu-opcoes");

    this.textEditable = this.shadowRoot.querySelector("text-editable");
    

    // Defina a função personalizada para o evento de salvar
    this.textEditable.onSave = (newText) => {
      console.log("Texto salvo:", newText);
      // Exemplo de lógica adicional
      alert(`O novo texto é: ${newText}`);
    };
    // this.preenchemenu();
    
}




exibirTextoNoConsole(texto) {
  console.log(texto);
}

}

customElements.define("meu-teste", MeuTeste);