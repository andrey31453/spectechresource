/**
 * Specpark24 city modal v2 — Variant A (lazy cities.json + SSR hubs).
 */
(function () {
  'use strict';

  var EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,./`QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?~";
  var RU = "йцукенгшщзхъфывапролджэячсмитьбю.ёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,Ё";
  var ALPHA = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ";

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qwertyToRu(str) {
    return String(str).split('').map(function (ch) {
      var i = EN.indexOf(ch);
      return i >= 0 ? RU.charAt(i) : ch;
    }).join('');
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, ' ')
      .trim();
  }

  ready(function () {
    var modal = document.querySelector('[data-sp-city-modal]');
    if (!modal) return;

    var dialog = modal.querySelector('.sp-city-modal__dialog');
    var bodyEl = modal.querySelector('[data-sp-city-body]');
    var grid = modal.querySelector('[data-sp-city-grid]');
    var alphaEl = modal.querySelector('[data-sp-city-alpha]');
    var input = document.getElementById('spCitySearch');
    var clearBtn = modal.querySelector('[data-sp-city-clear]');
    var emptyEl = modal.querySelector('[data-sp-city-empty]');
    var countEl = modal.querySelector('[data-sp-city-count]');
    var badgeEl = modal.querySelector('[data-sp-city-badge]');
    var citiesUrl = modal.getAttribute('data-cities-url') || '/assets/data/cities.json';
    var filialyUrl = modal.getAttribute('data-filialy-url') || '/o-kompanii/filialy';

    var cities = null;
    var loadPromise = null;
    var lastFocus = null;
    var openTriggers = [];
    var letterObserver = null;
    var rendered = false;
    var scrollbarW = 0;

    function isMobile() {
      return window.matchMedia('(max-width: 720px)').matches;
    }

    function toAsciiHost(host) {
      host = String(host || '').toLowerCase().replace(/^www\./, '');
      try {
        return new URL('https://' + host + '/').hostname.toLowerCase().replace(/^www\./, '');
      } catch (e) {
        return host;
      }
    }

    function hostsMatch(a, b) {
      a = toAsciiHost(a);
      b = toAsciiHost(b);
      return !!a && a === b;
    }

    function currentHost() {
      return toAsciiHost(location.hostname || '');
    }

    function currentPath() {
      var path = location.pathname || '/';
      if (/^\/(manager|connectors)(\/|$)/i.test(path)) path = '/';
      return path;
    }

    function deepLink(hostOrUrl) {
      var host = hostOrUrl;
      try {
        if (/^https?:/i.test(hostOrUrl)) host = new URL(hostOrUrl).hostname;
      } catch (e) { /* keep */ }
      host = String(host || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      var path = currentPath();
      var search = location.search || '';
      // drop our own cache-bust query noise? keep as-is for deep link fidelity
      return 'https://' + host + (path === '/' ? '/' : path) + search;
    }

    function displayNameForHost(host) {
      host = toAsciiHost(host);
      if (hostsMatch(host, 'спецпарк24.рф') || hostsMatch(host, 'xn--24-6kct0a1abje6c.xn--p1ai')) {
        return 'Москва и МО';
      }
      if (cities) {
        for (var i = 0; i < cities.length; i++) {
          if (hostsMatch(cities[i].h, host)) return cities[i].n;
        }
      }
      var chip = modal.querySelector('.sp-city-modal__chip[data-sp-city-host]');
      var cur = modal.querySelector('.sp-city-modal__chip.is-current');
      if (cur) return cur.textContent.replace(/^✓\s*/, '').trim();
      return document.querySelector('.sp-geo-dropdown__current')
        ? document.querySelector('.sp-geo-dropdown__current').textContent.trim()
        : 'ваш регион';
    }

    function updateBadge() {
      if (!badgeEl) return;
      var name = displayNameForHost(currentHost());
      if (name === 'Москва' || /^москва$/i.test(name)) name = 'Москва и МО';
      badgeEl.innerHTML = 'Сейчас: <strong>' + escapeHtml(name) + '</strong>';
    }

    function measureScrollbar() {
      scrollbarW = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      document.documentElement.style.setProperty('--sp-city-scrollbar-w', scrollbarW + 'px');
    }

    function loadCities() {
      if (cities) return Promise.resolve(cities);
      if (loadPromise) return loadPromise;
      loadPromise = fetch(citiesUrl + (citiesUrl.indexOf('?') >= 0 ? '&' : '?') + 'v=1', {
        credentials: 'same-origin',
        cache: 'force-cache'
      })
        .then(function (r) {
          if (!r.ok) throw new Error('cities ' + r.status);
          return r.json();
        })
        .then(function (data) {
          cities = Array.isArray(data) ? data : (data.c || data.cities || []);
          return cities;
        })
        .catch(function (err) {
          loadPromise = null;
          if (countEl) {
            countEl.innerHTML = 'Не удалось загрузить список. <a href="' + escapeHtml(filialyUrl) + '">Открыть филиалы</a>';
          }
          throw err;
        });
      return loadPromise;
    }

    function prefetch() {
      loadCities().catch(function () { /* silent prefetch */ });
    }

    function highlight(text, query) {
      var t = escapeHtml(text);
      var q = String(query || '').trim();
      if (q.length < 1) return t;
      try {
        var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        return t.replace(re, '<mark class="sp-city-modal__mark">$1</mark>');
      } catch (e) {
        return t;
      }
    }

    function cityMatches(city, qRaw) {
      if (!qRaw) return true;
      var q = norm(qRaw);
      var q2 = norm(qwertyToRu(qRaw));
      var hay = [city.n, city.r || '', city.h || ''].concat(city.a || []).map(norm).join(' ');
      return hay.indexOf(q) !== -1 || (q2 && hay.indexOf(q2) !== -1);
    }

    function renderAlpha(present) {
      if (!alphaEl) return;
      var html = '';
      for (var i = 0; i < ALPHA.length; i++) {
        var L = ALPHA.charAt(i);
        var on = present[L];
        html += '<button type="button" class="sp-city-modal__alpha-btn" data-letter="' + L + '"' + (on ? '' : ' disabled') + '>' + L + '</button>';
      }
      alphaEl.innerHTML = html;
      alphaEl.querySelectorAll('.sp-city-modal__alpha-btn:not([disabled])').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var letter = btn.getAttribute('data-letter');
          var target = grid.querySelector('.sp-city-modal__group[data-letter="' + letter + '"]');
          if (target && bodyEl) {
            bodyEl.scrollTop = target.offsetTop - 8;
          }
        });
      });
    }

    function bindLetterObserver() {
      if (!bodyEl || !alphaEl || typeof IntersectionObserver === 'undefined') return;
      if (letterObserver) letterObserver.disconnect();
      var groups = grid.querySelectorAll('.sp-city-modal__group');
      letterObserver = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        if (!visible.length) return;
        var L = visible[0].target.getAttribute('data-letter');
        alphaEl.querySelectorAll('.sp-city-modal__alpha-btn').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-letter') === L);
        });
      }, { root: bodyEl, threshold: 0.15, rootMargin: '-10% 0px -70% 0px' });
      groups.forEach(function (g) { letterObserver.observe(g); });
    }

    function renderList(query) {
      if (!cities || !grid) return;
      var q = String(query || '').trim();
      modal.classList.toggle('is-searching', q.length > 0);

      var present = {};
      var groups = {};
      var order = [];
      var visible = 0;

      cities.forEach(function (city) {
        if (!cityMatches(city, q)) return;
        var letter = String(city.n || '').charAt(0).toUpperCase();
        if (!groups[letter]) {
          groups[letter] = [];
          order.push(letter);
          present[letter] = true;
        }
        groups[letter].push(city);
        visible += 1;
      });

      renderAlpha(present);

      if (!visible) {
        grid.innerHTML = '';
        if (emptyEl) emptyEl.removeAttribute('hidden');
        if (countEl) countEl.textContent = '0 в списке';
        return;
      }
      if (emptyEl) emptyEl.setAttribute('hidden', '');

      var html = [];
      order.forEach(function (letter) {
        html.push('<div class="sp-city-modal__group" data-letter="' + escapeHtml(letter) + '" id="sp-city-letter-' + escapeHtml(letter) + '">');
        html.push('<div class="sp-city-modal__letter" aria-hidden="true">' + escapeHtml(letter) + '</div>');
        html.push('<div class="sp-city-modal__group-links">');
        groups[letter].forEach(function (city) {
          var href = deepLink(city.h);
          var cur = hostsMatch(city.h, currentHost());
          var qMark = q;
          if (q && norm(city.n).indexOf(norm(q)) === -1 && norm(city.n).indexOf(norm(qwertyToRu(q))) !== -1) {
            qMark = qwertyToRu(q);
          }
          var nameHtml = q ? highlight(city.n, qMark) : escapeHtml(city.n);
          html.push(
            '<a class="sp-city-modal__link' + (cur ? ' is-current' : '') + '" href="' + escapeHtml(href) + '" data-sp-city-host="' + escapeHtml(city.h) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
              '<span class="sp-city-modal__name">' + nameHtml + '</span>' +
              (city.r ? ' <span class="sp-city-modal__sub">' + escapeHtml(city.r) + '</span>' : '') +
            '</a>'
          );
        });
        html.push('</div></div>');
      });
      grid.innerHTML = html.join('');
      rendered = true;
      if (countEl) countEl.textContent = visible + ' в списке';
      markCurrent();
      bindLetterObserver();
    }

    function markCurrent() {
      var host = currentHost();
      modal.querySelectorAll('[data-sp-city-host]').forEach(function (a) {
        var on = hostsMatch(a.getAttribute('data-sp-city-host'), host);
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      updateBadge();
    }

    function syncHubPaths() {
      modal.querySelectorAll('a[data-sp-city-hub], a.sp-city-modal__chip').forEach(function (a) {
        var host = a.getAttribute('data-sp-city-host');
        if (!host) {
          try { host = new URL(a.href).hostname; } catch (e) { return; }
        }
        a.setAttribute('href', deepLink(host));
      });
    }

    function filterHubs(q) {
      modal.querySelectorAll('.sp-city-modal__chip').forEach(function (chip) {
        var city = {
          n: chip.textContent,
          h: chip.getAttribute('data-sp-city-host') || '',
          a: [],
          r: ''
        };
        chip.classList.toggle('is-hidden', !cityMatches(city, q));
      });
    }

    function onSearch() {
      var q = input ? input.value : '';
      if (clearBtn) {
        if (String(q).trim()) clearBtn.removeAttribute('hidden');
        else clearBtn.setAttribute('hidden', '');
      }
      filterHubs(q);
      if (cities) renderList(q);
    }

    function focusables() {
      return Array.prototype.slice.call(
        dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) {
        return !el.hasAttribute('hidden') && !el.classList.contains('is-hidden') && el.offsetParent !== null;
      });
    }

    function openModal(trigger) {
      lastFocus = trigger || document.activeElement;
      measureScrollbar();
      document.body.classList.add('sp-city-modal-open');
      if (scrollbarW > 0) document.body.classList.add('sp-city-modal-gutter');
      modal.hidden = false;
      modal.removeAttribute('hidden');
      openTriggers.forEach(function (btn) { btn.setAttribute('aria-expanded', 'true'); });
      syncHubPaths();
      markCurrent();
      updateBadge();

      loadCities().then(function () {
        onSearch();
      }).catch(function () {
        if (grid) {
          grid.innerHTML = '<p class="sp-city-modal__loading">Список временно недоступен. <a href="' + escapeHtml(filialyUrl) + '">Все филиалы</a></p>';
        }
      });

      window.setTimeout(function () {
        if (input && !isMobile()) {
          input.focus();
          input.select();
        } else {
          var close = modal.querySelector('[data-sp-city-close]');
          if (close) close.focus();
        }
      }, 20);
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute('hidden', '');
      document.body.classList.remove('sp-city-modal-open', 'sp-city-modal-gutter');
      openTriggers.forEach(function (btn) { btn.setAttribute('aria-expanded', 'false'); });
      if (letterObserver) letterObserver.disconnect();
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus(); } catch (e) { /* ignore */ }
      }
    }

    function isOpen() {
      return !modal.hasAttribute('hidden') && modal.hidden !== true;
    }

    // Deep-link navigation for dynamically rendered + hub links
    modal.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-sp-city-host]');
      if (!a || !modal.contains(a)) return;
      // allow modified clicks
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var host = a.getAttribute('data-sp-city-host');
      if (!host) return;
      e.preventDefault();
      location.href = deepLink(host);
    });

    document.querySelectorAll('[data-sp-city-open], .header__top-city, .sp-geo-dropdown__btn, .sp-drawer__city').forEach(function (el) {
      openTriggers.push(el);
      el.setAttribute('aria-haspopup', 'dialog');
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-controls', 'spCityModal');
      if (el.classList.contains('sp-drawer__city')) {
        el.setAttribute('role', 'button');
        el.tabIndex = 0;
        el.style.cursor = 'pointer';
      }
      el.addEventListener('mouseenter', prefetch, { passive: true });
      el.addEventListener('touchstart', prefetch, { passive: true });
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen()) closeModal();
        else openModal(el);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(el);
        }
      });
    });

    modal.querySelectorAll('[data-sp-city-close]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      });
    });

    if (input) {
      input.addEventListener('input', onSearch);
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var first = grid && grid.querySelector('.sp-city-modal__link:not(.is-hidden)');
        if (!first) first = modal.querySelector('.sp-city-modal__chip:not(.is-hidden)');
        if (first) {
          var host = first.getAttribute('data-sp-city-host');
          if (host) location.href = deepLink(host);
          else location.href = first.href;
        }
      });
    }
    if (clearBtn && input) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        onSearch();
        if (!isMobile()) input.focus();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Idle prefetch after load
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function () { prefetch(); }, { timeout: 4000 });
    } else {
      window.setTimeout(prefetch, 2500);
    }

    updateBadge();
    syncHubPaths();
    markCurrent();
  });
})();
