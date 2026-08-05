document.addEventListener('DOMContentLoaded', () => {
  const state = {
    catalog: null,
    activeCategory: 'destaques',
    activeProduct: null,
    lastFocused: null
  };

  const elements = {
    header: document.querySelector('.site-header'),
    menuToggle: document.querySelector('[data-menu-open]'),
    menuClose: document.querySelector('[data-menu-close]'),
    mobileMenu: document.querySelector('.mobile-menu'),
    categoryRail: document.querySelector('[data-category-rail]'),
    productGrid: document.querySelector('[data-product-grid]'),
    offerGrid: document.querySelector('[data-offer-grid]'),
    galleryGrid: document.querySelector('[data-gallery-grid]'),
    modal: document.querySelector('.product-modal'),
    modalDialog: document.querySelector('.modal-dialog'),
    modalClose: document.querySelector('[data-modal-close]'),
    modalMedia: document.querySelector('[data-modal-media]'),
    modalCategory: document.querySelector('[data-modal-category]'),
    modalTitle: document.querySelector('[data-modal-title]'),
    modalDescription: document.querySelector('[data-modal-description]'),
    modalSizes: document.querySelector('[data-modal-sizes]'),
    modalIncludesBlock: document.querySelector('[data-modal-includes-block]'),
    modalIncludes: document.querySelector('[data-modal-includes]'),
    modalFlavorsBlock: document.querySelector('[data-modal-flavors-block]'),
    modalFlavors: document.querySelector('[data-modal-flavors]'),
    modalExtrasBlock: document.querySelector('[data-modal-extras-block]'),
    modalExtras: document.querySelector('[data-modal-extras]'),
    modalNotes: document.querySelector('[data-modal-notes]'),
    modalWhatsapp: document.querySelector('[data-modal-whatsapp]'),
    modalIfood: document.querySelector('[data-modal-ifood]')
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

  const escapeHTML = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const track = (eventName, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
  };

  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    elements.mobileMenu?.setAttribute('aria-hidden', String(!open));
    elements.menuToggle?.setAttribute('aria-expanded', String(open));
    if (open) {
      elements.menuClose?.focus({ preventScroll: true });
    } else {
      elements.menuToggle?.focus({ preventScroll: true });
    }
  };

  elements.menuToggle?.addEventListener('click', () => setMenu(true));
  elements.menuClose?.addEventListener('click', () => setMenu(false));

  document.querySelectorAll('.mobile-menu a, a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const updateHeader = () => {
    elements.header?.classList.toggle('scrolled', window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const renderCategories = () => {
    if (!state.catalog || !elements.categoryRail) return;

    elements.categoryRail.innerHTML = state.catalog.categories.map((category) => `
      <button
        type="button"
        class="category-button${category.id === state.activeCategory ? ' active' : ''}"
        data-category="${escapeHTML(category.id)}"
        aria-pressed="${category.id === state.activeCategory}"
      >${escapeHTML(category.label)}</button>
    `).join('');

    elements.categoryRail.querySelectorAll('[data-category]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeCategory = button.dataset.category;
        renderCategories();
        renderProducts();
        track('catalog_category_select', { category: state.activeCategory });
      });
    });
  };

  const getVisibleProducts = () => {
    if (!state.catalog) return [];
    if (state.activeCategory === 'destaques') {
      return state.catalog.products.filter((product) => product.featured);
    }
    return state.catalog.products.filter((product) => product.category === state.activeCategory);
  };

  const productCardTemplate = (product) => `
    <article
      class="product-card"
      role="button"
      tabindex="0"
      data-product-id="${escapeHTML(product.id)}"
      aria-label="Ver detalhes de ${escapeHTML(product.name)}"
      data-reveal
    >
      <div class="product-card-media">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" />
      </div>
      <div class="product-card-content">
        <span class="product-card-label">${escapeHTML(product.shortName || product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>
        <div class="product-card-bottom">
          <strong class="product-card-price">${escapeHTML(product.priceLabel)}</strong>
          <span class="product-card-cta" aria-hidden="true">+</span>
        </div>
      </div>
    </article>
  `;

  const renderProducts = () => {
    if (!elements.productGrid) return;
    const products = getVisibleProducts();

    if (!products.length) {
      elements.productGrid.innerHTML = '<div class="product-empty">Nenhum produto cadastrado nesta categoria ainda.</div>';
      return;
    }

    elements.productGrid.innerHTML = products.map(productCardTemplate).join('');

    elements.productGrid.querySelectorAll('[data-product-id]').forEach((card) => {
      const open = () => openProduct(card.dataset.productId, card);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });

    observeReveals(elements.productGrid);
  };

  const renderOffers = () => {
    if (!state.catalog || !elements.offerGrid) return;
    const offers = state.catalog.products.filter((product) => product.offer).slice(0, 4);

    elements.offerGrid.innerHTML = offers.map((product) => {
      const firstSize = product.sizes?.[0];
      return `
        <button type="button" class="offer-card" data-offer-id="${escapeHTML(product.id)}">
          <span>Preço em destaque</span>
          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <strong class="offer-price">${firstSize ? formatCurrency(firstSize.price) : escapeHTML(product.priceLabel)}</strong>
          </div>
          <span>${firstSize ? escapeHTML(firstSize.label) : 'Confira os detalhes'} · abrir produto</span>
        </button>
      `;
    }).join('');

    elements.offerGrid.querySelectorAll('[data-offer-id]').forEach((button) => {
      button.addEventListener('click', () => openProduct(button.dataset.offerId, button));
    });
  };

  const renderGallery = () => {
    if (!state.catalog || !elements.galleryGrid) return;
    elements.galleryGrid.innerHTML = state.catalog.gallery.map((item) => `
      <figure class="gallery-item" data-reveal>
        <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async" />
      </figure>
    `).join('');
    observeReveals(elements.galleryGrid);
  };

  const listTemplate = (items = [], className = 'detail-list') => `
    <ul class="${className}">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
  `;

  const buildWhatsAppUrl = (product) => {
    const message = `Olá! Vim pelo site do Açaí do Dudu e quero pedir ${product.name}. Pode me confirmar as opções e a disponibilidade?`;
    return `${state.catalog.meta.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  const toggleBlock = (block, visible) => {
    if (block) block.hidden = !visible;
  };

  const openProduct = (productId, trigger) => {
    if (!state.catalog || !elements.modal) return;
    const product = state.catalog.products.find((item) => item.id === productId);
    if (!product) return;

    state.activeProduct = product;
    state.lastFocused = trigger || document.activeElement;

    elements.modalMedia.src = product.image;
    elements.modalMedia.alt = product.name;
    elements.modalCategory.textContent = product.shortName || product.category;
    elements.modalTitle.textContent = product.name;
    elements.modalDescription.textContent = product.description;

    elements.modalSizes.innerHTML = product.sizes.map((size) => `
      <div class="size-item">
        <span>${escapeHTML(size.label)}</span>
        <strong>${formatCurrency(size.price)}</strong>
      </div>
    `).join('');

    toggleBlock(elements.modalIncludesBlock, product.includes.length > 0);
    elements.modalIncludes.innerHTML = product.includes.length ? listTemplate(product.includes) : '';

    toggleBlock(elements.modalFlavorsBlock, product.flavors.length > 0);
    elements.modalFlavors.innerHTML = product.flavors.length ? listTemplate(product.flavors, 'chip-list') : '';

    toggleBlock(elements.modalExtrasBlock, product.extras.length > 0);
    elements.modalExtras.innerHTML = product.extras.length ? listTemplate(product.extras) : '';

    const notes = [...product.notes, state.catalog.meta.priceDisclaimer].filter(Boolean);
    elements.modalNotes.innerHTML = notes.map((note) => `<p>${escapeHTML(note)}</p>`).join('');

    elements.modalWhatsapp.href = buildWhatsAppUrl(product);
    elements.modalIfood.href = state.catalog.meta.ifood;

    elements.modal.classList.add('open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => elements.modalClose?.focus({ preventScroll: true }), 80);

    track('product_open', { product_id: product.id, product_name: product.name });
  };

  const closeProduct = () => {
    if (!elements.modal?.classList.contains('open')) return;
    elements.modal.classList.remove('open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    state.lastFocused?.focus?.({ preventScroll: true });
    state.activeProduct = null;
  };

  elements.modalClose?.addEventListener('click', closeProduct);
  elements.modal?.addEventListener('click', (event) => {
    if (event.target.matches('[data-modal-backdrop]')) closeProduct();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (document.body.classList.contains('menu-open')) setMenu(false);
      if (elements.modal?.classList.contains('open')) closeProduct();
    }

    if (event.key === 'Tab' && elements.modal?.classList.contains('open')) {
      const focusable = [...elements.modalDialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((item) => !item.disabled && item.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.querySelectorAll('[data-track]').forEach((link) => {
    link.addEventListener('click', () => {
      track('cta_click', {
        cta: link.dataset.track,
        destination: link.href
      });
    });
  });

  let revealObserver;
  const createRevealObserver = () => {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });
  };

  function observeReveals(scope = document) {
    if (!revealObserver) createRevealObserver();
    scope.querySelectorAll?.('[data-reveal]:not(.revealed)').forEach((item) => revealObserver.observe(item));
  }

  const loadCatalog = async () => {
    try {
      const response = await fetch('data/products.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Falha ao carregar catálogo: ${response.status}`);
      state.catalog = await response.json();
      renderCategories();
      renderOffers();
      renderProducts();
      renderGallery();
    } catch (error) {
      console.error(error);
      if (elements.productGrid) {
        elements.productGrid.innerHTML = '<div class="product-empty">O cardápio não carregou agora. Use os botões de WhatsApp ou iFood para consultar os produtos.</div>';
      }
    }
  };

  observeReveals();
  loadCatalog();
});
