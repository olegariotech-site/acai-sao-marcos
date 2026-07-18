document.addEventListener("DOMContentLoaded", function() {
    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = "0.5rem 0";
            header.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
        } else {
            header.style.padding = "0.8rem 0";
            header.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        }
    });

    // Add reveal class to sections for animation
    document.querySelectorAll('section').forEach(section => {
        section.setAttribute('data-reveal', '');
    });
});
