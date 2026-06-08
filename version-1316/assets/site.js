(function () {
    function all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function one(selector, root) {
        return (root || document).querySelector(selector);
    }

    function bindMenu() {
        var button = one('[data-nav-toggle]');
        var panel = one('[data-mobile-panel]');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function bindHero() {
        var hero = one('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = all('[data-hero-slide]', hero);
        var dots = all('[data-hero-dot]', hero);
        var prev = one('[data-hero-prev]', hero);
        var next = one('[data-hero-next]', hero);
        var index = 0;
        var timer;
        function activate(target) {
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, itemIndex) {
                slide.classList.toggle('is-active', itemIndex === index);
            });
            dots.forEach(function (dot, itemIndex) {
                dot.classList.toggle('is-active', itemIndex === index);
            });
        }
        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                activate(index + 1);
            }, 5600);
        }
        dots.forEach(function (dot, itemIndex) {
            dot.addEventListener('click', function () {
                activate(itemIndex);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                activate(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                activate(index + 1);
                restart();
            });
        }
        if (slides.length > 1) {
            restart();
        }
    }

    function bindFiltering() {
        var list = one('[data-card-list]');
        if (!list) {
            return;
        }
        var cards = all('[data-card]', list);
        var search = one('[data-list-search]');
        var year = one('[data-list-year]');
        var mainSearch = one('[data-main-search]');
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        if (mainSearch) {
            mainSearch.value = query;
        }
        if (search && query) {
            search.value = query;
        }
        function apply() {
            var text = search ? search.value.trim().toLowerCase() : '';
            var selectedYear = year ? year.value : '';
            cards.forEach(function (card) {
                var keys = card.getAttribute('data-keywords') || '';
                var byText = !text || keys.indexOf(text) !== -1;
                var byYear = !selectedYear || keys.indexOf(selectedYear) !== -1;
                card.classList.toggle('is-hidden', !(byText && byYear));
            });
        }
        if (search) {
            search.addEventListener('input', apply);
        }
        if (year) {
            year.addEventListener('change', apply);
        }
        apply();
    }

    function bindPlayer() {
        var frame = one('[data-player]');
        if (!frame) {
            return;
        }
        var video = one('video', frame);
        var button = one('[data-play-button]', frame);
        var stream = frame.getAttribute('data-stream');
        var ready = false;
        var hlsInstance = null;
        function attach() {
            if (!video || !stream) {
                return;
            }
            if (ready) {
                video.play().catch(function () {});
                return;
            }
            ready = true;
            frame.classList.add('is-started');
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }
            video.play().catch(function () {});
        }
        if (button) {
            button.addEventListener('click', attach);
        }
        frame.addEventListener('click', function (event) {
            if (event.target === video || event.target === frame) {
                attach();
            }
        });
        window.addEventListener('pagehide', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindMenu();
        bindHero();
        bindFiltering();
        bindPlayer();
    });
})();
