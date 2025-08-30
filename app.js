// =========================================================
// Strux – Minimal Landing Scripts
// - Sticky Header State (schwebend / angedockt)
// - Creator Slideshow mit Daten aus creators.json
// =========================================================

(function() {
    const byId = (id) => document.getElementById(id);
    const $header = document.getElementById('site-header');
    const $year = document.getElementById('year');
    if ($year) $year.textContent = new Date().getFullYear();

    // Header: at-top vs scrolled (bleibt sticky, ändert Stil)
    const topSentinel = document.getElementById('top-sentinel');
    if ('IntersectionObserver' in window && topSentinel) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    $header.classList.add('at-top');
                    $header.classList.remove('scrolled');
                } else {
                    $header.classList.remove('at-top');
                    $header.classList.add('scrolled');
                }
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
            b.setAttribute('aria-label', `${c.name}`);
            b.setAttribute('aria-selected', i === state.index ? 'true' : 'false');
            b.addEventListener('click', () => goTo(i));
            $dots.appendChild(b);
        });
    }

    function render() {
        if (!state.creators.length) return;
        const c = state.creators[state.index];

        $card.setAttribute('aria-busy', 'true');

        // Media
        if (c.video) {
            $video.src = c.video;
            $video.poster = c.poster || '';
            $video.muted = true; $video.loop = true; $video.playsInline = true; $video.autoplay = true;
            $video.play().catch(() => {/* ignored */});
        } else {
            $video.removeAttribute('src');
            $video.poster = c.poster || '';
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
        Array.from($dots.children).forEach((el, i) => el.setAttribute('aria-selected', i === state.index ? 'true' : 'false'));

        // Simple fade pulse
        $card.style.opacity = '0.96';
        requestAnimationFrame(() => { $card.style.transition = 'opacity .35s ease'; $card.style.opacity = '1'; });

        $card.removeAttribute('aria-busy');
    }

    function next() { state.index = (state.index + 1) % state.creators.length; render(); }
    function prev() { state.index = (state.index - 1 + state.creators.length) % state.creators.length; render(); }
    function goTo(i) { state.index = i; render(); resetTimer(); }

    function resetTimer() {
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(next, state.intervalMs);
    }

    function wireEvents() {
        $next.addEventListener('click', () => { next(); resetTimer(); });
        $prev.addEventListener('click', () => { prev(); resetTimer(); });
        // Pause bei Hover
        const carousel = document.querySelector('.carousel');
        carousel.addEventListener('mouseenter', () => { if (state.timer) clearInterval(state.timer); });
        carousel.addEventListener('mouseleave', resetTimer);
    }

    async function loadCreators() {
        try {
            const res = await fetch('creators.json', { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            state.creators = Array.isArray(json) ? json : (json.creators || []);
            if (!state.creators.length) throw new Error('Keine Creator in creators.json gefunden');
            renderDots();
            render();
            resetTimer();
        } catch (err) {
            console.error('[Strux] Konnte creators.json nicht laden:', err);
            // Fallback Dummy
            state.creators = [{
                name: 'DemoCreator', handle: '@demo', followers: 12345, platform: 'Twitch', category: 'Variety',
                avatar: 'assets/demo-avatar.jpg', video: 'assets/demo-video.mp4', poster: 'assets/demo-poster.jpg'
            }];
            renderDots();
            render();
        }
    }

    // Init
    wireEvents();
    loadCreators();
})();
