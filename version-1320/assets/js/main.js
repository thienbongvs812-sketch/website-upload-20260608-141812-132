(function () {
    var navToggle = document.querySelector('[data-nav-toggle]');
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            document.body.classList.toggle('nav-open');
        });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var active = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === active);
            });
        }

        function nextSlide() {
            showSlide(active + 1);
        }

        function restart() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(nextSlide, 5000);
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                showSlide(active - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(active + 1);
                restart();
            });
        }

        restart();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    document.querySelectorAll('[data-filter]').forEach(function (panel) {
        var scope = panel.parentElement || document;
        var input = panel.querySelector('[data-filter-input]');
        var region = panel.querySelector('[data-filter-region]');
        var type = panel.querySelector('[data-filter-type]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
        var empty = scope.querySelector('[data-empty-state]');
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q');

        if (input && initialQuery) {
            input.value = initialQuery;
        }

        function applyFilter() {
            var query = normalize(input ? input.value : '');
            var selectedRegion = region ? region.value : '';
            var selectedType = type ? type.value : '';
            var visible = 0;

            cards.forEach(function (card) {
                var text = normalize(card.getAttribute('data-search'));
                var cardRegion = card.getAttribute('data-region') || '';
                var cardType = card.getAttribute('data-type') || '';
                var matched = true;

                if (query && text.indexOf(query) === -1) {
                    matched = false;
                }
                if (selectedRegion && cardRegion !== selectedRegion) {
                    matched = false;
                }
                if (selectedType && cardType !== selectedType) {
                    matched = false;
                }

                card.hidden = !matched;
                if (matched) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        [input, region, type].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            }
        });

        applyFilter();
    });

    var configNode = document.getElementById('player-config');
    if (configNode) {
        var playerConfig = null;
        try {
            playerConfig = JSON.parse(configNode.textContent || '{}');
        } catch (error) {
            playerConfig = null;
        }

        var video = document.getElementById('moviePlayer');
        var startButton = document.querySelector('[data-player-start]');
        var source = playerConfig && playerConfig.source;
        var hls = null;
        var loaded = false;

        function attachSource() {
            if (!video || !source || loaded) {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                loaded = true;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                loaded = true;
                return;
            }

            video.src = source;
            loaded = true;
        }

        function startPlayback() {
            attachSource();
            if (startButton) {
                startButton.hidden = true;
            }
            if (video) {
                video.controls = true;
                var promise = video.play();
                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {
                        if (startButton) {
                            startButton.hidden = false;
                        }
                    });
                }
            }
        }

        if (startButton) {
            startButton.addEventListener('click', startPlayback);
        }

        if (video) {
            video.addEventListener('click', function () {
                if (!loaded || video.paused) {
                    startPlayback();
                } else {
                    video.pause();
                }
            });
        }
    }
})();
