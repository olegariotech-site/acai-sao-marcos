(() => {
  'use strict';

  const PRIMARY_FALLBACK = 'assets/img/hero-copo-acai-morango.png?v=20260816-final-1';
  const FINAL_FALLBACK = 'assets/assetslogologo-acai-sao-marcos.png?v=20260816-final-1';
  const WHATSAPP_BASE = 'https://wa.me/5519991288849';
  const PRODUCT_CATEGORY = {
    'acai-natural': 'acai',
    'acai-trufado': 'acai'
  };

  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const escapeSelector = (value = '') => {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  };


  const installPremiumMotionStyles = () => {
    if (document.getElementById('ot-premium-motion')) return;

    const style = document.createElement('style');
    style.id = 'ot-premium-motion';
    style.textContent = `
      :root {
        --ease-silk: cubic-bezier(.22, .61, .36, 1);
        --shadow-cinema: 0 32px 86px rgba(34, 4, 45, .24);
        --shadow-glow: 0 14px 34px rgba(110, 36, 125, .22);
      }

      [data-reveal] {
        transition-delay: var(--reveal-delay, 0ms);
        transition-timing-function: var(--ease-silk);
      }

      .product-card,
      .offer-card,
      .sergel-card,
      .button,
      .category-button {
        transition-timing-function: var(--ease-silk);
      }

      .product-card-cta {
        transition: transform .35s var(--ease-silk), box-shadow .35s ease;
      }

      .product-card:hover .product-card-cta {
        transform: rotate(90deg) scale(1.06);
        box-shadow: var(--shadow-glow);
      }

      .category-button.active {
        box-shadow: 0 10px 25px rgba(78, 15, 96, .2), 0 0 0 1px rgba(255, 255, 255, .16) inset;
      }

      :where(a, button, [role='button'], [role='link']):focus-visible {
        outline: 3px solid var(--yellow-500);
        outline-offset: 3px;
      }

      @keyframes ot-parallax-rise {
        from { transform: translate3d(0, -3%, 0) scale(1.07); }
        to { transform: translate3d(0, 4%, 0) scale(1.07); }
      }

      @supports (animation-timeline: view()) {
        @media (prefers-reduced-motion: no-preference) {
          .facade-image img {
            animation: ot-parallax-rise linear both;
            animation-timeline: view();
            animation-range: cover 5% cover 95%;
            transform-origin: center;
          }
        }
      }

      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto !important; }

        [data-reveal] {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }

        .product-card,
        .offer-card,
        .sergel-card,
        .button,
        .category-button,
        .product-card-cta,
        .hero-image-frame img,
        .facade-image img,
        .montagem-main-image {
          animation: none !important;
          transition: none !important;
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  };

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

  const replaceBrokenVideo = (video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    const fallbackSrc = video.dataset.fallback || video.getAttribute('poster') || PRIMARY_FALLBACK;
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
        modalImage.hidden = false;
        modalImage.style.display = 'block';
        modalImage.style.visibility = 'visible';
      }
      return;
    }

    const cardFallback = video.parentElement?.querySelector('.product-video-fallback');
    if (cardFallback instanceof HTMLImageElement) {
      cardFallback.dataset.mediaFallbackStep = '0';
      cardFallback.dataset.fallback = FINAL_FALLBACK;
      cardFallback.src = fallbackSrc;
      cardFallback.hidden = false;
      cardFallback.style.display = 'block';
      cardFallback.style.visibility = 'visible';
    }
  };

  document.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) applyImageFallback(target);
    if (target instanceof HTMLVideoElement) replaceBrokenVideo(target);
  }, true);

  const recoverBrokenImages = (scope = document) => {
    scope.querySelectorAll?.('img').forEach((img) => {
      if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) applyImageFallback(img);
    });
  };

  const assignRevealDelays = (scope = document) => {
    const containers = [];
    if (scope instanceof Element && scope.matches('.product-grid, .gallery-grid, .sergel-grid')) containers.push(scope);
    scope.querySelectorAll?.('.product-grid, .gallery-grid, .sergel-grid').forEach((container) => containers.push(container));

    containers.forEach((container) => {
      [...container.children].forEach((item, index) => {
        if (!(item instanceof HTMLElement) || !item.matches('[data-reveal]')) return;
        item.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`);
      });
    });
  };

  const enhanceAccessibility = (scope = document) => {
    scope.querySelectorAll?.('.product-loading').forEach((status) => {
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
    });

    const modalDescription = document.querySelector('[data-modal-description]');
    const modalDialog = document.querySelector('.modal-dialog');
    if (modalDescription instanceof HTMLElement && modalDialog instanceof HTMLElement) {
      modalDescription.id ||= 'modal-product-description';
      modalDialog.setAttribute('aria-describedby', modalDescription.id);
    }
  };

  const watchDynamicMedia = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('img') && node.complete && node.naturalWidth === 0) applyImageFallback(node);
          recoverBrokenImages(node);
          assignRevealDelays(node.parentElement || node);
          enhanceAccessibility(node.parentElement || node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
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
      link.innerHTML = '<span>Falar com o Dudu</span>';
      link.addEventListener('click', () => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'cta_click', cta: 'floating_whatsapp', destination: link.href });
      });
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

  const getCategoryButton = (categoryId) => document.querySelector(
    `[data-category="${escapeSelector(categoryId)}"]`
  );


  const scrollToCatalogProducts = () => {
    const grid = document.querySelector('[data-product-grid]');
    const firstCard = grid?.querySelector('[data-product-id]');
    const target = firstCard || grid || document.querySelector('#cardapio');
    if (!(target instanceof HTMLElement)) return;

    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 78;
    const categoryHeight = document.querySelector('.category-rail-wrap')?.getBoundingClientRect().height || 60;
    const offset = headerHeight + Math.min(categoryHeight, 72) + 36;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

    if (!prefersReducedMotion() && firstCard instanceof HTMLElement && typeof firstCard.animate === 'function') {
      firstCard.animate([
        { boxShadow: '0 0 0 0 rgba(110, 36, 125, 0)' },
        { boxShadow: '0 0 0 5px rgba(110, 36, 125, .22)' },
        { boxShadow: '0 0 0 0 rgba(110, 36, 125, 0)' }
      ], { duration: 760, easing: 'ease-out' });
    }
  };

  const activateCategory = (categoryId, { scroll = true } = {}) => {
    const button = getCategoryButton(categoryId);
    if (!(button instanceof HTMLElement)) {
      if (scroll) document.querySelector('#cardapio')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      return false;
    }

    // site-v2.js é o único responsável por renderizar e posicionar o grid.
    button.click();
    return true;
  };

  const openRenderedProduct = (productId) => {
    const card = document.querySelector(`[data-product-id="${escapeSelector(productId)}"]`);
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
      if (attempts < 10) {
        window.requestAnimationFrame(tryOpen);
      } else {
        scrollToCatalogProducts();
      }
    };
    window.requestAnimationFrame(tryOpen);
  };

  const installQuickRouting = () => {
    document.addEventListener('click', (event) => {
      const quick = event.target instanceof Element
        ? event.target.closest('.quick-item[data-quick-product], .quick-item[data-quick-category]')
        : null;
      if (!(quick instanceof HTMLAnchorElement)) return;

      const productId = quick.dataset.quickProduct;
      const categoryId = quick.dataset.quickCategory;
      if (!productId && !categoryId) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (productId) openProduct(productId);
      else activateCategory(categoryId);
    }, true);
  };


  const installSergelRouting = () => {
    document.addEventListener('click', (event) => {
      const card = event.target instanceof Element ? event.target.closest('.sergel-card') : null;
      if (!(card instanceof HTMLElement)) return;
      if (event.target instanceof Element && event.target.closest('a, button')) return;
      const cta = card.querySelector('.sergel-cta');
      if (cta instanceof HTMLAnchorElement && cta.href) cta.click();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target instanceof HTMLElement && event.target.matches('.sergel-card') ? event.target : null;
      if (!card) return;
      const cta = card.querySelector('.sergel-cta');
      if (!(cta instanceof HTMLAnchorElement) || !cta.href) return;
      event.preventDefault();
      cta.click();
    });

    document.querySelectorAll('.sergel-card').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      const cta = card.querySelector('.sergel-cta');
      if (!(cta instanceof HTMLAnchorElement) || !cta.href) return;
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${card.querySelector('h3')?.textContent?.trim() || 'Produto Sergel'}: ${cta.textContent?.trim() || 'abrir'}`);
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

  const installModalScrollLock = () => {
    let lockedScrollY = 0;
    let modalScrollLocked = false;

    const sync = () => {
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

    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    sync();
  };

  document.addEventListener('DOMContentLoaded', () => {
    installPremiumMotionStyles();
    recoverBrokenImages();
    assignRevealDelays();
    enhanceAccessibility();
    watchDynamicMedia();
    installWhatsAppActions();
    installQuickRouting();
    installSergelRouting();
    installModalScrollLock();
    auditInternalTargets();
  });
})();

(() => {
  const script = document.createElement('script');
  script.src = 'assets/js/analytics-consent.js?v=20260821-ga4-1';
  script.defer = true;
  document.head.appendChild(script);
})();