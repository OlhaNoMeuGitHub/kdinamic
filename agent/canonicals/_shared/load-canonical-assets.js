const cacheKey = "__agentCanonicalAssetsCache";

function getAssetCache() {
  if (!globalThis[cacheKey]) {
    globalThis[cacheKey] = new Map();
  }
  return globalThis[cacheKey];
}

export async function loadCanonicalAssets(component, importMetaUrl, baseName) {
  const cache = getAssetCache();
  const cacheId = `${importMetaUrl}:${baseName}`;

  if (!cache.has(cacheId)) {
    const htmlUrl = new URL(`./${baseName}.html`, importMetaUrl);
    const cssUrl = new URL(`./${baseName}.css`, importMetaUrl);

    const assetPromise = Promise.all([
      fetch(htmlUrl).then((response) => response.text()),
      fetch(cssUrl).then((response) => response.text()),
    ]).then(([htmlContent, cssContent]) => ({ htmlContent, cssContent }));

    cache.set(cacheId, assetPromise);
  }

  const { htmlContent, cssContent } = await cache.get(cacheId);
  component.shadowRoot.innerHTML = `
    <style>${cssContent}</style>
    ${htmlContent}
  `;
}
