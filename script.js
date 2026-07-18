const cursorGlow = document.querySelector('.cursor-glow');
const revealItems = document.querySelectorAll('[data-reveal]');
const logoWrap = document.querySelector('.logo-wrap');

// Corrige automaticamente imagens caso os arquivos tenham sido enviados sem barras de pasta no GitHub.
document.querySelectorAll('img[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => {
    const fallback = img.dataset.fallback;
    if (fallback && img.src.indexOf(fallback) === -1) {
      img.src = fallback;
    }
  }, { once: true });
});

// Glow suave seguindo o mouse para sensação premium/cinematográfica.
window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;

  if (!logoWrap) return;
  const rect = logoWrap.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const rotateX = Math.max(Math.min(-y / 35, 7), -7);
  const rotateY = Math.max(Math.min(x / 35, 7), -7);
  logoWrap.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

window.addEventListener('pointerleave', () => {
  if (logoWrap) logoWrap.style.transform = '';
});

// Animações de entrada no scroll.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.14,
  rootMargin: '0px 0px -60px 0px'
});

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 55, 360)}ms`;
  revealObserver.observe(item);
});

// Header ganha corpo depois da rolagem.
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 80);
});

// Microinteração nos cards para aumentar sensação de produto vivo.
document.querySelectorAll('.product-card, .menu-card, .step').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', `${x}%`);
    card.style.setProperty('--my', `${y}%`);
  });
});

// Reforço: se o vídeo principal não carregar, a página continua forte com a imagem/poster.
const heroVideo = document.querySelector('.hero-bg-video video');
if (heroVideo) {
  heroVideo.addEventListener('error', () => {
    document.body.classList.add('video-off');
  });
}
