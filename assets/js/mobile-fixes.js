(() => {
  const PRIMARY_FALLBACK = 'assets/img/hero-copo-acai-morango.png?v=20260815-1';
  const FINAL_FALLBACK = 'assets/assetslogologo-acai-sao-marcos.png?v=20260815-1';
  const VIDEO_START_TIMEOUT_MS = 5500;
  const videoFallbackMap = new Map();

  const normalizeMediaPath = (value = '') => String(value)
    .split('?')[0]
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^\.\//, '')
    .replace(/^\//, '');

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

  const getVideoFallback = (video) => {
    if (!(video instanceof HTMLVideoElement)) return PRIMARY_FALLBACK;

    const src = normalizeMediaPath(
      video.currentSrc ||
      video.getAttribute('src') ||
      video.querySelector('source')?.getAttribute('src') ||
      ''
    );

    return video.dataset.fallback ||
      video.getAttribute('poster') ||
      videoFallbackMap.get(src) ||
      PRIMARY_FALLBACK;
  };

  const replaceBrokenVideo = (video) => {
    if (!(video instanceof HTMLVideoElement) || !video.parentElement) return;
    if (video.dataset.mediaFallbackApplied === '1') return;

    video.dataset.mediaFallbackApplied = '1';
    const fallbackSrc = getVideoFallback(video);

    if (video.matches('[data-modal-video]')) {
      const modalImage = document.querySelector('[data-modal-media]');

      if (modalImage instanceof HTMLImageElement) {
        modalImage.dataset.fallback = FINAL_FALLBACK;
        modalImage.src = fallbackSrc;
        modalImage.alt = video.getAttribute('aria-label') || modalImage.alt || 'Produto do Açaí do Dudu';
        modalImage.hidden = false;
      }

      try { video.pause(); } catch (_) {}
      video.hidden = true;
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
      try { video.load(); } catch (_) {}
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
    video.replaceWith(img);
  };

  const armVideoFallback = (video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    if (video.dataset.mediaFallbackBound === '1') return;

    video.dataset.mediaFallbackBound = '1';

    const applyMappedFallback = () => {
      const fallbackSrc = getVideoFallback(video);
      video.dataset.fallback = fallbackSrc;
      if (!video.getAttribute('poster')) video.setAttribute('poster', fallbackSrc);
    };

    applyMappedFallback();

    let started = false;
    let timer = null;

    const clearTimer = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleTimeoutFallback = () => {
      clearTimer();
      timer = window.setTimeout(() => {
        if (!video.isConnected || video.dataset.mediaFallbackApplied === '1') return;

        const hasRenderableFrame = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const isActuallyPlaying = !video.paused && !video.ended;

        if (!started || !hasRenderableFrame || !isActuallyPlaying) {
          replaceBrokenVideo(video);
        }
      }, VIDEO_START_TIMEOUT_MS);
    };

    video.addEventListener('loadedmetadata', applyMappedFallback, { once: true });
    video.addEventListener('playing', () => {
      started = true;
      clearTimer();
    }, { once: true });
    video.addEventListener('error', () => {
      clearTimer();
      replaceBrokenVideo(video);
    }, { once: true });
    video.addEventListener('stalled', scheduleTimeoutFallback);
    video.addEventListener('waiting', scheduleTimeoutFallback);
    video.addEventListener('emptied', () => {
      if (video.matches('[data-modal-video]') && !document.body.classList.contains('modal-open')) return;
      scheduleTimeoutFallback();
    });

    scheduleTimeoutFallback();
  };

  const armMediaInScope = (scope = document) => {
    if (scope instanceof HTMLVideoElement) armVideoFallback(scope);
    scope.querySelectorAll?.('video').forEach(armVideoFallback);

    scope.querySelectorAll?.('img').forEach((img) => {
      if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) {
        applyImageFallback(img);
      }
    });
  };

  const loadVideoFallbackMap = async () => {
    try {
      const response = await fetch('data/products.json', { cache: 'no-store' });
      if (!response.ok) return;

      const catalog = await response.json();
      (catalog.products || []).forEach((product) => {
        if (!product.video || !product.image) return;
        videoFallbackMap.set(normalizeMediaPath(product.video), product.image);
      });

      document.querySelectorAll('video').forEach((video) => {
        if (!(video instanceof HTMLVideoElement)) return;
        const fallbackSrc = getVideoFallback(video);
        video.dataset.fallback = fallbackSrc;
        video.setAttribute('poster', fallbackSrc);
      });
    } catch (_) {
      // O fallback primário continua disponível se o catálogo não carregar.
    }
  };

  document.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) applyImageFallback(target);
    if (target instanceof HTMLVideoElement) replaceBrokenVideo(target);
  }, true);

  const watchDynamicMedia = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          armMediaInScope(node);
        });

        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLVideoElement &&
          ['src', 'poster'].includes(mutation.attributeName)
        ) {
          armVideoFallback(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'poster']
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    armMediaInScope();
    watchDynamicMedia();
    loadVideoFallbackMap();

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

    new MutationObserver(lockModalBackground).observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    lockModalBackground();
  });
})();
