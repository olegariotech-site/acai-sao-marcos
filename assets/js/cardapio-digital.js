(() => {
  'use strict';

  const DATA_URL = '/data/products.json';
  const LOGO_URL = '/assets/assetslogologo-acai-sao-marcos.png';

  const sections = [
    {
      id: 'acai',
      label: 'Açaí',
      title: 'Monte seu Açaí',
      tagline: 'Natural, trufado e montado do seu jeito.',
      price: 'A partir de R$ 16,00',
      matches: (product) => product.category === 'acai'
    },
    {
      id: 'milkshakes',
      label: 'Milk-shakes',
      title: 'Milk-shakes',
      tagline: 'Tradicionais ou trufados, gelados e cremosos.',
      price: 'A partir de R$ 16,00',
      matches: (product) => product.category === 'milkshakes'
    },
    {
      id: 'trio-do-dudu',
      label: 'Trio do Dudu',
      title: 'Trio do Dudu',
      tagline: 'Duas bolas, casquinha e calda para levar.',
      price: 'R$ 14,00',
      matches: (product) => product.id === 'trio-do-dudu'
    },
    {
      id: 'batidao',
      label: 'Batidão',
      title: 'Batidão de Açaí',
      tagline: 'Açaí batido, gelado e servido na garrafa.',
      price: 'A partir de R$ 10,00',
      matches: (product) => product.id === 'batidao-acai-15l'
    },
    {
      id: 'potes-2l',
      label: 'Potes 2 L',
      title: 'Potes e Sorvetes 2 L',
      tagline: 'Da casa e linhas Sergel para levar e compartilhar.',
      price: 'A partir de R$ 38,00',
      matches: (product) => ['pote-tradicional-dudu-2l', 'pote-mesclado-dudu-2l', 'sergel-premium-2l'].includes(product.id)
    },
    {
      id: 'picoles',
      label: 'Picolés',
      title: 'Picolés',
      tagline: 'Do Dudu e Sergel, com sabores para todos os momentos.',
      price: 'A partir de R$ 1,99',
      matches: (product) => ['picoles-do-dudu', 'picoles-sergel'].includes(product.id)
    },
    {
      id: 'agua-de-coco',
      label: 'Água de coco',
      title: 'Água de Coco Gelada',
      tagline: 'No coco ou para viagem, sempre bem gelada.',
      price: 'A partir de R$ 10,00',
      matches: (product) => product.id === 'agua-de-coco-gelada'
    }
  ];

  const supplementalProducts = [
    {
      id: 'pote-mesclado-dudu-2l',
      category: 'familia',
      name: 'Pote Mesclado do Dudu',
      shortName: '2 Litros · para levar',
      description: 'Pote mesclado de 2 litros para levar e compartilhar.',
      image: null,
      priceLabel: 'R$ 48,00',
      sizes: [{ label: '2 L', price: 48 }],
      includes: [],
      flavors: [],
      extras: [],
      notes: ['Consulte as opções disponíveis na loja.']
    },
    {
      id: 'sergel-premium-2l',
      category: 'familia',
      name: 'Sergel Premium 2 L',
      shortName: 'Linha premium · para levar',
      description: 'Sorvetes Sergel em pote de 2 litros. Consulte os sabores disponíveis no dia.',
      image: 'assets/img/produtos/sorvetes/sergel-2l-iogurte-com-amarena.webp',
      imageFallback: 'assets/img/produtos/sorvetes/sergel-2l-iogurte-com-amarena.png',
      priceLabel: 'R$ 56,00',
      sizes: [{ label: '2 L', price: 56 }],
      includes: [],
      flavors: ['Iogurte com Amarena', 'Chocolate com Pedaços'],
      extras: [],
      notes: ['Sabores e disponibilidade podem variar conforme o estoque da loja.']
    }
  ];

  let catalog = [];

  const money = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));

  const normalizeAsset = (path) => {
    if (!path) return '';
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('/')) return path;
    return `/${path.replace(/^\.\//, '')}`;
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const matchedProducts = (section) => catalog.filter(section.matches);

  const listBlock = (title, items) => {
    if (!Array.isArray(items) || !items.length) return '';
    return `
      <details>
        <summary>${escapeHtml(title)}</summary>
        <ul class="detail-list">
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </details>`;
  };

  const productMedia = (product) => {
    const image = normalizeAsset(product.imageMobile || product.image);
    const fallback = normalizeAsset(product.imageFallback || product.image);

    if (!image) {
      return `
        <div class="product-media product-media-placeholder">
          <img src="${LOGO_URL}" alt="" aria-hidden="true" />
          <strong>${escapeHtml(product.name)}</strong>
          <span class="product-price-badge">${escapeHtml(product.priceLabel || '')}</span>
        </div>`;
    }

    return `
      <div class="product-media">
        <img src="${escapeHtml(image)}" ${fallback ? `data-fallback="${escapeHtml(fallback)}"` : ''} alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" />
        <span class="product-price-badge">${escapeHtml(product.priceLabel || '')}</span>
      </div>`;
  };

  const productCard = (product) => {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const notes = Array.isArray(product.notes) ? product.notes : [];

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}">
        ${productMedia(product)}
        <div class="product-body">
          <p class="product-short">${escapeHtml(product.shortName || 'Açaí do Dudu')}</p>
          <h3>${escapeHtml(product.name)}</h3>
          ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
          ${sizes.length ? `
            <div class="size-grid" aria-label="Tamanhos e preços">
              ${sizes.map((size) => `<div class="size-item"><span>${escapeHtml(size.label)}</span><strong>${money(size.price)}</strong></div>`).join('')}
            </div>` : ''}
          <div class="product-details">
            ${listBlock('O que está incluído', product.includes)}
            ${listBlock('Sabores e opções', product.flavors)}
            ${listBlock('Adicionais e complementos', product.extras)}
          </div>
          ${notes.length ? `<p class="product-note">${notes.map(escapeHtml).join(' • ')}</p>` : ''}
        </div>
      </article>`;
  };

  const mergeSupplementals = (products) => {
    const ids = new Set(products.map((product) => product.id));
    supplementalProducts.forEach((product) => {
      if (!ids.has(product.id)) products.push(product);
    });
    return products;
  };

  const showcaseCard = (section, index) => {
    const products = matchedProducts(section);
    const representative = products[0] || {};
    const image = normalizeAsset(representative.imageMobile || representative.image);
    const fallback = normalizeAsset(representative.imageFallback || representative.image);
    const count = products.length;

    return `
      <a class="vitrine-card" href="#${section.id}" data-open-section="${section.id}" data-track="menu_showcase_${section.id}">
        <div class="vitrine-card-media">
          ${image
            ? `<img src="${escapeHtml(image)}" ${fallback ? `data-fallback="${escapeHtml(fallback)}"` : ''} alt="${escapeHtml(section.title)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`
            : `<div class="vitrine-card-placeholder"><img src="${LOGO_URL}" alt="" /></div>`}
        </div>
        <div class="vitrine-card-overlay"></div>
        <div class="vitrine-card-top"><span>${String(index + 1).padStart(2, '0')}</span><span>${count} ${count === 1 ? 'opção' : 'opções'}</span></div>
        <div class="vitrine-card-content">
          <p>${escapeHtml(section.label)}</p>
          <h3>${escapeHtml(section.title)}</h3>
          <span class="vitrine-card-tagline">${escapeHtml(section.tagline)}</span>
          <div class="vitrine-card-bottom">
            <strong>${escapeHtml(section.price)}</strong>
            <span class="vitrine-card-cta">Ver esta seção →</span>
          </div>
        </div>
      </a>`;
  };

  const renderShowcase = () => {
    const root = document.querySelector('[data-menu-showcase]');
    if (!root) return;
    root.innerHTML = sections.map(showcaseCard).join('');
  };

  const renderDetail = (section) => {
    const root = document.querySelector('[data-menu-detail-content]');
    const label = document.querySelector('[data-menu-detail-label]');
    const products = matchedProducts(section);
    if (!root) return;
    if (label) label.textContent = section.title;

    root.innerHTML = `
      <header class="detail-hero">
        <span>${escapeHtml(section.label)}</span>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.tagline)}</p>
        <strong>${escapeHtml(section.price)}</strong>
      </header>
      ${products.length
        ? `<div class="product-rail">${products.map(productCard).join('')}</div>`
        : '<div class="menu-empty">Consulte as opções disponíveis na loja.</div>'}
      <button type="button" class="menu-back-button menu-back-button-bottom" data-menu-back>← Ver outras linhas do cardápio</button>`;

    installImageFallbacks();
    installProductTracking();
  };

  const openSection = (id, { historyMode = 'push' } = {}) => {
    const section = sections.find((item) => item.id === id);
    if (!section) return showHome({ historyMode: 'replace' });

    renderDetail(section);
    document.querySelector('[data-menu-home]')?.setAttribute('hidden', '');
    document.querySelector('[data-menu-detail]')?.removeAttribute('hidden');
    document.body.classList.add('menu-detail-open');

    if (historyMode === 'push') history.pushState({ section: id }, '', `#${id}`);
    if (historyMode === 'replace') history.replaceState({ section: id }, '', `#${id}`);

    requestAnimationFrame(() => {
      const detail = document.querySelector('[data-menu-detail]');
      const top = detail ? detail.getBoundingClientRect().top + window.scrollY - 72 : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });

    track('menu_section_open', { section_id: id, section_name: section.title });
  };

  const showHome = ({ historyMode = 'push' } = {}) => {
    document.querySelector('[data-menu-detail]')?.setAttribute('hidden', '');
    document.querySelector('[data-menu-home]')?.removeAttribute('hidden');
    document.body.classList.remove('menu-detail-open');

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    if (historyMode === 'push') history.pushState({}, '', cleanUrl);
    if (historyMode === 'replace') history.replaceState({}, '', cleanUrl);

    requestAnimationFrame(() => {
      const home = document.querySelector('[data-menu-home]');
      const top = home ? home.getBoundingClientRect().top + window.scrollY - 72 : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  };

  const installImageFallbacks = () => {
    document.querySelectorAll('img[data-fallback]').forEach((image) => {
      if (image.dataset.fallbackBound === 'true') return;
      image.dataset.fallbackBound = 'true';
      image.addEventListener('error', () => {
        const fallback = image.dataset.fallback;
        if (!fallback || image.src.endsWith(fallback)) return;
        image.src = fallback;
      }, { once: true });
    });
  };

  const track = (event, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...payload });
  };

  const installProductTracking = () => {
    document.querySelectorAll('.product-card').forEach((card) => {
      if (card.dataset.trackingBound === 'true') return;
      card.dataset.trackingBound = 'true';
      card.addEventListener('pointerdown', () => {
        track('product_open', {
          product_id: card.dataset.productId,
          product_name: card.dataset.productName
        });
      }, { once: true });
    });
  };

  const installInteractions = () => {
    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open-section]');
      if (opener) {
        event.preventDefault();
        openSection(opener.dataset.openSection);
        return;
      }

      const back = event.target.closest('[data-menu-back]');
      if (back) {
        showHome();
        return;
      }

      const tracked = event.target.closest('[data-track]');
      if (tracked) {
        track('cta_click', {
          cta: tracked.dataset.track,
          destination: tracked.href || window.location.href
        });
      }
    });

    window.addEventListener('popstate', () => {
      const id = window.location.hash.replace('#', '');
      if (sections.some((section) => section.id === id)) openSection(id, { historyMode: 'none' });
      else showHome({ historyMode: 'none' });
    });
  };

  const showLoadError = () => {
    const root = document.querySelector('[data-menu-showcase]');
    if (!root) return;
    root.innerHTML = '<div class="menu-empty">Não foi possível carregar o cardápio agora. Atualize a página ou fale com o Dudu pelo WhatsApp.</div>';
  };

  const init = async () => {
    installInteractions();

    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      catalog = mergeSupplementals(Array.isArray(data.products) ? [...data.products] : []);
      renderShowcase();
      installImageFallbacks();

      const initialId = window.location.hash.replace('#', '');
      if (sections.some((section) => section.id === initialId)) openSection(initialId, { historyMode: 'replace' });
      else showHome({ historyMode: 'replace' });
    } catch (error) {
      console.error('[Açaí do Dudu] Falha ao carregar o cardápio visual:', error);
      showLoadError();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
