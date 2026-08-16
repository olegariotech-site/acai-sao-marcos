(() => {
  const PRODUCT_CATEGORY = {
    'acai-natural': 'acai',
    'acai-trufado': 'acai'
  };

  const productGrid = () => document.querySelector('[data-product-grid]');

  const scrollToProducts = () => {
    const target = productGrid() || document.querySelector('#cardapio');
    if (!target) return;
    const offset = 154;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const getCategoryButton = (categoryId) =>
    document.querySelector(`[data-category="${CSS.escape(categoryId)}"]`);

  const activateCategory = (categoryId, { scroll = true } = {}) => {
    const button = getCategoryButton(categoryId);
    if (!(button instanceof HTMLElement)) {
      document.querySelector('#cardapio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }

    button.click();
    if (scroll) {
      window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToProducts));
    }
    return true;
  };

  const openRenderedProduct = (productId) => {
    const card = document.querySelector(`[data-product-id="${CSS.escape(productId)}"]`);
    if (!(card instanceof HTMLElement)) return false;
    card.click();
    return true;
  };

  const openProduct = (productId) => {
    if (openRenderedProduct(productId)) return;

    const categoryId = PRODUCT_CATEGORY[productId];
    if (categoryId) activateCategory(categoryId, { scroll: false });

    let attempts = 0;
    const tryOpen = () => {
      attempts += 1;
      if (openRenderedProduct(productId)) return;
      if (attempts < 6) window.requestAnimationFrame(tryOpen);
      else scrollToProducts();
    };
    window.requestAnimationFrame(tryOpen);
  };

  // Take ownership of the white quick cards before generic hash handlers run.
  document.addEventListener('click', (event) => {
    const quick = event.target instanceof Element ? event.target.closest('.quick-item') : null;
    if (!(quick instanceof HTMLAnchorElement)) return;

    const productId = quick.dataset.quickProduct;
    const categoryId = quick.dataset.quickCategory;
    if (!productId && !categoryId) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (productId) openProduct(productId);
    else activateCategory(categoryId);
  }, true);

  // Category tabs already filter in site-v2.js. This adds clear navigation to the result grid.
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-category]') : null;
    if (!(button instanceof HTMLElement)) return;
    window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToProducts));
  });

  // Explicit keyboard support for desktop/notebook accessibility.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const quick = event.target instanceof Element ? event.target.closest('.quick-item') : null;
    if (!(quick instanceof HTMLAnchorElement)) return;

    const productId = quick.dataset.quickProduct;
    const categoryId = quick.dataset.quickCategory;
    if (!productId && !categoryId) return;

    event.preventDefault();
    if (productId) openProduct(productId);
    else activateCategory(categoryId);
  });
})();
