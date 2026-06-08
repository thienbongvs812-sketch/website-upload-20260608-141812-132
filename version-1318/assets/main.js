(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupMenu() {
    var button = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
      button.textContent = expanded ? '☰' : '×';
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
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
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });
    start();
  }

  function setupImageFallback() {
    var images = document.querySelectorAll('img');
    images.forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-hidden');
      }, { once: true });
    });
  }

  function setupStaticFilters() {
    var bars = document.querySelectorAll('.filter-bar');
    bars.forEach(function (bar) {
      var section = bar.closest('section') || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll('.js-filter-card'));
      var input = bar.querySelector('[data-filter-input]');
      var selects = Array.prototype.slice.call(bar.querySelectorAll('[data-filter-field]'));
      function run() {
        var query = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = [card.dataset.title, card.dataset.region, card.dataset.type, card.dataset.year, card.dataset.genre, card.dataset.tags].join(' ').toLowerCase();
          var visible = !query || text.indexOf(query) !== -1;
          selects.forEach(function (select) {
            if (select.value && card.dataset[select.dataset.filterField] !== select.value) {
              visible = false;
            }
          });
          card.hidden = !visible;
        });
      }
      if (input) {
        input.addEventListener('input', run);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', run);
      });
    });
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '<a class="poster-link" href="' + escapeHtml(movie.detail) + '" aria-label="' + escapeHtml(movie.title) + '">',
      '<span class="poster-frame"><img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy"></span>',
      '<span class="year-badge">' + escapeHtml(movie.year) + '</span>',
      '<span class="play-dot">▶</span>',
      '</a>',
      '<div class="movie-card-body">',
      '<h3><a href="' + escapeHtml(movie.detail) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="card-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.genre) + '</p>',
      '<p class="card-line">' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="tag-row">' + tags + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function uniqueOptions(items, key) {
    var seen = Object.create(null);
    return items.map(function (item) {
      return item[key];
    }).filter(function (value) {
      if (!value || seen[value]) {
        return false;
      }
      seen[value] = true;
      return true;
    }).sort(function (a, b) {
      return String(b).localeCompare(String(a), 'zh-CN');
    });
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }
    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function setupSearch() {
    var form = document.querySelector('[data-search-form]');
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');
    var summary = document.querySelector('[data-search-summary]');
    var filters = document.querySelector('[data-search-filters]');
    var data = window.FILM_INDEX || [];
    if (!form || !input || !results || !summary || !data.length) {
      return;
    }
    var regionSelect = filters ? filters.querySelector('[data-search-field="region"]') : null;
    var typeSelect = filters ? filters.querySelector('[data-search-field="type"]') : null;
    var yearSelect = filters ? filters.querySelector('[data-search-field="year"]') : null;
    fillSelect(regionSelect, uniqueOptions(data, 'region'));
    fillSelect(typeSelect, uniqueOptions(data, 'type'));
    fillSelect(yearSelect, uniqueOptions(data, 'year'));

    var params = new URLSearchParams(window.location.search);
    if (params.get('q')) {
      input.value = params.get('q');
    }

    function match(movie, query) {
      if (!query) {
        return true;
      }
      var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.oneLine, (movie.tags || []).join(' ')].join(' ').toLowerCase();
      return text.indexOf(query) !== -1;
    }

    function run() {
      var query = input.value.trim().toLowerCase();
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var matches = data.filter(function (movie) {
        return match(movie, query)
          && (!region || movie.region === region)
          && (!type || movie.type === type)
          && (!year || movie.year === year);
      }).slice(0, 120);
      if (matches.length) {
        results.innerHTML = matches.map(cardTemplate).join('');
        summary.textContent = query ? '搜索结果' : '为你推荐相关内容';
      } else {
        results.innerHTML = '';
        summary.textContent = '没有找到匹配内容';
      }
      setupImageFallback();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      run();
    });
    input.addEventListener('input', run);
    [regionSelect, typeSelect, yearSelect].forEach(function (select) {
      if (select) {
        select.addEventListener('change', run);
      }
    });
    run();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupImageFallback();
    setupStaticFilters();
    setupSearch();
  });
})();
