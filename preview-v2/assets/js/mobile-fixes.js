document.addEventListener('DOMContentLoaded', () => {
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
