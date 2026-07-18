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

    window.addEventListener('pointermove', (event) => {
        if (!cursorGlow) return;
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
});
