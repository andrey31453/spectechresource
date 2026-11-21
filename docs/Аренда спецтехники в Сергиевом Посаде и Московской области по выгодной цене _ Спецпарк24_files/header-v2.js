/**
 * Header v2 — sandbox only (/header-preview).
 * Scoped to #spHeaderV2 / .sp-header-v2. Does not touch live header.
 */
(function () {
  'use strict';

  var STICKY_AT = 120;
  var DEBOUNCE_MS = 250;
  var SEARCH_ENDPOINTS = [
    '/assets/components/spsearch/search.php?query=',
    '/assets/components/simplesearch/connector.php?action=search&query='
  ];

  var DEMO_CATS = [
    { title: 'Автокраны в аренду', spec: '25 / 32 / 50 / 100 т', href: '/catalog/arenda-avtokrana/', keys: ['кран', 'автокран', 'liebherr', 'crane'] },
    { title: 'Автовышки в аренду', spec: 'Телескоп / колено 14–60 м', href: '/catalog/arenda-avtovyshki/', keys: ['вышк', 'автовыш', '28', '45', 'lift'] },
    { title: 'Экскаваторы-погрузчики в аренду', spec: 'JCB, гидромолот, ямобур', href: '/catalog/arenda-ekskavatora-pogruzchika', keys: ['jcb', 'экскаватор', 'погруз', 'гидромолот'] },
    { title: 'Манипуляторы в аренду', spec: '5 / 7 / 10 т, вездеходы', href: '/catalog/manipulyatory-v-arendu/', keys: ['ман', 'мани', 'манипулятор', 'кму'] },
    { title: 'Фронтальные погрузчики в аренду', spec: 'Ковш, фронталка', href: '/catalog/arenda-frontalnogo-pogruzchika', keys: ['фронтал', 'погрузчик'] },
    { title: 'Самосвалы в аренду', spec: 'Перевозка сыпучих', href: '/catalog/samosvaly', keys: ['самосвал'] }
  ];

  var DEMO_UNITS = [
    { title: 'Автовышка 28 м', spec: 'Телескопическая', price: 'от 2 200 ₽/ч', href: '/catalog/arenda-avtovyshki/28-metrov', keys: ['вышк', '28', 'автовыш'] },
    { title: 'Автокран 25 т', spec: 'Городские работы', price: 'от 3 500 ₽/ч', href: '/catalog/arenda-avtokrana/25-tonn', keys: ['кран', '25', 'автокран'] },
    { title: 'JCB 3CX', spec: 'Экскаватор-погрузчик', price: 'от 2 800 ₽/ч', href: '/catalog/arenda-ekskavatora-pogruzchika/jcb/', keys: ['jcb', 'экскаватор', '3cx'] },
    { title: 'Манипулятор 5 т', spec: 'Бортовой КМУ', price: 'от 2 100 ₽/ч', href: '/catalog/manipulyatory-v-arendu/5-tonn', keys: ['ман', 'мани', 'манипулятор', '5'] },
    { title: 'Манипулятор 7 т', spec: 'Бортовой КМУ', price: 'от 2 500 ₽/ч', href: '/catalog/manipulyatory-v-arendu/7-tonn', keys: ['ман', 'мани', 'манипулятор', '7'] },
    { title: 'Манипулятор 10 т', spec: 'Бортовой КМУ', price: 'от 3 200 ₽/ч', href: '/catalog/manipulyatory-v-arendu/10-tonn', keys: ['ман', 'мани', 'манипулятор', '10'] }
  ];

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function icoSvg() {
    return '<span class="sp-search-item__ico" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="14" height="8" rx="1"/><path d="M17 12h3l1 4H17"/><circle cx="7" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlight(text, query) {
    var t = escapeHtml(text);
    var q = String(query || '').trim();
    if (q.length < 2) return t;
    try {
      var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      return t.replace(re, '<mark>$1</mark>');
    } catch (e) {
      return t;
    }
  }

  ready(function () {
    var header = document.getElementById('spHeaderV2');
    if (!header) return;

    var searchInput = document.getElementById('spSearchInput');
    var searchResults = document.getElementById('spSearchResults');
    var searchClear = document.getElementById('spSearchClear');
    var searchLoader = document.getElementById('spSearchLoader');
    var searchContent = document.getElementById('spSearchContent');
    var mobileSearchToggle = document.getElementById('spMobileSearchToggle');
    var searchBar = document.getElementById('spSearchBar');
    var catalogWrap = document.getElementById('spCatalogWrap');
    var catalogBtn = document.getElementById('spCatalogBtn');

    // Spacer for sticky jump prevention
    var spacer = document.createElement('div');
    spacer.className = 'sp-header-v2-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    header.insertAdjacentElement('afterend', spacer);

    function syncSpacer() {
      if (header.classList.contains('is-sticky')) {
        spacer.style.height = header.offsetHeight + 'px';
        document.body.classList.add('sp-header-v2-stuck');
      } else {
        spacer.style.height = '0px';
        document.body.classList.remove('sp-header-v2-stuck');
      }
    }

    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y > STICKY_AT) {
        if (!header.classList.contains('is-sticky')) {
          header.classList.add('is-sticky');
          syncSpacer();
        }
      } else if (header.classList.contains('is-sticky')) {
        header.classList.remove('is-sticky');
        syncSpacer();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Hotkey /
    window.addEventListener('keydown', function (e) {
      if (e.key !== '/') return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) {
        return;
      }
      if (!searchInput) return;
      e.preventDefault();
      if (window.matchMedia('(max-width: 1023px)').matches && searchBar) {
        searchBar.classList.add('is-mobile-open');
      }
      searchInput.focus();
      searchInput.select();
    });

    // Mobile search toggle
    if (mobileSearchToggle && searchBar) {
      mobileSearchToggle.addEventListener('click', function () {
        searchBar.classList.toggle('is-mobile-open');
        if (searchBar.classList.contains('is-mobile-open') && searchInput) {
          searchInput.focus();
        }
      });
    }

    var searchShortcut = searchBar ? searchBar.querySelector('.sp-search-bar__shortcut') : null;

    function syncSearchChrome(query) {
      var has = query.length > 0;
      if (searchBar) searchBar.classList.toggle('has-query', has);
      if (searchClear) {
        searchClear.hidden = !has;
        if (has) searchClear.removeAttribute('hidden');
        else searchClear.setAttribute('hidden', '');
      }
      if (searchShortcut) {
        searchShortcut.hidden = has;
        if (has) searchShortcut.setAttribute('hidden', '');
        else searchShortcut.removeAttribute('hidden');
      }
    }

    function openSearchPanel() {
      if (!searchResults) return;
      searchResults.hidden = false;
      searchResults.removeAttribute('hidden');
      searchResults.setAttribute('aria-hidden', 'false');
    }

    function closeSearchPanel() {
      if (!searchResults) return;
      searchResults.hidden = true;
      searchResults.setAttribute('hidden', '');
      searchResults.setAttribute('aria-hidden', 'true');
    }

    // Clear search
    if (searchClear && searchInput && searchResults) {
      searchClear.addEventListener('click', function () {
        searchInput.value = '';
        syncSearchChrome('');
        searchInput.focus();
        // focus handler shows «Часто ищут»
        showPopularIfEmpty();
      });
    }

    // Live search
    var debounceTimer;
    var activeController = null;
    var searchReqId = 0;

    function matchDemoItem(item, q) {
      if (!q) return false;
      if ((item.title || '').toLowerCase().indexOf(q) !== -1) return true;
      return (item.keys || []).some(function (k) {
        var key = String(k).toLowerCase();
        return q.indexOf(key) !== -1 || key.indexOf(q) !== -1;
      });
    }

    function renderDemoResults(query) {
      var q = String(query || '').toLowerCase().trim();
      var cats = DEMO_CATS.filter(function (c) { return matchDemoItem(c, q); });
      var units = DEMO_UNITS.filter(function (u) { return matchDemoItem(u, q); });

      if (!cats.length && !units.length) {
        cats = DEMO_CATS.slice(0, 3);
        units = DEMO_UNITS.slice(0, 2);
      }

      var html = '';
      if (cats.length) {
        html += '<div class="sp-search-group-title">Категории</div>';
        cats.slice(0, 4).forEach(function (c) {
          html +=
            '<a href="' + c.href + '" class="sp-search-item">' +
            icoSvg() +
            '<div class="sp-search-item__info">' +
            '<span class="sp-search-item__title">' + highlight(c.title, query) + '</span>' +
            '<span class="sp-search-item__spec">' + escapeHtml(c.spec) + '</span>' +
            '</div></a>';
        });
      }
      if (units.length) {
        html += '<div class="sp-search-group-title">Техника в наличии</div>';
        units.slice(0, 5).forEach(function (u) {
          html +=
            '<a href="' + u.href + '" class="sp-search-item">' +
            icoSvg() +
            '<div class="sp-search-item__info">' +
            '<span class="sp-search-item__title">' + highlight(u.title, query) + '</span>' +
            '<span class="sp-search-item__spec">' + escapeHtml(u.spec) + '</span>' +
            '</div>' +
            '<span class="sp-search-item__price">' + escapeHtml(u.price) + '</span></a>';
        });
      }

      html +=
        '<div class="sp-search-empty" style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:12px;">' +
        '<p>Не нашли нужную машину? Подберём за 2 минуты</p>' +
        '<button type="button" class="sp-search-empty__btn" data-fancybox data-src="#modal-form">Оставить заявку</button>' +
        '</div>';

      if (searchContent) searchContent.innerHTML = html;
      openSearchPanel();
    }

    function renderFromJson(data, query) {
      if (!data || (!data.categories && !data.items && !data.results)) {
        renderDemoResults(query);
        return;
      }
      var cats = data.categories || [];
      var items = data.items || data.results || [];
      var html = '';
      if (cats.length) {
        html += '<div class="sp-search-group-title">Категории</div>';
        cats.forEach(function (c) {
          html +=
            '<a href="' + escapeHtml(c.href || c.url || '#') + '" class="sp-search-item">' +
            icoSvg() +
            '<div class="sp-search-item__info"><span class="sp-search-item__title">' +
            highlight(c.title || c.name || '', query) +
            '</span></div></a>';
        });
      }
      if (items.length) {
        html += '<div class="sp-search-group-title">Техника в наличии</div>';
        items.forEach(function (it) {
          html +=
            '<a href="' + escapeHtml(it.href || it.url || '#') + '" class="sp-search-item">' +
            (it.image ? '<img class="sp-search-item__img" src="' + escapeHtml(it.image) + '" alt="">' : icoSvg()) +
            '<div class="sp-search-item__info"><span class="sp-search-item__title">' +
            highlight(it.title || it.name || '', query) +
            '</span>' +
            (it.spec ? '<span class="sp-search-item__spec">' + escapeHtml(it.spec) + '</span>' : '') +
            '</div>' +
            (it.price ? '<span class="sp-search-item__price">' + escapeHtml(it.price) + '</span>' : '') +
            '</a>';
        });
      }
      if (!html) {
        renderDemoResults(query);
        return;
      }
      if (searchContent) searchContent.innerHTML = html;
      openSearchPanel();
    }

    function fetchLiveSearchResults(query, reqId) {
      if (activeController) {
        try { activeController.abort(); } catch (e) {}
      }
      activeController = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var signal = activeController ? activeController.signal : undefined;
      var idx = 0;
      var timedOut = false;
      var timer = setTimeout(function () {
        timedOut = true;
        try { if (activeController) activeController.abort(); } catch (e) {}
        if (reqId !== searchReqId) return;
        if (searchLoader) searchLoader.hidden = true;
        renderDemoResults(query);
      }, 900);

      function finishDemo() {
        clearTimeout(timer);
        if (reqId !== searchReqId) return;
        if (searchLoader) searchLoader.hidden = true;
        renderDemoResults(query);
      }

      function tryNext() {
        if (timedOut || reqId !== searchReqId) return;
        if (idx >= SEARCH_ENDPOINTS.length) {
          finishDemo();
          return;
        }
        var url = SEARCH_ENDPOINTS[idx++] + encodeURIComponent(query);
        fetch(url, { signal: signal, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('bad status');
            var ct = (res.headers.get('content-type') || '');
            if (ct.indexOf('json') === -1) throw new Error('not json');
            return res.json();
          })
          .then(function (data) {
            if (timedOut || reqId !== searchReqId) return;
            clearTimeout(timer);
            if (searchLoader) searchLoader.hidden = true;
            renderFromJson(data, query);
          })
          .catch(function (err) {
            if (reqId !== searchReqId || timedOut) return;
            if (err && err.name === 'AbortError') return;
            tryNext();
          });
      }

      tryNext();
    }

    var POPULAR_SEARCH = [
      { label: 'Автовышка 22м', href: '/catalog/arenda-avtovyshki/22-metra' },
      { label: 'Кран 25 тонн', href: '/catalog/arenda-avtokrana/25-tonn' },
      { label: 'Погрузчик JCB', href: '/catalog/arenda-ekskavatora-pogruzchika/jcb/' },
      { label: 'Самосвал 20 кубов', href: '/catalog/samosvaly' }
    ];

    function renderPopularSearches() {
      if (!searchContent) return;
      if (searchLoader) {
        searchLoader.hidden = true;
        searchLoader.setAttribute('hidden', '');
      }
      var html =
        '<div class="sp-search-popular">' +
        '<p class="sp-search-popular__title">Часто ищут сейчас</p>' +
        '<div class="sp-search-popular__chips">';
      POPULAR_SEARCH.forEach(function (item) {
        html +=
          '<a class="sp-search-popular__chip" href="' +
          escapeHtml(item.href) +
          '">' +
          escapeHtml(item.label) +
          '</a>';
      });
      html += '</div></div>';
      searchContent.innerHTML = html;
    }

    function showPopularIfEmpty() {
      if (!searchInput) return;
      var query = searchInput.value.trim();
      if (query.length >= 2) return;
      if (query.length > 0) {
        closeSearchPanel();
        return;
      }
      openSearchPanel();
      renderPopularSearches();
    }

    if (searchInput && searchResults) {
      syncSearchChrome(searchInput.value.trim());
      searchInput.addEventListener('focus', function () {
        showPopularIfEmpty();
      });
      searchInput.addEventListener('input', function () {
        var query = this.value.trim();
        syncSearchChrome(query);
        clearTimeout(debounceTimer);
        if (query.length < 2) {
          if (query.length === 0) {
            showPopularIfEmpty();
          } else {
            closeSearchPanel();
          }
          return;
        }
        // Force panel open immediately (≥2 chars) — live search takes over
        openSearchPanel();
        if (searchLoader) {
          searchLoader.hidden = false;
          searchLoader.removeAttribute('hidden');
        }
        // Instant demo so «мани» always shows even if AJAX hangs
        renderDemoResults(query);
        if (searchLoader) searchLoader.hidden = true;

        debounceTimer = setTimeout(function () {
          var reqId = ++searchReqId;
          fetchLiveSearchResults(query, reqId);
        }, DEBOUNCE_MS);
      });
    }

    document.addEventListener('click', function (e) {
      if (searchBar && searchResults && !searchBar.contains(e.target)) {
        closeSearchPanel();
      }
    });

    // Catalog mega-menu (independent of live mega-menu.js selectors)
    var catalogCloseTimer = null;

    function setCatalogOpen(open) {
      if (!catalogWrap || !catalogBtn) return;
      catalogWrap.classList.toggle('is-open', open);
      catalogBtn.classList.toggle('is-active', open);
      catalogBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openCatalog() {
      clearTimeout(catalogCloseTimer);
      setCatalogOpen(true);
    }

    function closeCatalog() {
      clearTimeout(catalogCloseTimer);
      catalogWrap && catalogWrap.classList.remove('is-hover');
      setCatalogOpen(false);
    }

    function scheduleCatalogClose() {
      clearTimeout(catalogCloseTimer);
      catalogCloseTimer = setTimeout(closeCatalog, 160);
    }

    if (catalogBtn && catalogWrap) {
      catalogBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (catalogWrap.classList.contains('is-open')) closeCatalog();
        else openCatalog();
      });

      catalogWrap.addEventListener('mouseenter', function () {
        if (window.matchMedia('(max-width: 1023px)').matches) return;
        clearTimeout(catalogCloseTimer);
        catalogWrap.classList.add('is-hover');
        openCatalog();
      });

      catalogWrap.addEventListener('mouseleave', function () {
        if (window.matchMedia('(max-width: 1023px)').matches) return;
        scheduleCatalogClose();
      });

      document.addEventListener('click', function (e) {
        if (!catalogWrap.classList.contains('is-open')) return;
        if (catalogWrap.contains(e.target)) return;
        closeCatalog();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCatalog();
      });
    }

    // Geo city chooser: handled by /template/js/sp-city-modal.js (data-sp-city-open)

    // Email copy (topbar) — CSS swaps icons via .is-copied; never show both
    header.querySelectorAll('[data-sp-email-copy]').forEach(function (btn) {
      var resetTimer = null;

      function setCopied(on) {
        btn.classList.toggle('is-copied', !!on);
        btn.setAttribute('aria-label', on ? 'Скопировано' : 'Скопировать email');
        btn.title = on ? 'Скопировано' : 'Скопировать email';
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var email = (btn.getAttribute('data-email') || '').trim();
        if (!email) {
          var textEl = header.querySelector('.sp-header-v2__email-text');
          email = textEl ? String(textEl.textContent || '').trim() : '';
        }
        if (!email) return;

        function done() {
          setCopied(true);
          if (resetTimer) clearTimeout(resetTimer);
          resetTimer = setTimeout(function () { setCopied(false); }, 1500);
        }

        function fallbackCopy() {
          try {
            var ta = document.createElement('textarea');
            ta.value = email;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done();
          } catch (err) { /* ignore */ }
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(done).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    });

    // Mobile drawer — port to <body> so sticky header backdrop-filter / stacking
    // context cannot trap fixed overlay under catalog cards / #toTop / sticky UI.
    var burgerOpen = document.getElementById('spBurgerOpen');
    var drawer = document.getElementById('spMobileDrawer');
    var drawerBackdrop = document.getElementById('spDrawerBackdrop');
    var drawerClose = document.getElementById('spDrawerClose');
    var drawerHome = drawer ? drawer.parentNode : null;

    function toggleDrawer(open) {
      if (!drawer) return;
      if (open) {
        if (drawer.parentNode !== document.body) {
          document.body.appendChild(drawer);
        }
        drawer.classList.add('sp-drawer--ported');
        header.classList.add('is-drawer-open');
        document.body.classList.add('sp-drawer-open');
        drawer.classList.add('is-open');
      } else {
        drawer.classList.remove('is-open');
        header.classList.remove('is-drawer-open');
        document.body.classList.remove('sp-drawer-open');
        if (drawerHome && drawer.parentNode !== drawerHome) {
          drawerHome.appendChild(drawer);
        }
        drawer.classList.remove('sp-drawer--ported');
      }
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (burgerOpen) burgerOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (burgerOpen) burgerOpen.addEventListener('click', function () { toggleDrawer(true); });
    if (drawerClose) drawerClose.addEventListener('click', function () { toggleDrawer(false); });
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', function () { toggleDrawer(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggleDrawer(false);
    });
  });
})();
