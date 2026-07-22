document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const cursorGlow = document.querySelector('.cursor-glow');
    const progress = document.querySelector('.scroll-progress');
    const heroVideo = document.querySelector('.hero-video');

    const updateScrollState = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progressValue = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
        if (progress) progress.style.width = `${Math.min(progressValue, 100)}%`;
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelectorAll('img[data-fallback]').forEach((img) => {
        img.addEventListener('error', () => {
            const fallback = img.dataset.fallback;
            if (fallback && !img.src.endsWith(fallback)) {
                img.src = fallback;
            }
        }, { once: true });
    });

    if (heroVideo) {
        heroVideo.addEventListener('error', () => {
            document.body.classList.add('video-off');
        });

        setTimeout(() => {
            if (heroVideo.readyState === 0) {
                document.body.classList.add('video-off');
            }
        }, 2500);
    }

    const revealItems = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -70px 0px'
    });

    revealItems.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index * 45, 320)}ms`;
        revealObserver.observe(item);
    });

    document.querySelectorAll('.produto-item, .step-card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', `${x}%`);
            card.style.setProperty('--my', `${y}%`);
        });
    });

    const platformTypeFromHref = (href = '') => {
        if (href.includes('wa.me')) return 'whatsapp';
        if (href.includes('ifood.com.br')) return 'ifood';
        if (href.includes('99app.com')) return '99';
        if (href.includes('instagram.com')) return 'instagram';
        if (href.includes('facebook.com')) return 'facebook';
        return null;
    };

    const platformIconMarkup = (type) => {
        const icons = {
            whatsapp: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 2.67c-7.34 0-13.31 5.96-13.31 13.3 0 2.34.62 4.64 1.8 6.66L2.62 29.6l7.12-1.87a13.27 13.27 0 0 0 6.29 1.6h.01c7.34 0 13.31-5.96 13.31-13.3 0-3.55-1.38-6.89-3.9-9.4a13.22 13.22 0 0 0-9.41-3.96Zm0 24.4h-.01c-1.99 0-3.93-.54-5.63-1.56l-.4-.24-4.22 1.1 1.13-4.1-.27-.42a11.04 11.04 0 0 1-1.68-5.88c0-6.1 4.97-11.06 11.08-11.06 2.96 0 5.74 1.15 7.83 3.25a10.98 10.98 0 0 1 3.25 7.86c0 6.1-4.97 11.05-11.08 11.05Zm6.07-8.28c-.33-.17-1.96-.96-2.27-1.07-.3-.12-.52-.17-.74.17-.22.33-.85 1.07-1.05 1.29-.2.22-.39.25-.72.08-.33-.17-1.4-.52-2.67-1.65-.99-.88-1.65-1.96-1.85-2.29-.2-.33-.02-.51.15-.68.15-.15.33-.39.5-.58.17-.2.22-.33.33-.55.11-.22.06-.42-.03-.58-.08-.17-.74-1.79-1.02-2.45-.27-.65-.54-.56-.74-.57h-.64c-.22 0-.58.08-.88.42-.3.33-1.15 1.13-1.15 2.75s1.18 3.2 1.35 3.42c.17.22 2.33 3.56 5.64 4.99.79.34 1.4.54 1.88.69.79.25 1.51.21 2.08.13.64-.1 1.96-.8 2.24-1.57.28-.77.28-1.43.2-1.57-.08-.14-.3-.22-.63-.39Z"/></svg>',
            instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.7" r="1.1" fill="currentColor"/></svg>',
            facebook: '<span class="platform-letter" aria-hidden="true">f</span>',
            ifood: '<span class="platform-wordmark" aria-hidden="true">iFood</span>',
            '99': '<span class="platform-wordmark" aria-hidden="true">99</span>'
        };
        return icons[type] || '';
    };

    document.querySelectorAll('.hero-ctas a, .cta-final-buttons a, .footer-social a').forEach((link) => {
        const type = platformTypeFromHref(link.href);
        if (!type || link.querySelector('.platform-icon')) return;

        const icon = document.createElement('span');
        icon.className = `platform-icon platform-icon-${type}`;
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = platformIconMarkup(type);
        link.prepend(icon);
        link.classList.add('has-platform-icon');
    });

    const productContainers = Array.from(document.querySelectorAll('.produto-img-container'));
    const productImages = productContainers.map((container) => container.querySelector('img')).filter(Boolean);

    if (productImages.length) {
        const lightbox = document.createElement('div');
        lightbox.className = 'product-lightbox';
        lightbox.hidden = true;
        lightbox.innerHTML = `
            <div class="product-lightbox-backdrop" data-lightbox-close></div>
            <div class="product-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="product-lightbox-title">
                <button type="button" class="product-lightbox-close" data-lightbox-close aria-label="Fechar imagem">×</button>
                <button type="button" class="product-lightbox-nav product-lightbox-prev" aria-label="Imagem anterior">‹</button>
                <figure>
                    <div class="product-lightbox-image-wrap">
                        <img class="product-lightbox-image" alt="" />
                    </div>
                    <figcaption id="product-lightbox-title"></figcaption>
                </figure>
                <button type="button" class="product-lightbox-nav product-lightbox-next" aria-label="Próxima imagem">›</button>
            </div>
        `;
        document.body.append(lightbox);

        const lightboxImage = lightbox.querySelector('.product-lightbox-image');
        const lightboxCaption = lightbox.querySelector('figcaption');
        const closeButton = lightbox.querySelector('.product-lightbox-close');
        const previousButton = lightbox.querySelector('.product-lightbox-prev');
        const nextButton = lightbox.querySelector('.product-lightbox-next');
        let activeIndex = 0;
        let lastFocusedElement = null;
        let closeTimer = null;

        const showLightboxImage = (index) => {
            activeIndex = (index + productImages.length) % productImages.length;
            const image = productImages[activeIndex];
            const card = image.closest('.produto-item');
            const title = card?.querySelector('h3')?.textContent?.trim() || image.alt || 'Produto DUDU';

            lightboxImage.src = image.currentSrc || image.src;
            lightboxImage.alt = image.alt || title;
            lightboxCaption.textContent = title;
        };

        const openLightbox = (index, trigger) => {
            if (closeTimer) clearTimeout(closeTimer);
            lastFocusedElement = trigger || document.activeElement;
            showLightboxImage(index);
            lightbox.hidden = false;
            document.body.classList.add('lightbox-open');
            requestAnimationFrame(() => {
                lightbox.classList.add('active');
                closeButton.focus();
            });
        };

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.classList.remove('lightbox-open');
            closeTimer = setTimeout(() => {
                lightbox.hidden = true;
                lightboxImage.removeAttribute('src');
                lastFocusedElement?.focus?.();
            }, 180);
        };

        productContainers.forEach((container, index) => {
            const image = container.querySelector('img');
            if (!image) return;

            container.classList.add('product-image-trigger');
            container.setAttribute('role', 'button');
            container.setAttribute('tabindex', '0');
            container.setAttribute('aria-label', `Ver foto inteira: ${image.alt}`);

            const hint = document.createElement('span');
            hint.className = 'product-image-hint';
            hint.innerHTML = '<span aria-hidden="true">⛶</span> Ver foto inteira';
            container.append(hint);

            container.addEventListener('click', () => openLightbox(index, container));
            container.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(index, container);
                }
            });
        });

        lightbox.addEventListener('click', (event) => {
            if (event.target.closest('[data-lightbox-close]')) closeLightbox();
        });
        previousButton.addEventListener('click', () => showLightboxImage(activeIndex - 1));
        nextButton.addEventListener('click', () => showLightboxImage(activeIndex + 1));

        document.addEventListener('keydown', (event) => {
            if (lightbox.hidden) return;
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowLeft') showLightboxImage(activeIndex - 1);
            if (event.key === 'ArrowRight') showLightboxImage(activeIndex + 1);
        });
    }

    window.addEventListener('pointermove', (event) => {
        if (!cursorGlow) return;
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
});