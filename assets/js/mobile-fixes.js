(() => {
  const PRIMARY_FALLBACK = 'assets/img/hero-copo-acai-morango.png?v=20260816-1';
  const FINAL_FALLBACK = 'assets/assetslogologo-acai-sao-marcos.png?v=20260816-1';

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
    if (!(video instanceof HTMLVideoElement) || !video.parentElement) return;

    const img = document.createElement('img');
    img.src = video.poster || video.dataset.fallback || PRIMARY_FALLBACK;
    img.alt = video.getAttribute('aria-label') || 'Produto do Açaí do Dudu';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    video.replaceWith(img);
  };

  document.addEventListener('error', (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement) applyImageFallback(target);
    if (target instanceof HTMLVideoElement) replaceBrokenVideo(target);
  }, true);

  const recoverAlreadyBrokenMedia = (scope = document) => {
    scope.querySelectorAll?.('img').forEach((img) => {
      if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) {
        applyImageFallback(img);
      }
    });
  };

  const watchDynamicMedia = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('img')) recoverAlreadyBrokenMedia(node.parentElement || node);
          recoverAlreadyBrokenMedia(node);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    recoverAlreadyBrokenMedia();
    watchDynamicMedia();

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