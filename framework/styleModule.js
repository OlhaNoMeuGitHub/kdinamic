export class StyleModule {
    constructor() {
      this.element = null;
    }
  
    // Vincula o módulo a um elemento
    bind(element) {
      this.element = element;
    }
  
    toggleVisibility() {
      if (this.element) {
        this.element.classList.toggle("hidden");
      }
    }
  
    setStyle(styleObject) {
      if (this.element) {
        Object.assign(this.element.style, styleObject);
      }
    }
  
    resetStyle() {
      if (this.element) {
        this.element.removeAttribute("style");
      }
    }
  }
  