// Função utilitária para carregar dinamicamente um componente
export async function loadComponentIfNotExists(tagName) {
  if (!customElements.get(tagName)) {
    // Define o caminho dinamicamente com base no nome do componente
    const modulePath = `/componentes/${tagName}/${tagName}.js`;
    await import(modulePath);
  }
}


export async function loadMaterialsIfNotExists(tagName) {
  if (!customElements.get(tagName)) {
    // Define o caminho dinamicamente com base no nome do componente
    const modulePath = `/Materials/${tagName}/${tagName}.js`;
    await import(modulePath);
  }
}


// Cache global para assets carregados
if (!window._materialsAssetsCache) {
  window._materialsAssetsCache = new Map();
}

// Cache global para promessas de carregamento em andamento
if (!window._loadingMaterialsPromises) {
  window._loadingMaterialsPromises = new Map();
}

export async function loadMaterialsAssets(component, tagName) {
  try {
    // Verifica se o conteúdo já está no cache (assets já carregados)
    if (window._materialsAssetsCache.has(tagName)) {
      const { htmlContent, cssContent } = window._materialsAssetsCache.get(tagName);

      // Insere no shadowRoot
      component.shadowRoot.innerHTML = `
        <style>${cssContent}</style>
        ${htmlContent}
      `;
      return;
    }

    // Verifica se já existe uma promessa em andamento para o mesmo tagName
    if (!window._loadingMaterialsPromises.has(tagName)) {
      // Cria uma promessa de carregamento
      const loadPromise = (async () => {
        const htmlPath = `/Materials/${tagName}/${tagName}.html`;
        const cssPath = `/Materials/${tagName}/${tagName}.css`;

        // Busca o conteúdo dos arquivos HTML e CSS
        const [htmlContent, cssContent] = await Promise.all([
          fetch(htmlPath).then((res) => res.text()),
          fetch(cssPath).then((res) => res.text()),
        ]);

        // Armazena os conteúdos no cache
        window._materialsAssetsCache.set(tagName, { htmlContent, cssContent });

        // Retorna os conteúdos carregados
        return { htmlContent, cssContent };
      })();

      // Armazena a promessa no cache de promessas em andamento
      window._loadingMaterialsPromises.set(tagName, loadPromise);

      // Aguarda o carregamento
      const result = await loadPromise;

      // Remove a promessa do cache de promessas após a conclusão
      window._loadingMaterialsPromises.delete(tagName);

      // return result;
    }

    await window._loadingMaterialsPromises.get(tagName);

    // Se já houver uma promessa em andamento, aguarda a sua conclusão
    const { htmlContent, cssContent } =  window._materialsAssetsCache.get(tagName);

    // Insere no shadowRoot
    component.shadowRoot.innerHTML = `
      <style>${cssContent}</style>
      ${htmlContent}
    `;
  } catch (error) {
    console.error(`Erro ao carregar os assets para ${tagName}:`, error);
  }
}


// Cache global para assets carregados
if (!window._componentAssetsCache) {
  window._componentAssetsCache = new Map();
}

// Cache global para promessas de carregamento em andamento
if (!window._loadingAssetsPromises) {
  window._loadingAssetsPromises = new Map();
}

export async function loadComponentAssets(component, tagName) {
  try {
    // Verifica se o conteúdo já está no cache (assets já carregados)
    if (window._componentAssetsCache.has(tagName)) {
      const { htmlContent, cssContent } = window._componentAssetsCache.get(tagName);

      // Insere no shadowRoot
      component.shadowRoot.innerHTML = `
        <style>${cssContent}</style>
        ${htmlContent}
      `;
      return;
    }

    // Verifica se já existe uma promessa em andamento para o mesmo tagName
    if (!window._loadingAssetsPromises.has(tagName)) {
      // Cria uma promessa de carregamento
      const loadPromise = (async () => {
        const htmlPath = `/componentes/${tagName}/${tagName}.html`;
        const cssPath = `/componentes/${tagName}/${tagName}.css`;

        // Busca o conteúdo dos arquivos HTML e CSS
        const [htmlContent, cssContent] = await Promise.all([
          fetch(htmlPath).then((res) => res.text()),
          fetch(cssPath).then((res) => res.text()),
        ]);

        // Armazena os conteúdos no cache
        window._componentAssetsCache.set(tagName, { htmlContent, cssContent });

        // Retorna os conteúdos carregados
        return { htmlContent, cssContent };
      })();

      // Armazena a promessa no cache de promessas em andamento
      window._loadingAssetsPromises.set(tagName, loadPromise);

      // Aguarda o carregamento
      const result = await loadPromise;

      // Remove a promessa do cache de promessas após a conclusão
      window._loadingAssetsPromises.delete(tagName);

      // return result;
    }

    await window._loadingAssetsPromises.get(tagName);

    // Se já houver uma promessa em andamento, aguarda a sua conclusão
    const { htmlContent, cssContent } = await window._componentAssetsCache.get(tagName);

    // Insere no shadowRoot
    component.shadowRoot.innerHTML = `
      <style>${cssContent}</style>
      ${htmlContent}
    `;
  } catch (error) {
    console.error(`Erro ao carregar os assets para ${tagName}:`, error);
  }
}
