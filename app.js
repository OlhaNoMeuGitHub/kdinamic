import { loadComponentAssets,loadComponentIfNotExists} from "../../utils.js";

import { BaseComponent} from "../../framework/baseComponent.js";


class App   extends HTMLElement  {
    constructor() {
      super();
       
    }

    async connectedCallback() {
        // Usa a função utilitária para carregar o componente filho
        
        console.log('App connected');
         await loadComponentIfNotExists("ui-board-gallery");


    }
}