(() => {
  'use strict';

  const DATA_URL = '../data/products.json';
  const LOGO_URL = '../assets/assetslogologo-acai-sao-marcos.png';

  const sections = [
    {
      id: 'acai',
      label: 'Açaí',
      title: 'Monte seu Açaí',
      description: 'Escolha o tamanho, a base e capriche nas frutas, coberturas e acompanhamentos.',
      matches: (product) => product.category === 'acai'
    },
    {
      id: 'milkshakes',
      label: 'Milk-shakes',
      title: 'Milk-shakes',
      description: 'Tradicionais ou trufados, em vários tamanhos e sabores.',
      matches: (product) => product.category === 'milkshakes'
    },
    {
      id: 'trio-do-dudu',
      label: 'Trio do Dudu',
      title: 'Trio do Dudu',
      description: 'Duas bolas, casquinha e calda em uma combinação feita para levar.',
      matches: (product) => product.id === 'trio-do-dudu'
    },
    {
      id: 'batidao',
      label: 'Batidão',
      title: 'Batidão de Açaí',
      description: 'Açaí batido com água, servido gelado na garrafa.',
      matches: (product) => product.id === 'batidao-acai-15l'
    },
    {
      id: 'sorvetes-para-levar',
      label: 'Sorvetes & picolés',
      title: 'Sorvetes, picolés e para levar',
      description: 'Potes, picolés do Dudu, linhas Sergel e opções para levar para casa.',
      matches: (product) => (
        (product.category === 'sorvetes' && product.id !== 'trio-do-dudu') ||
        (product.category === 'familia' && !['agua-de-coco-gelada', 'batidao-acai-15l'].includes(product.id))
      )
    },
    {
      id: 'agua-de-coco',
      label: 'Água de coco',
      title: 'Água de Coco Gelada',
      description: 'No coco ou para viagem, sempre bem gelada.',
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

  const money = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));

  const normalizeAsset = (path) => {
    if (!path) return '';
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('../')) return path;
    return path.startsWith('assets/') ? `../${path}` : path;
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
        <div class="product-media">
          <div class="product-media-placeholder">
            <div>
              <img src="${LOGO_URL}" alt="" aria-hidden="true" />
              <strong>${escapeHtml(product.name)}</strong>
            </div>
          </div>
          <span class="product-price-badge">${escapeHtml(product.priceLabel || '')}</span>
        </div>`;
    }

    return `
      <div class="product-media">
        <img
          src="${escapeHtml(image)}"
          ${fallback ? `data-fallback="${escapeHtml(fallback)}"` : ''}
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          decoding="async"
        />
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
          <div class="product-title-row">
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              ${product.shortName ? `<p class="product-short">${escapeHtml(product.shortName)}</p>` : ''}
            </div>
          </div>
          ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
          ${sizes.length ? `
            <div class="size-grid" aria-label="Tamanhos e preços">
              ${sizes.map((size) => `
                <div class="size-item">
                  <span>${escapeHtml(size.label)}</span>
                  <strong>${money(size.price)}</strong>
                </div>`).join('')}
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

  const renderNav = () => {
    const nav = document.querySelector('[data-menu-category-nav]');
    if (!nav) return;
    nav.innerHTML = sections.map((section, index) => `
      <a class="menu-category-link${index === 0 ? ' is-active' : ''}" href="#${section.id}" data-menu-category-link="${section.id}">
        ${escapeHtml(section.label)}
      </a>`).join('');
  };

  const renderSections = (products) => {
    const root = document.querySelector('[data-menu-sections]');
    if (!root) return;

    root.innerHTML = sections.map((section) => {
      const matched = products.filter(section.matches);
      return `
        <section class="menu-section" id="${section.id}" data-menu-section="${section.id}">
          <div class="menu-section-head">
            <div>
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.description)}</p>
            </div>
            <span class="menu-section-counter">${matched.length} ${matched.length === 1 ? 'opção' : 'opções'}</span>
          </div>
          ${matched.length
            ? `<div class="product-rail">${matched.map(productCard).join('')}</div>`
            : '<div class="menu-empty">Consulte as opções disponíveis na loja.</div>'}
        </section>`;
    }).join('');
  };

  const installImageFallbacks = () => {
    document.querySelectorAll('img[data-fallback]').forEach((image) => {
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

  const installTracking = () => {
    document.addEventListener('click', (event) => {
      const category = event.target.closest('[data-menu-category-link]');
      if (category) {
        track('cta_click', {
          cta: `menu_category_${category.dataset.menuCategoryLink}`,
          destination: category.href
        });
      }

      const tracked = event.target.closest('[data-track]');
      if (tracked) {
        track('cta_click', {
          cta: tracked.dataset.track,
          destination: tracked.href || window.location.href
        });
      }
    });

    document.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('pointerdown', () => {
        track('product_open', {
          product_id: card.dataset.productId,
          product_name: card.dataset.productName
        });
      }, { once: true });
    });
  };

  const installActiveSectionObserver = () => {
    const links = new Map(
      [...document.querySelectorAll('[data-menu-category-link]')].map((link) => [link.dataset.menuCategoryLink, link])
    );

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      links.forEach((link) => link.classList.remove('is-active'));
      const active = links.get(visible.target.dataset.menuSection);
      if (active) {
        active.classList.add('is-active');
        active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }, {
      rootMargin: '-28% 0px -56% 0px',
      threshold: [0, .15, .35]
    });

    document.querySelectorAll('[data-menu-section]').forEach((section) => observer.observe(section));
  };

  const showLoadError = () => {
    const root = document.querySelector('[data-menu-sections]');
    if (!root) return;
    root.innerHTML = `
      <div class="menu-empty">
        Não foi possível carregar o cardápio agora. Atualize a página ou fale com o Dudu pelo WhatsApp.
      </div>`;
  };

  const init = async () => {
    renderNav();

    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const products = mergeSupplementals(Array.isArray(data.products) ? [...data.products] : []);
      renderSections(products);
      installImageFallbacks();
      installTracking();
      installActiveSectionObserver();
    } catch (error) {
      console.error('[Açaí do Dudu] Falha ao carregar o cardápio digital:', error);
      showLoadError();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
