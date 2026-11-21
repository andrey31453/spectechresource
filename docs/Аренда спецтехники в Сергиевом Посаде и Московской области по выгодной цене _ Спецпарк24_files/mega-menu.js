/**
 * Спецпарк24 — header mega menu
 * Desktop (≥1281): click toggle + hover with 150ms close delay + outside/Escape
 * Mobile (≤1280): accordion via .is-open / .active (works with burger drawer)
 * mega-7: demote self-links (current page) to non-cyclic spans
 */

(function () {
  var DESKTOP_MQ = '(min-width: 1281px)';
  var CLOSE_DELAY = 150;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function isDesktop() {
    return window.matchMedia(DESKTOP_MQ).matches;
  }

  function normPath(u) {
    if (!u) return '';
    try {
      if (u.charAt(0) === '#') return u;
      var a = document.createElement('a');
      a.href = u;
      return (a.pathname || '').replace(/^\/+|\/+$/g, '');
    } catch (e) {
      return String(u).replace(/^\/+|\/+$/g, '');
    }
  }

  function markActiveAndBreakCycles(root) {
    if (!root) return;
    var path = normPath(location.pathname);
    var fixed = [];

    root.querySelectorAll('[data-mega-match]').forEach(function (card) {
      var key = (card.getAttribute('data-mega-match') || '').replace(/^\/+|\/+$/g, '');
      if (!key) return;
      var active = path === key || path.indexOf(key + '/') === 0;
      card.classList.toggle('is-active', active);

      var head = card.querySelector('a.mega-card__head');
      if (!head) return;
      var headPath = normPath(head.getAttribute('href'));

      // Self-cycle: title points at current category (exact) → span
      if (headPath && path && path === headPath) {
        demoteLink(head);
        fixed.push('head→span self: ' + headPath);
      }

      // Only demote chips that point to the current page.
      var tags = card.querySelectorAll('a.mega-tag');
      tags.forEach(function (tag) {
        var tp = normPath(tag.getAttribute('href'));
        if (tp && path && tp === path) {
          demoteLink(tag);
          fixed.push('chip→span self: ' + tp);
        }
      });
    });

    // Catalog root CTA / trigger when already on catalog (id=2 uri often "catalog/")
    var all = root.querySelector('a.mega-menu__all');
    if (all && path === 'catalog') {
      demoteLink(all);
      fixed.push('all→span catalog root');
    }

    if (fixed.length && window.console && console.debug) {
      console.debug('[mega-menu] cyclic fixed', fixed);
    }
  }

  function demoteLink(a) {
    if (!a || a.tagName !== 'A') return;
    var span = document.createElement('span');
    span.className = a.className + (a.className ? ' ' : '') + 'is-current';
    span.innerHTML = a.innerHTML;
    if (a.getAttribute('aria-label')) {
      span.setAttribute('aria-label', a.getAttribute('aria-label'));
    }
    a.parentNode.replaceChild(span, a);
  }

  ready(function () {
    // Header v2: open/close handled by header-v2.js — only demote cyclic links
    var v2Wrap = document.querySelector('#spCatalogWrap, .sp-catalog-trigger-wrap');
    if (v2Wrap) {
      markActiveAndBreakCycles(v2Wrap.querySelector('.mega-menu'));
      return;
    }

    var catalog = document.querySelector('.item--catalog');
    var company = document.querySelector('.item--company');
    if (!catalog) return;

    var trigger = catalog.querySelector('.nav-catalog-trigger');
    var panel = catalog.querySelector('.mega-menu');
    if (!trigger || !panel) return;

    markActiveAndBreakCycles(panel);

    // If trigger href equals current page (catalog), prevent useless navigation on mobile open only
    var triggerPath = normPath(trigger.getAttribute('href'));
    var path = normPath(location.pathname);
    if (triggerPath && path && triggerPath === path) {
      trigger.addEventListener('click', function (e) {
        // always prevent same-page nav; menu toggle still handled below
        e.preventDefault();
      });
    }

    var closeTimer = null;

    function setExpanded(open) {
      catalog.classList.toggle('is-open', open);
      catalog.classList.toggle('active', open && !isDesktop());
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openMenu() {
      clearTimeout(closeTimer);
      setExpanded(true);
    }

    function closeMenu() {
      clearTimeout(closeTimer);
      setExpanded(false);
      catalog.classList.remove('is-hover');
    }

    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        setExpanded(false);
        catalog.classList.remove('is-hover');
      }, CLOSE_DELAY);
    }

    trigger.addEventListener('click', function (e) {
      if (isDesktop()) {
        e.preventDefault();
        if (catalog.classList.contains('is-open')) {
          closeMenu();
        } else {
          if (company) company.classList.remove('is-open');
          openMenu();
        }
        return;
      }
      setTimeout(function () {
        var open = catalog.classList.contains('active') || catalog.classList.contains('is-open');
        setExpanded(open);
      }, 0);
    });

    catalog.addEventListener('mouseenter', function () {
      if (!isDesktop()) return;
      clearTimeout(closeTimer);
      catalog.classList.add('is-hover');
      openMenu();
    });

    catalog.addEventListener('mouseleave', function () {
      if (!isDesktop()) return;
      scheduleClose();
    });

    panel.addEventListener('mouseenter', function () {
      if (!isDesktop()) return;
      clearTimeout(closeTimer);
      catalog.classList.add('is-hover');
      openMenu();
    });

    document.addEventListener('click', function (e) {
      if (!catalog.classList.contains('is-open') && !catalog.classList.contains('is-hover')) return;
      if (catalog.contains(e.target)) return;
      closeMenu();
      if (company) company.classList.remove('is-open');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeMenu();
      if (company) company.classList.remove('is-open');
    });

    if (company) {
      var companyTrigger = company.children[0];
      if (companyTrigger) {
        companyTrigger.addEventListener('click', function () {
          if (!isDesktop()) return;
          company.classList.toggle('is-open');
        });
      }
    }

    window.addEventListener('resize', function () {
      if (!isDesktop()) {
        catalog.classList.remove('is-hover');
      } else {
        catalog.classList.remove('active');
      }
    });
  });
})();

