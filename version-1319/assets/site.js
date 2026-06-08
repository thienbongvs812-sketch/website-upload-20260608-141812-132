(function () {
    function getText(value) {
        return (value || "").toString().toLowerCase().trim();
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
        var prev = carousel.querySelector("[data-hero-prev]");
        var next = carousel.querySelector("[data-hero-next]");
        var index = 0;
        var timer;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function restart() {
            window.clearInterval(timer);
            start();
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });
        show(0);
        start();
    }

    function setupSearchForms() {
        Array.prototype.slice.call(document.querySelectorAll("[data-search-form]")).forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector("input[name='q']");
                if (!input || !input.value.trim()) {
                    event.preventDefault();
                    window.location.href = "./search.html";
                }
            });
        });
    }

    function setupFilters() {
        var input = document.querySelector("[data-filter-input]");
        var year = document.querySelector("[data-filter-year]");
        var type = document.querySelector("[data-filter-type]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var empty = document.querySelector("[data-empty-state]");
        if (!cards.length) {
            return;
        }

        var query = new URLSearchParams(window.location.search).get("q") || "";
        if (input && query) {
            input.value = query;
        }

        function matchCard(card) {
            var keyword = getText(input ? input.value : "");
            var yearValue = year ? year.value : "";
            var typeValue = type ? type.value : "";
            var searchTarget = [
                card.getAttribute("data-title"),
                card.getAttribute("data-year"),
                card.getAttribute("data-region"),
                card.getAttribute("data-type"),
                card.getAttribute("data-genre"),
                card.getAttribute("data-tags")
            ].join(" ").toLowerCase();
            var keywordOk = !keyword || searchTarget.indexOf(keyword) !== -1;
            var yearOk = !yearValue || card.getAttribute("data-year") === yearValue;
            var typeOk = !typeValue || card.getAttribute("data-type") === typeValue;
            return keywordOk && yearOk && typeOk;
        }

        function applyFilters() {
            var visible = 0;
            cards.forEach(function (card) {
                var isVisible = matchCard(card);
                card.style.display = isVisible ? "" : "none";
                if (isVisible) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        [input, year, type].forEach(function (control) {
            if (control) {
                control.addEventListener("input", applyFilters);
                control.addEventListener("change", applyFilters);
            }
        });
        applyFilters();
    }

    window.setupMoviePlayer = function (url) {
        var video = document.querySelector("[data-player]");
        var cover = document.querySelector("[data-play-cover]");
        if (!video || !url) {
            return;
        }
        var loaded = false;
        var hlsInstance = null;

        function attach() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls();
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);
            } else {
                video.src = url;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            video.setAttribute("controls", "controls");
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("click", function () {
            if (!loaded) {
                play();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        setupMenu();
        setupHero();
        setupSearchForms();
        setupFilters();
    });
})();
