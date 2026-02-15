// Função para carregar dinamicamente o script de um componente
function loadComponentScript(scriptUrl) {
    return import(scriptUrl);
  }
  
  // Observer para carregar o script quando o componente entra na visualização
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
  
        if (target.tagName === "MEU-COMPONENTE-PAI") {
          await loadComponentScript("/componentes/meu-componente-pai.js");
        } else if (target.tagName === "MEU-COMPONENTE-FILHO") {
          await loadComponentScript("/componentes/meu-componente-filho.js");
        }
  
        observer.unobserve(target); // Para evitar carregamento múltiplo
      }
    });
  });
  
  // Adicionar o observer para cada tipo de componente
  document.querySelectorAll("meu-componente-pai, meu-componente-filho").forEach((element) => {
    observer.observe(element);
  });
  