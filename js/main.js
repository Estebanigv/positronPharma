document.addEventListener('DOMContentLoaded', () => {

    // Header scroll
    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const overlay = document.getElementById('navOverlay');
    const closeMenu = () => {
        hamburger.classList.remove('active');
        nav.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    const openMenu = () => {
        hamburger.classList.add('active');
        nav.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    hamburger.addEventListener('click', () => {
        nav.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    // Mobile menu CTA
    const mobileCta = nav.querySelector('.mobile-menu-cta');
    if (mobileCta) mobileCta.addEventListener('click', closeMenu);

    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
        const y = window.scrollY + 100;
        sections.forEach(s => {
            const top = s.offsetTop;
            const id = s.getAttribute('id');
            if (y >= top && y < top + s.offsetHeight) {
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
            }
        });
    }, { passive: true });

    // FAQ
    document.querySelectorAll('.faq-q').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-icon').textContent = '+';
                i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            });
            if (!wasActive) {
                item.classList.add('active');
                item.querySelector('.faq-icon').textContent = '—';
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const siblings = entry.target.parentElement.querySelectorAll('.fade-in');
                const idx = Array.from(siblings).indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), idx * 120);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const t = document.querySelector(a.getAttribute('href'));
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // Language selector — redirects to /en/ or /
    const langToggle = document.getElementById('langToggle');
    const langDropdown = document.getElementById('langDropdown');
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => langDropdown.classList.remove('open'));
        langDropdown.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.dataset.lang;
                const path = window.location.pathname;
                const isEnglish = path.includes('/en/');
                if (lang === 'en' && !isEnglish) {
                    window.location.href = 'en/index.html';
                } else if (lang === 'es' && isEnglish) {
                    window.location.href = '../index.html';
                }
                langDropdown.classList.remove('open');
            });
        });
    }

    // Contact form
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const nombre = form.querySelector('#nombre').value.trim();
            if (!nombre) return;
            form.innerHTML = '<div style="text-align:center;padding:32px 0"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F7931E" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><h3 style="color:#fff;margin-top:16px">Mensaje Enviado</h3><p style="color:rgba(255,255,255,.6);margin-top:8px">Gracias ' + nombre + ', nos contactaremos pronto.</p></div>';
        });
    }
});
