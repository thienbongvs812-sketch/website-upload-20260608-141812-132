(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", nav.classList.contains("is-open") ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = selectAll(".hero-slide");
    var dots = selectAll(".hero-dot");
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer;

    function show(nextIndex) {
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

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(dotIndex);
        start();
      });
    });

    show(0);
    start();
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function applyFilters(root) {
    var cards = selectAll(".movie-card, .rank-card", root);
    var queryInput = document.querySelector("[data-page-search]");
    var yearSelect = document.querySelector("[data-year-select]");
    var summary = document.querySelector("[data-search-summary]");
    var emptyState = document.querySelector("[data-empty-state]");
    var activeCategory = document.querySelector(".filter-chip.is-active");
    var query = queryInput ? normalize(queryInput.value) : "";
    var selectedYear = yearSelect ? normalize(yearSelect.value) : "";
    var selectedType = activeCategory ? normalize(activeCategory.getAttribute("data-filter-type")) : "";
    var visible = 0;

    cards.forEach(function (card) {
      var title = normalize(card.getAttribute("data-title"));
      var meta = normalize(card.getAttribute("data-meta"));
      var year = normalize(card.getAttribute("data-year"));
      var type = normalize(card.getAttribute("data-type"));
      var matchesQuery = !query || title.indexOf(query) !== -1 || meta.indexOf(query) !== -1;
      var matchesYear = !selectedYear || selectedYear === "all" || year === selectedYear;
      var matchesType = !selectedType || selectedType === "all" || type.indexOf(selectedType) !== -1 || meta.indexOf(selectedType) !== -1;
      var showCard = matchesQuery && matchesYear && matchesType;
      card.style.display = showCard ? "" : "none";
      if (showCard) {
        visible += 1;
      }
    });

    if (summary) {
      summary.textContent = query || selectedYear || selectedType ? "找到 " + visible + " 部相关影片" : "";
    }
    if (emptyState) {
      emptyState.classList.toggle("is-visible", visible === 0 && cards.length > 0);
    }
  }

  function setupPageFilters() {
    var root = document.querySelector("[data-card-scope]");
    if (!root) {
      return;
    }
    var queryInput = document.querySelector("[data-page-search]");
    var yearSelect = document.querySelector("[data-year-select]");
    var chips = selectAll(".filter-chip");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q");

    if (queryInput && initialQuery) {
      queryInput.value = initialQuery;
    }

    if (queryInput) {
      queryInput.addEventListener("input", function () {
        applyFilters(root);
      });
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", function () {
        applyFilters(root);
      });
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (item) {
          item.classList.remove("is-active");
        });
        chip.classList.add("is-active");
        applyFilters(root);
      });
    });

    applyFilters(root);
  }

  function setupHeaderSearch() {
    selectAll(".site-search-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input");
        var query = input ? input.value.trim() : "";
        if (query) {
          window.location.href = "rankings.html?q=" + encodeURIComponent(query);
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupHeaderSearch();
    setupPageFilters();
  });

  window.initMoviePlayer = function (config) {
    var video = document.getElementById(config.videoId);
    var button = document.getElementById(config.buttonId);
    var shell = video ? video.closest(".player-shell") : null;
    var hls = null;
    var loaded = false;

    if (!video || !button || !config.src) {
      return;
    }

    function load() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = config.src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 28,
          enableWorker: true
        });
        hls.loadSource(config.src);
        hls.attachMedia(video);
      } else {
        video.src = config.src;
      }
    }

    function play() {
      load();
      if (shell) {
        shell.classList.add("is-playing");
      }
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          if (shell) {
            shell.classList.remove("is-playing");
          }
        });
      }
    }

    button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (shell) {
        shell.classList.add("is-playing");
      }
    });
    video.addEventListener("ended", function () {
      if (shell) {
        shell.classList.remove("is-playing");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();
