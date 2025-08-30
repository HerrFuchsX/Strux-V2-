// =========================================================
// Strux – Minimal Landing Scripts
// =========================================================

(function() {
    const byId = (id) => document.getElementById(id);
    const $header = document.getElementById('site-header');
    const $year = document.getElementById('year');
    if ($year) $year.textContent = new Date().getFullYear();

    // Header: at-top vs scrolled
    const topSentinel = document.getElementById('top-sentinel');
    if ('IntersectionObserver' in window && topSentinel) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                $header.classList.toggle('at-top', entry.isIntersecting);
                $header.classList.toggle('scrolled', !entry.isIntersecting);
            });
        }, { rootMargin: '-1px 0px 0px 0px', threshold: 0 });
        io.observe(topSentinel);
    }

    // Creator Slideshow ------------------------------------------------------
    const state = {
        creators: [],
        index: 0,
        timer: null,
        intervalMs: 6000,
    };

    const $card = document.querySelector('.creator-card');
    const $video = $card.querySelector('.creator-video');
    const $avatar = $card.querySelector('.avatar');
    const $name = $card.querySelector('.name');
    const $handle = $card.querySelector('.handle');
    const $followers = document.getElementById('stat-followers');
    const $platform = document.getElementById('stat-platform');
    const $category = document.getElementById('stat-category');
    const $prev = document.querySelector('.carousel-btn.prev');
    const $next = document.querySelector('.carousel-btn.next');
    const $dots = document.querySelector('.dots');

    function formatFollowers(n) {
        if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.0','') + ' Mio';
        if (n >= 1_000) return (n/1_000).toFixed(1).replace('.0','') + 'k';
        return String(n);
    }

    function renderDots() {
        $dots.innerHTML = '';
        state.creators.forEach((c, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-label', c.name);
            b.setAttribute('aria-selected', i === state.index);
            b.addEventListener('click', () => goTo(i));
            $dots.appendChild(b);
        });
    }

    function render(isInitial = false) {
        if (!state.creators.length) return;
        const c = state.creators[state.index];

        const animatedElements = [
            $name.parentElement, // The div containing name and handle
            ...$card.querySelectorAll('.stats li'),
            $avatar
        ];

        function updateContent() {
            // Media
            $video.src = c.video || '';
            $video.poster = c.poster || '';
            const playPromise = $video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {}); // Ignore autoplay errors
            }

            // Identity
            $avatar.src = c.avatar || '';
            $avatar.alt = c.name ? `${c.name} – Avatar` : 'Avatar';
            $name.textContent = c.name || 'Unbekannt';
            $handle.textContent = c.handle || '';

            // Stats
            $followers.textContent = c.followers != null ? formatFollowers(c.followers) : '–';
            $platform.textContent = c.platform || '–';
            $category.textContent = c.category || '–';

            // Update dots
            Array.from($dots.children).forEach((el, i) => el.setAttribute('aria-selected', i === state.index));

            // Trigger fade-in animation
            animatedElements.forEach(el => {
                el.classList.remove('anim-text-out');
                el.classList.add('anim-text-in');
            });

            $card.removeAttribute('aria-busy');
        }

        $card.setAttribute('aria-busy', 'true');

        if (!isInitial) {
            animatedElements.forEach(el => {
                el.classList.remove('anim-text-in');
                el.classList.add('anim-text-out');
            });
            setTimeout(updateContent, 300);
        } else {
            updateContent();
        }
    }

    function next() { state.index = (state.index + 1) % state.creators.length; render(); resetTimer(); }
    function prev() { state.index = (state.index - 1 + state.creators.length) % state.creators.length; render(); resetTimer(); }
    function goTo(i) { state.index = i; render(); resetTimer(); }

    function resetTimer() {
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(next, state.intervalMs);
    }

    function wireEvents() {
        $next.addEventListener('click', next);
        $prev.addEventListener('click', prev);
        const carousel = document.querySelector('.carousel');
        carousel.addEventListener('mouseenter', () => clearInterval(state.timer));
        carousel.addEventListener('mouseleave', resetTimer);
    }

    async function loadCreators() {
        try {
            const res = await fetch('creators.json', { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            state.creators = await res.json();
            if (!state.creators || !state.creators.length) throw new Error('No creators found');
            renderDots();
            render(true); // Initial render
            resetTimer();
        } catch (err) {
            console.error('[Strux] Could not load or parse creators.json:', err);
            // Don't destroy the card, just hide the carousel and show an error.
            const carousel = document.querySelector('.carousel');
            if (carousel) carousel.style.display = 'none';
            const errorEl = document.createElement('p');
            errorEl.textContent = 'Creator-Daten konnten nicht geladen werden.';
            errorEl.style.textAlign = 'center';
            $dots.parentElement.insertBefore(errorEl, $dots);
        }
    }

    // Mobile Nav Toggle ------------------------------------------------------
    const $mobileNavToggle = byId('mobile-nav-toggle');
    const $body = document.body;

    if ($mobileNavToggle) {
        $mobileNavToggle.addEventListener('click', () => {
            const isNavOpen = $body.classList.toggle('nav-open');
            $mobileNavToggle.setAttribute('aria-expanded', isNavOpen);
            $body.style.overflow = isNavOpen ? 'hidden' : '';
        });
    }

    // Smooth Scrolling -------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                if ($body.classList.contains('nav-open')) {
                    $body.classList.remove('nav-open');
                    $mobileNavToggle.setAttribute('aria-expanded', 'false');
                    $body.style.overflow = '';
                }
            }
        });
    });

    // Init
    wireEvents();
    loadCreators();
})();
