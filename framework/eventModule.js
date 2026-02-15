export class EventModule {
    constructor() {
      this.element = null;
    }
  
    bind(element) {
      this.element = element;
    }
  
    addEvent(event, callback) {
      if (this.element) {
        this.element.addEventListener(event, callback);
      }
    }
  
    removeEvent(event, callback) {
      if (this.element) {
        this.element.removeEventListener(event, callback);
      }
    }
  }
  