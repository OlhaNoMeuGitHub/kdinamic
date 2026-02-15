import { loadComponentAssets } from "../../../../utils.js";

class Gallery extends HTMLElement {
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
    await loadComponentAssets(this, "gallery");
    

    // Adicionar evento para criar novas colunas
    this.shadowRoot.querySelector('#gallery-create-column').addEventListener('click',this.createColumn.bind(this));
    this.shadowRoot.querySelectorAll('.gallery-create-card').forEach(button => {
        button.addEventListener('click', () => this.createCard(button.dataset.column));
        // Adicionar eventos de drag and drop para todos os cards e colunas
      this.shadowRoot.querySelectorAll('.gallery-card-column').forEach(column => {
        column.dataset.type = 'card-column'; // Marcar como coluna de cards
    
      });
    
      });

    // Adicionar eventos de drag and drop para todas as colunas existentes
    this.shadowRoot.querySelectorAll('.gallery-column').forEach(column => {
        const columnId = column.id.split('-').pop(); // Extrai o ID da coluna
        this.enableColumnTitleEdit(columnId); // Permitir a edição do título da coluna
        column.setAttribute('draggable', true);
        column.dataset.type = 'column'; // Marcar como coluna
        column.addEventListener('dragstart', this.handleColumnDragStart.bind(this));
        column.addEventListener('dragend', this.handleColumnDragEnd.bind(this));
        column.addEventListener('dragover', this.handleColumnDragOver.bind(this));
        column.addEventListener('drop', this.handleColumnDrop.bind(this));
      });
    
      // Adicionar eventos de drag and drop para todos os cards e colunas
      this.shadowRoot.querySelectorAll('.gallery-card-column').forEach(column => {
        column.dataset.type = 'card-column'; // Marcar como coluna de cards
        column.addEventListener('dragstart', this.handleCardDragStart.bind(this));
        column.addEventListener('dragend', this.handleCardDragEnd.bind(this));
    
      });
    
      // Atualizar a visibilidade das colunas de cards ao carregar o componente
      this.shadowRoot.querySelectorAll('.gallery-column').forEach(column => {
        const columnId = column.id.split('-').pop(); // Pega o ID numérico da coluna
        this.updateColumnVisibility(columnId); // Atualiza a visibilidade da coluna
      });



      this.initializeColumnEvents(); 


}


// Função para verificar a visibilidade da coluna
updateColumnVisibility(columnId) {
    const cardColumn = this.shadowRoot.querySelector(`#gallery-card-column-${columnId}`);
    cardColumn.style.display = 'block';
    // // Verifica se há cards na coluna
    // if (cardColumn && cardColumn.children.length === 0) {
    //   cardColumn.style.display = 'none'; // Esconde a coluna se estiver vazia
    // } else if (cardColumn) {
    //   cardColumn.style.display = 'block'; // Mostra a coluna se houver cards
    // }
  }
  
  // Função para criar colunas
   createColumn() {
    const columnsContainer = this.shadowRoot.querySelector('#gallery-columns-container');
    const columnCount = this.shadowRoot.querySelectorAll('.gallery-column').length + 1;
  
    // Criar nova coluna
    const newColumn = document.createElement('div');
    newColumn.className = 'gallery-column';
    newColumn.id = `gallery-column-${columnCount}`;
    // newColumn.setAttribute('draggable', true); // Coluna arrastável
    newColumn.dataset.type = 'column'; // Identifica como coluna
    // Estrutura da coluna com título editável e ícone de movimentação
    newColumn.innerHTML = `
      <div class="column-header">
        <span class="move-icon">⋮⋮</span> <!-- Símbolo de movimentação -->
        <h2 class="column-title">Coluna ${columnCount}</h2>
      </div>
      <button class="gallery-create-card" data-column="${columnCount}">Criar Card</button>
      <div class="gallery-card-column" id="gallery-card-column-${columnCount}" data-type="card-column"></div>
    `;
  
    columnsContainer.appendChild(newColumn);
    
    // Permitir que o nome da coluna seja editado
    this.enableColumnTitleEdit(columnCount);
  
    // Adicionar evento de criação de card à nova coluna
    const createCardButton = newColumn.querySelector('.gallery-create-card');
    createCardButton.addEventListener('click', () => this.createCard(createCardButton.dataset.column));
  
    // Inicialmente esconder a coluna de cards se estiver vazia
    this.updateColumnVisibility(columnCount);
  
  
    // Adicionar evento de movimentação da coluna através do ícone
    const moveIcon = newColumn.querySelector('.move-icon');
    moveIcon.addEventListener('mousedown', (event) => {
      // Permitir que o arrasto só comece a partir do ícone de movimentação
      newColumn.setAttribute('draggable', true);
    });
  
  
    // Adicionar eventos de drag and drop para as colunas
    newColumn.addEventListener('dragstart', this.handleColumnDragStart.bind(this));
    newColumn.addEventListener('dragend', this.handleColumnDragEnd.bind(this));
    newColumn.addEventListener('dragover', this.handleColumnDragOver.bind(this));
    newColumn.addEventListener('drop', this.handleColumnDrop.bind(this));
  
    this.initializeColumnEvents(); // Inicializa eventos nas colunas existentes
  }
  
  
  // Função para inicializar eventos nas colunas existentes
   initializeColumnEvents() {
    this.shadowRoot.querySelectorAll('.gallery-column').forEach(column => {
      const cardColumn = column.querySelector('.gallery-card-column');
      cardColumn.addEventListener('dragstart', this.handleCardDragStart.bind(this)); // Evento de dragover para todos
      cardColumn.addEventListener('dragend', this.handleCardDragEnd.bind(this)); // Evento de drop para todos
      cardColumn.addEventListener('dragover', this.handleCardDragOver.bind(this)); // Evento de dragover para todos
      cardColumn.addEventListener('drop', this.handleCardDrop.bind(this)); // Evento de drop para todos
    });
  }
  
  // Função para criar cards
   createCard(columnId) {
    console.log(`Criando card na coluna ${columnId}`);
    const cardColumn = this.shadowRoot.querySelector(`#gallery-card-column-${columnId}`);
  
    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true; // Torna o card arrastável
    card.dataset.type = 'card'; // Identifica como card
  
  
  
  
  
  
    // Cria o campo de texto
    const textArea = document.createElement('textarea');
    textArea.placeholder = 'Digite seu texto aqui...';
  
    // Cria o botão de salvar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Salvar';
  
    saveButton.onclick =  () =>{
      textArea.disabled = true;
  
    // Adicionar ícone de menu no canto superior direito
    const menuIcon = document.createElement('span');
    menuIcon.className = 'card-menu-icon';
    menuIcon.innerHTML = '⋮'; // Ícone de três pontos
  
    // Cria o menu suspenso
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'card-dropdown-menu';
    dropdownMenu.innerHTML = `
      <button class="dropdown-item delete-card">Excluir</button>
    `;
  
      // Exibir ou esconder o menu ao clicar no ícone de três pontos
      menuIcon.addEventListener('click', () => {
        console.log('Clicou no ícone de menu');
        dropdownMenu.classList.toggle('show-menu');
      });
  
      // // Fechar o menu suspenso ao clicar fora
      this.shadowRoot.addEventListener('click', () => {
        dropdownMenu.classList.remove('show-menu');
      });
  
  
  
          // Cria o botão de edição
      // Cria o botão de edição que vai alternar para "Salvar" durante a edição
      const editButton = document.createElement('button');
      editButton.textContent = 'Editar';
      editButton.className = 'edit-button';
      editButton.onclick =  () => {
        if (editButton.textContent === 'Editar') {
          this.enableCardEdit(card, textArea, editButton); // Função para habilitar a edição e alternar botão
        } else {
          this.saveCardText(card, textArea, editButton); // Função para salvar o texto e alternar de volta para "Editar"
        }
      };
  
      // Lógica para excluir o card
      const deleteButton = dropdownMenu.querySelector('.delete-card');
      deleteButton.onclick =  () => {
        console.log('Botão Excluir clicado');
        card.remove();
        this.updateColumnVisibility(columnId); // Atualiza a visibilidade após remover o card
      };
  
  
      card.appendChild(menuIcon); 
      // card.appendChild(deleteButton);
      card.appendChild(editButton);
      card.appendChild(dropdownMenu);
      saveButton.remove();
  
      this.addLikeButton(card);
    };
  
  
  
  
  
  
    card.appendChild(textArea);
    card.appendChild(saveButton);
    
  
    cardColumn.appendChild(card);
  
    // Após criar o card, atualize a visibilidade da coluna
    this.updateColumnVisibility(columnId);
  }
  
   enableCardEdit(card, textArea, editButton) {
    textArea.disabled = false; // Habilitar a edição do texto
    textArea.focus(); // Colocar o foco no campo de texto para edição
    editButton.textContent = 'Salvar'; // Alterar o botão para "Salvar"
  
    // O texto será salvo automaticamente ao clicar em "Salvar"
  }
  
   saveCardText(card, textArea, editButton) {
    textArea.disabled = true; // Desabilitar a edição após salvar
    editButton.textContent = 'Editar'; // Alterar o botão de volta para "Editar"
  
    // O texto agora foi salvo, nada mais precisa ser feito aqui
  }
  
   addLikeButton(card) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'card-actions';
  
    const likeButton = document.createElement('button');
    likeButton.textContent = '👍';
    likeButton.className = 'like-button';
  
    const likeCounter = document.createElement('span');
    likeCounter.textContent = '0';
    likeCounter.className = 'like-counter';
  
    const removeLikesButton = document.createElement('button');
    removeLikesButton.textContent = 'X';
    removeLikesButton.className = 'remove-likes-button';
  
    likeButton.onclick =  () => {
      const count = parseInt(likeCounter.textContent, 10);
      likeCounter.textContent = count + 1;
      removeLikesButton.style.display = 'inline';
    };
  
    removeLikesButton.onclick = () =>  {
      likeCounter.textContent = '0';
      removeLikesButton.style.display = 'none';
    };
  
    actionsContainer.appendChild(likeButton);
    actionsContainer.appendChild(likeCounter);
    actionsContainer.appendChild(removeLikesButton);
  
    card.appendChild(actionsContainer);
  }
  
  
  
  // Funções de arrastar e soltar (drag-and-drop) para as colunas
   handleColumnDragStart(event) {
    if (event.target.dataset.type === 'column') {
      const cards = event.target.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.visibility = 'hidden'; // Ocultar os cards durante o arrasto
      });
      event.target.classList.add('dragging-column');
      event.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
        event.target.style.visibility = 'hidden'; // Torna a coluna invisível enquanto arrasta
      }, 0);
    }
  }
  
  
   handleColumnDragEnd(event) {
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
  
  
  
   handleCardDragStart(event) {
    console.log('Card drag iniciado');
    event.target.classList.add('dragging-card');
    setTimeout(() => {
      event.target.style.visibility = 'hidden'; // Torna o card invisível enquanto arrasta
    }, 0);
  }
  
   handleCardDragOver(event) {
    event.preventDefault(); // Permite que o card seja solto na área de drop
    console.log('Dragover chamado para card');
  
    const cardColumn = event.currentTarget;  // Certifique-se de que estamos lidando com a coluna correta
    const draggingCard = this.shadowRoot.querySelector('.dragging-card');
    const afterElement = this.getDragAfterElement(cardColumn, event.clientY);  // Verificar posição entre outros cards
  
    // Remover qualquer linha de drop existente
    const existingDropLine = this.shadowRoot.querySelector('.drop-line-card');
    if (existingDropLine) {
      existingDropLine.remove();
    }
  
    // Criar a nova linha de drop
    const dropLine = document.createElement('div');
    dropLine.className = 'drop-line-card';
  
    // Inserir a linha de drop na posição correta dentro da coluna
    if (afterElement == null) {
      cardColumn.appendChild(dropLine); // Adicionar ao final da coluna
    } else {
      cardColumn.insertBefore(dropLine, afterElement);  // Inserir antes do próximo card na coluna
    }
  }
  
    
     handleCardDrop(event) {
      event.preventDefault();
      console.log('Drop chamado para card');
    
      const draggingCard = this.shadowRoot.querySelector('.dragging-card');
      const cardColumn = event.currentTarget;  // Certificando-se que estamos no nível da coluna correta
    
      const dropLine = this.shadowRoot.querySelector('.drop-line-card');
      if (dropLine) {
        dropLine.remove(); // Remove a linha de drop se ela existir
      }
    
      // Garantir que o card seja inserido como irmão de outros cards (não dentro de outro card)
      const afterElement = this.getDragAfterElement(cardColumn, event.clientY);
      if (afterElement == null) {
        cardColumn.appendChild(draggingCard); // Se não houver elemento depois, adicionar ao final da coluna
      } else if (draggingCard){
        cardColumn.insertBefore(draggingCard, afterElement); // Inserir antes do próximo card na coluna
        draggingCard.classList.remove('dragging-card');
      }
    
    }
  
   handleCardDragEnd(event) {
    console.log('Card drag finalizado');
    event.target.classList.remove('dragging-card');
    event.target.style.visibility = 'visible'; // Restaura a visibilidade após soltar
    const dropLine = this.shadowRoot.querySelector('.drop-line-card');
    if (dropLine) dropLine.remove();
  }
  
   enableColumnTitleEdit(columnId) {
    const column = this.shadowRoot.querySelector(`#gallery-column-${columnId}`);
    const columnTitle = column.querySelector('.column-title');
    
    columnTitle.addEventListener('click',  () =>{
      const currentTitle = columnTitle.textContent;
      
      // Criar um campo de entrada para editar o nome da coluna
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentTitle;
      input.classList.add('edit-title-input');
      columnTitle.replaceWith(input);
      input.focus();
  
      // Manter o título da coluna ao pressionar Enter ou sair do campo de entrada
      input.addEventListener('blur',  () =>  {
        this.updateColumnTitle(input, columnId);
      });
      input.addEventListener('keypress',  (e) => {
        if (e.key === 'Enter') {
          this.updateColumnTitle(input, columnId);
        }
      });
    });
  }
  
   updateColumnTitle(input, columnId) {
    const newTitle = input.value.trim() || `Coluna ${columnId}`;
    
    // Substituir o campo de entrada pelo título atualizado
    const h2 = document.createElement('h2');
    h2.textContent = newTitle;
    h2.classList.add('column-title');
    
    input.replaceWith(h2);
    
    // Permitir que o nome da coluna seja editado novamente no futuro
    this.enableColumnTitleEdit(columnId);
  }

}

customElements.define("gallery", Gallery);