class MeuComponente extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <p>Olá, eu sou um Web Component!</p>
        `;
    }

    // Método chamado quando o componente é inserido no DOM
    connectedCallback() {
        console.log('Componente adicionado ao DOM');
        this.shadowRoot.querySelector('p').style.color = 'green';
    }

    // Método chamado quando o componente é removido do DOM
    disconnectedCallback() {
        console.log('Componente removido do DOM');
        // Aqui poderia remover event listeners ou limpar intervalos, se existirem
    }

    // Define os atributos que o componente deve observar
    static get observedAttributes() {
        return ['titulo'];
    }

    // Método chamado quando um dos atributos observados é alterado
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Atributo ${name} alterado de ${oldValue} para ${newValue}`);
        if (name === 'titulo') {
            this.shadowRoot.querySelector('p').textContent = newValue;
        }
    }

    // Método chamado se o componente for movido para um novo documento
    adoptedCallback() {
        console.log('Componente adotado por um novo documento');
    }
}

// Define o elemento personalizado
customElements.define('meu-componente', MeuComponente);
