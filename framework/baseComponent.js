import { loadComponentAssets,loadComponentIfNotExists} from "../../utils.js";


export class BaseComponent extends HTMLElement {
  constructor(componente = "",modules = []) {
    super();
    this.attachShadow({ mode: "open" });
    this._modules = {};
    // loadComponentAssets(this, componente);
    
    // Inicializa os módulos
    this._initializeModules(modules);

    // Executa a inicialização assíncrona
  }




  _initializeModules(modules) {
    modules.forEach((Module) => {
      const instance = new Module();
      this._modules[Module.name] = instance;
    });
  }

  getModuleBinded(moduleClass, selector) {
    const module = this._modules[moduleClass.name];
    const element = this.shadowRoot.querySelector(selector);

    if (!module) {
      console.warn(`Módulo não encontrado: ${moduleClass.name}`);
      return null;
    }
    if (!element) {
      console.warn(`Elemento não encontrado para o seletor: ${selector}`);
      return null;
    }

    module.bind(element); // Vincula o módulo ao elemento
    return module; // Retorna o módulo vinculado
  }
}
