/**
 * Hero v2 — select UI lives in shared premium-select.js.
 * Keep this file for deploy/cache-bust compatibility; init is a guarded no-op
 * when premium-select already wired the listbox.
 */
(function () {
  'use strict';

  function boot() {
    if (window.SpPremiumSelect && typeof window.SpPremiumSelect.init === 'function') {
      window.SpPremiumSelect.init();
      return;
    }
    /* Fallback: minimal init if premium-select.js failed to load */
    var roots = document.querySelectorAll('[data-sp-hero-select]');
    if (!roots.length) return;
    Array.prototype.forEach.call(roots, function (root) {
      if (root.getAttribute('data-sp-premium-inited') === '1') return;
      if (window.SpPremiumSelect && window.SpPremiumSelect.initRoot) {
        window.SpPremiumSelect.initRoot(root);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
