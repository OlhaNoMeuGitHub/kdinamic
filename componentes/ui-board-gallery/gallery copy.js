import { loadComponentAssets,loadComponentIfNotExists} from "../../utils.js";

import { BaseComponent} from "../../framework/baseComponent.js";

class Gallery extends HTMLElement  {
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
    
    console.log('Gallery connected');
    await loadComponentAssets(this,"board-gallery");
    
     await loadComponentIfNotExists("column-retro");
    
    // Seleciona o componente filho e passa o valor inicial para ele

      // Atualizar a visibilidade das colunas de cards ao carregar o componente
      // this.shadowRoot.querySelectorAll('.gallery-column').forEach(column => {
      //   const columnId = column.id.split('-').pop(); // Pega o ID numérico da coluna
      //   this.updateColumnVisibility(columnId); // Atualiza a visibilidade da coluna
      // });

    this.shadowRoot.querySelector('#gallery-create-column').addEventListener('click', () => this.createColumn());
    //   this.initializeColumnEvents(); 


}



  
  // Função para criar colunas
   createColumn() {
    const columnsContainer = this.shadowRoot.querySelector('#gallery-columns-container');
    const columnCount = this.shadowRoot.querySelectorAll('column-retro').length + 1;
    console.log('Criando coluna ' + columnCount);
  
    // Criar nova coluna
    const newColumn = document.createElement('column-retro');
    
    
    newColumn.columnTitle = "teste " + columnCount;
    columnsContainer.appendChild(newColumn);
    
    // Permitir que o nome da coluna seja editado
    
  

    // Inicialmente esconder a coluna de cards se estiver vazia
    // this.updateColumnVisibility(columnCount);
  
  

  
    // // Adicionar eventos de drag and drop para as colunas
    // newColumn.addEventListener('dragstart', (event) => this.handleColumnDragStart(event));
    // newColumn.addEventListener('dragend', (event) => this.handleColumnDragEnd(event));
    // newColumn.addEventListener('dragover', (event) => this.handleColumnDragOver(event));
    // newColumn.addEventListener('drop', (event) => this.handleColumnDrop(event));
  
    this.initializeColumnEvents(); // Inicializa eventos nas colunas existentes
  }
  
  
  // Função para inicializar eventos nas colunas existentes
   initializeColumnEvents() {
    this.shadowRoot.querySelectorAll('.gallery-column').forEach(column => {
      const cardColumn = column.querySelector('.gallery-card-column');
      cardColumn.addEventListener('dragstart', (event) => this.handleCardDragStart(event)); // Evento de dragover para todos
      cardColumn.addEventListener('dragend', (event) => this.handleCardDragEnd(event)); // Evento de drop para todos
      cardColumn.addEventListener('dragover', (event) => this.handleCardDragOver(event)); // Evento de dragover para todos
      cardColumn.addEventListener('drop', (event) => this.handleCardDrop(event)); // Evento de drop para todos
    });
  }
  

  

  
  
  
  
  // Funções de arrastar e soltar (drag-and-drop) para as colunas
   handleColumnDragStart(event) {
    // event.preventDefault();
    event.stopPropagation();
    const path = event.composedPath();
    const targetColumn = path.find(el => el.dataset && el.dataset.type === 'column');
    if (targetColumn) {
      const cards = event.target.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.visibility = 'hidden'; // Ocultar os cards durante o arrasto
      });
      event.target.classList.add('dragging-column');
      event.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
        // targetColumn.style.visibility = 'hidden';  // Torna a coluna invisível enquanto arrasta
      }, 0);
    }
  }
  
  
   handleColumnDragEnd(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.target.dataset.type === 'column') {
  
      const cards = event.target.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.visibility = 'visible'; // Restaurar a visibilidade dos cards
      });
  
  
      
      event.target.classList.remove('dragging-column');
      event.target.style.visibility = 'visible'; // Restaura a visibilidade após soltar
  
      // Remove a linha de drop, caso ela ainda esteja presente
      const dropLine = this.shadowRoot.querySelector('.drop-line-column');
      if (dropLine) {
        dropLine.remove();
      }
    }
  }
  
  
   handleColumnDragOver(event) {
    event.preventDefault();
    if( this.shadowRoot){console.log('Dragover chamado para coluna');}
    const columnsContainer = this.shadowRoot.querySelector('#gallery-columns-container');
    const draggingColumn = this.shadowRoot.querySelector('.dragging-column');
    if (!draggingColumn) return; // Se não for uma coluna, não faça nada
  
    const afterElement = this.getDragAfterColumn(columnsContainer, event.clientX);
  
    // Remover qualquer linha de drop existente
    const existingDropLine = this.shadowRoot.querySelector('.drop-line-column');
    if (existingDropLine) {
      existingDropLine.remove();
    }
  
    // Criar a nova linha de drop para colunas
    const dropLine = document.createElement('div');
    dropLine.className = 'drop-line-column';
  
    // Inserir a linha de drop na posição correta
    if (afterElement == null) {
      columnsContainer.appendChild(dropLine);
    } else {
      columnsContainer.insertBefore(dropLine, afterElement);
    }
  }
  
  // Função auxiliar para obter a posição correta para cards
   getDragAfterElement(container, y) {
    // Selecionar apenas elementos de card dentro da coluna, garantindo que não haja confusão com outros elementos
    const draggableElements = [...container.children].filter(child => 
      child.classList.contains('card') && !child.classList.contains('dragging-card')
    );
  
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
  
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  
   handleColumnDrop(event) {
    event.preventDefault();
    const draggingColumn = this.shadowRoot.querySelector('.dragging-column');
    if (!draggingColumn) return; // Se não for uma coluna, não faça nada
  
    const columnsContainer = this.shadowRoot.querySelector('#gallery-columns-container');
    const afterElement = this.getDragAfterColumn(columnsContainer, event.clientX);
  
    // Remover a linha de drop após o drop
    const dropLine = this.shadowRoot.querySelector('.drop-line-column');
    if (dropLine) {
      dropLine.remove();
    }
  
    // Inserir a coluna na nova posição
    if (afterElement == null) {
      columnsContainer.appendChild(draggingColumn);
    } else {
      columnsContainer.insertBefore(draggingColumn, afterElement);
    }
  }
  // Função auxiliar para obter a posição correta para colunas
   getDragAfterColumn(container, x) {
    const draggableElements = [...container.querySelectorAll('.gallery-column:not(.dragging-column)')];
  
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
  
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  
  
  
  
  


}

customElements.define('board-gallery', Gallery);