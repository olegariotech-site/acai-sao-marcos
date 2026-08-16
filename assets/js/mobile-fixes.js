(() => {
  const PRIMARY_FALLBACK = 'assets/img/hero-copo-acai-morango.png?v=20260816-2';
  const FINAL_FALLBACK = 'assets/assetslogologo-acai-sao-marcos.png?v=20260816-2';
  const WHATSAPP_BASE = 'https://wa.me/5519991288849';

  const applyImageFallback = (img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const currentSrc = img.getAttribute('src') || '';
    if (currentSrc.includes('assetslogologo-acai-sao-marcos.png')) {
      img.style.visibility = 'hidden';
      return;
    }
    const step = Number(img.dataset.mediaFallbackStep || '0');
    if (step === 0) {
      img.dataset.mediaFallbackStep = '1';
      img.removeAttribute('srcset');
      img.src = img.dataset.fallback || PRIMARY_FALLBACK;
      return;
    }
    if (step === 1) {
      img.dataset.mediaFallbackStep = '2';
      img.removeAttribute('srcset');
      img.src = FINAL_FALLBACK;
      return;
    }
    img.style.visibility = 'hidden';
  };

  const getVideoFallback = (video) => video?.getAttribute('poster') || video?.dataset?.fallback || PRIMARY_FALLBACK;

  const replaceBrokenVideo = (video) => {
    if (!(video instanceof HTMLVideoElement) || !video.parentElement) return;
    const fallbackSrc = getVideoFallback(video);
    try { video.pause(); } catch (_) {}
    video.dataset.mediaFallbackApplied = '1';
    video.hidden = true;
    video.style.display = 'none';
    video.style.opacity = '0';

    if (video.matches('[data-modal-video]')) {
      const modalImage = document.querySelector('[data-modal-media]');
      if (modalImage instanceof HTMLImageElement) {
        modalImage.dataset.mediaFallbackStep = '0';
        modalImage.dataset.fallback = FINAL_FALLBACK;
        modalImage.src = fallbackSrc;
        modalImage.alt = video.getAttribute('aria-label') || modalImage.alt || 'Produto do Açaí do Dudu';
        modalImage.hidden = false;
        modalImage.style.display = 'block';
        modalImage.style.visibility = 'visible';
      }
      return;
    }

    const cardFallback = video.parentElement.querySelector('.product-video-fallback');
    if (cardFallback instanceof HTMLImageElement) {
      cardFallback.dataset.mediaFallbackStep = '0';
      cardFallback.dataset.fallback = FINAL_FALLBACK;
      cardFallback.src = fallbackSrc;
      cardFallback.hidden = false;
      cardFallback.style.display = 'block';
      cardFallback.style.visibility = 'visible';
      return;
    }

    const img = document.createElement('img');
    img.src = fallbackSrc;
    img.dataset.fallback = FINAL_FALLBACK;
    img.alt = video.getAttribute('aria-label') || 'Produto do Açaí do Dudu';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    video.insertAdjacentElement('afterend', img);
  };

  document.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) applyImageFallback(target);
    if (target instanceof HTMLVideoElement) replaceBrokenVideo(target);
  }, true);

  const recoverAlreadyBrokenMedia = (scope = document) => {
    scope.querySelectorAll?.('img').forEach((img) => {
      if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) applyImageFallback(img);
    });
  };

  const normalizeModalVideoState = (video) => {
    if (!(video instanceof HTMLVideoElement) || !video.matches('[data-modal-video]')) return;
    const hasSource = Boolean(video.getAttribute('src'));
    if (!video.hidden && hasSource) {
      delete video.dataset.mediaFallbackApplied;
      video.style.display = 'block';
      video.style.opacity = '1';
    } else if (video.hidden || !hasSource) {
      video.style.display = 'none';
    }
  };

  const watchDynamicMedia = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('img')) recoverAlreadyBrokenMedia(node.parentElement || node);
          recoverAlreadyBrokenMedia(node);
          if (node.matches('video')) normalizeModalVideoState(node);
          node.querySelectorAll?.('video').forEach(normalizeModalVideoState);
        });
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLVideoElement && ['src', 'hidden'].includes(mutation.attributeName)) {
          normalizeModalVideoState(mutation.target);
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'hidden'] });
  };

  const installWhatsAppActions = () => {
    const message = encodeURIComponent('Olá, Dudu! Vim pelo site e gostaria de tirar uma dúvida sobre o cardápio.');
    if (!document.querySelector('.whatsapp-contact-float')) {
      const link = document.createElement('a');
      link.className = 'whatsapp-contact-float';
      link.href = `${WHATSAPP_BASE}?text=${message}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', 'Falar com o Dudu pelo WhatsApp');
      link.setAttribute('data-track', 'floating_whatsapp');
      link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 2.8c.5-.2 1.1 0 1.4.5l1.2 2.8c.2.5.1 1-.3 1.4L7.6 8.8c.9 1.8 2.3 3.2 4.1 4.1l1.3-1.3c.4-.4.9-.5 1.4-.3l2.8 1.2c.5.2.8.8.6 1.4l-.8 2.7c-.2.6-.7 1-1.3 1.1-1 .1-2 .1-3-.2A14.4 14.4 0 0 1 4.3 9c-.3-1-.4-2-.2-3 .1-.6.5-1.1 1.1-1.3l1.4-.5Z"/></svg><span>Falar com o Dudu</span>`;
      document.body.appendChild(link);
    }
    const modalWhatsapp = document.querySelector('[data-modal-whatsapp]');
    if (modalWhatsapp instanceof HTMLAnchorElement) {
      modalWhatsapp.hidden = false;
      modalWhatsapp.classList.add('button', 'button-whatsapp');
      modalWhatsapp.textContent = 'Falar com o Dudu';
      modalWhatsapp.setAttribute('aria-label', 'Falar com o Dudu sobre este produto pelo WhatsApp');
    }
  };

  const installClickableCards = () => {
    const scrollToCatalog = () => document.querySelector('#cardapio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const activateCategory = (categoryId, { scroll = true } = {}) => {
      const button = document.querySelector(`[data-category="${categoryId}"]`);
      if (!(button instanceof HTMLButtonElement)) {
        if (scroll) scrollToCatalog();
        return false;
      }
      button.click();
      if (scroll) scrollToCatalog();
      return true;
    };
    const openProduct = (productId) => {
      const clickProduct = () => {
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (!(card instanceof HTMLElement)) return false;
        card.click();
        return true;
      };
      if (clickProduct()) return;
      activateCategory('acai', { scroll: false });
      window.requestAnimationFrame(() => { if (!clickProduct()) scrollToCatalog(); });
    };
    const quickActions = new Map([
      ['Açaí Natural', () => openProduct('acai-natural')],
      ['Açaí Trufado', () => openProduct('acai-trufado')],
      ['Milk-shakes', () => activateCategory('milkshakes')],
      ['Sorvetes', () => activateCategory('sorvetes')]
    ]);
    document.querySelectorAll('.quick-item').forEach((item) => {
      if (!(item instanceof HTMLElement) || item.dataset.clickableBound === '1') return;
      const label = item.querySelector('strong')?.textContent?.trim() || '';
      const action = quickActions.get(label);
      if (!action) return;
      item.dataset.clickableBound = '1';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `${label}: abrir no cardápio`);
      item.addEventListener('click', action);
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        action();
      });
    });
    document.querySelectorAll('.sergel-card').forEach((card) => {
      if (!(card instanceof HTMLElement) || card.dataset.clickableBound === '1') return;
      const cta = card.querySelector('.sergel-cta');
      if (!(cta instanceof HTMLAnchorElement) || !cta.href) return;
      card.dataset.clickableBound = '1';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${card.querySelector('h3')?.textContent?.trim() || 'Produto Sergel'}: ${cta.textContent?.trim() || 'abrir'}`);
      card.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('a, button')) return;
        cta.click();
      });
      card.addEventListener('keydown', (event) => {
        if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        cta.click();
      });
    });
  };

  const auditInternalTargets = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute('href') || '';
      if (href === '#' && link.matches('[data-modal-whatsapp]')) return;
      if (!href || href === '#') {
        console.warn('[Açaí do Dudu] Link sem destino:', link);
        return;
      }
      try {
        if (!document.querySelector(href)) console.warn(`[Açaí do Dudu] Âncora interna sem alvo: ${href}`, link);
      } catch (_) {
        console.warn(`[Açaí do Dudu] Âncora interna inválida: ${href}`, link);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    recoverAlreadyBrokenMedia();
    watchDynamicMedia();
    installWhatsAppActions();
    installClickableCards();
    auditInternalTargets();
    const interactionObserver = new MutationObserver(() => installClickableCards());
    interactionObserver.observe(document.body, { childList: true, subtree: true });
    let lockedScrollY = 0;
    let modalScrollLocked = false;
    const lockModalBackground = () => {
      const shouldLock = document.body.classList.contains('modal-open');
      if (shouldLock && !modalScrollLocked) {
        lockedScrollY = window.scrollY;
        modalScrollLocked = true;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        return;
      }
      if (!shouldLock && modalScrollLocked) {
        modalScrollLocked = false;
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('left');
        document.body.style.removeProperty('right');
        document.body.style.removeProperty('width');
        window.scrollTo(0, lockedScrollY);
      }
    };
    new MutationObserver(lockModalBackground).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    lockModalBackground();
  });
})();

// Final deterministic navigation layer: quick cards open products/categories directly,
// category tabs always move the viewport to the resulting product grid.
(() => {
  const PRODUCT_CATEGORY = { 'acai-natural': 'acai', 'acai-trufado': 'acai' };
  const scrollToProducts = () => {
    const target = document.querySelector('[data-product-grid]') || document.querySelector('#cardapio');
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 154);
    window.scrollTo({ top, behavior: 'smooth' });
  };
  const activateCategory = (categoryId, { scroll = true } = {}) => {
    const button = document.querySelector(`[data-category="${CSS.escape(categoryId)}"]`);
    if (!(button instanceof HTMLElement)) {
      document.querySelector('#cardapio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return false;
    }
    button.click();
    if (scroll) window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToProducts));
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
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-category]') : null;
    if (!(button instanceof HTMLElement)) return;
    window.requestAnimationFrame(() => window.requestAnimationFrame(scrollToProducts));
  });
})();

// Public-facing premium copy. Keeps operational/development language out of the customer experience.
(() => {
  const setText = (selector, text) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  };

  const applyPremiumCopy = () => {
    setText('.hero-copy > p', 'Açaí cremoso, opções trufadas, milk-shakes e sorvetes para montar do seu jeito. Escolha o tamanho, capriche na combinação e vem matar a vontade no São Marcos.');

    setText('#ofertas .kicker', 'Favoritos para começar');
    setText('#ofertas h2', 'Escolha com os olhos. Depois decide o tamanho.');
    setText('#ofertas .section-heading > p', 'Alguns dos queridinhos do Dudu para você bater o olho, escolher rápido e abrir os detalhes antes de vir à loja.');

    setText('#cardapio .kicker', 'Escolha sua vontade');
    setText('#cardapio h2', 'Seu próximo favorito está aqui.');
    setText('#cardapio .section-heading > p', 'Abra cada produto para ver tamanhos, sabores, acompanhamentos e tudo que pode deixar a sua escolha ainda mais gostosa.');

    setText('#sergel .sergel-heading > div:last-child > p', 'Skimos para matar a vontade na hora e potes de 2 litros para levar. Escolha pelo sabor, leve pelo capricho e confira na loja o que está gelando no dia.');

    setText('#monte h2', 'Escolha, combine e deixe o Dudu caprichar.');
    setText('#monte .montagem-copy > p', 'No milk-shake, o tradicional já vem com 1 cobertura e 1 acompanhamento. Quer deixar mais carregado? Cada adicional extra custa R$ 2,00.');

    setText('#galeria .kicker', 'Dá uma olhada');
    setText('#galeria h2', 'A vontade começa antes da primeira colherada.');
    setText('#galeria .section-heading > p', 'Cremoso, trufado, frutado, crocante ou bem gelado: aqui tem combinação para escolher primeiro com os olhos e depois com a colher.');

    const facade = document.querySelector('#loja');
    if (facade) {
      setText('#loja .concept-label', 'Açaí do Dudu · São Marcos');
      setText('#loja .kicker', 'Sabor, cor e personalidade');
      setText('#loja h2', 'Um cantinho para chegar com vontade e sair querendo voltar.');
      setText('#loja .facade-copy > p', 'No São Marcos, o Dudu junta açaí cremoso, milk-shakes, sorvetes e combinações montadas na hora em uma experiência simples: escolher bem, caprichar na montagem e curtir cada colherada.');
      const facadeImage = facade.querySelector('.facade-image img');
      if (facadeImage instanceof HTMLImageElement) {
        facadeImage.alt = 'Identidade visual do Açaí do Dudu no São Marcos, em Valinhos';
      }
    }

    setText('#localizacao h2', 'Sua próxima parada gostosa é no Dudu.');
    setText('#localizacao .location-copy > p', 'No São Marcos, em Valinhos: chegou, escolheu, montou e levou. Simples do jeito que uma vontade bem resolvida tem que ser.');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPremiumCopy, { once: true });
  } else {
    applyPremiumCopy();
  }
})();
