(() => {
  'use strict';

  // Layout, currency and product images live in the HTML and work without this script.
  const init = () => {
    const video = document.querySelector('.trio video');
    const card = document.querySelector('.page.trio');
    const book = document.querySelector('[data-book]');
    const button = document.querySelector('.trio-play');
    if (!video || !card || !book || !button || video.dataset.playbackReady) return;
    video.dataset.playbackReady = 'true';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    let active = false;
    let pending = false;
    const visible = () => active && document.visibilityState === 'visible';
    const updateButton = () => { button.hidden = !visible() || !video.paused; };
    const play = () => {
      if (!visible() || pending || !video.paused) return;
      video.muted = true;
      pending = true;
      try {
        Promise.resolve(video.play()).catch(() => {
          // Safari or device settings may deny autoplay; retain the inline play button.
        }).finally(() => {
          pending = false;
          if (!visible()) video.pause();
          updateButton();
        });
      } catch (_) {
        pending = false;
        updateButton();
      }
    };
    button.addEventListener('click', play);
    video.addEventListener('playing', () => {
      if (!visible()) video.pause();
      updateButton();
    });
    video.addEventListener('pause', updateButton);
    video.addEventListener('loadedmetadata', play);

    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && entry.intersectionRatio >= 0.6;
      if (visible()) play();
      else video.pause();
      updateButton();
    }, { root: book, threshold: [0, 0.6] });
    observer.observe(card);

    document.addEventListener('visibilitychange', () => {
      if (visible()) play();
      else video.pause();
      updateButton();
    });
    const firstInteraction = () => {
      document.removeEventListener('pointerdown', firstInteraction);
      document.removeEventListener('keydown', firstInteraction);
      play();
    };
    document.addEventListener('pointerdown', firstInteraction, { passive: true });
    document.addEventListener('keydown', firstInteraction);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
