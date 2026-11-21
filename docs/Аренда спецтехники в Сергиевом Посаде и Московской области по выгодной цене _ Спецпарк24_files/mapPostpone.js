(function () {
  'use strict';

  function applyCrop(lazyMap) {
    if (!lazyMap) return;
    if (typeof window.__spCropMapRsya === 'function') {
      window.__spCropMapRsya(document);
      return;
    }
    var crop = 130;
    var cssCrop = getComputedStyle(lazyMap).getPropertyValue('--ymap-rsya-crop').trim();
    var parsed = parseInt(cssCrop, 10);
    if (parsed > 0) crop = parsed;
    lazyMap.style.setProperty('overflow', 'hidden', 'important');
    lazyMap.style.setProperty('position', 'relative', 'important');
    lazyMap.style.setProperty('--ymap-rsya-crop', crop + 'px');
    Array.prototype.forEach.call(lazyMap.children, function (child) {
      if (child.tagName === 'IFRAME') return;
      if (child.nodeType !== 1) return;
      child.style.setProperty('position', 'relative', 'important');
      child.style.setProperty('width', '100%', 'important');
      child.style.setProperty('height', '100%', 'important');
      child.style.setProperty('max-height', '100%', 'important');
      child.style.setProperty('overflow', 'hidden', 'important');
    });
    var iframe = lazyMap.querySelector('iframe');
    if (iframe) {
      // Relative — absolute blanks Yandex WebGL tiles in Chromium.
      iframe.style.setProperty('position', 'relative', 'important');
      iframe.style.setProperty('top', 'auto', 'important');
      iframe.style.setProperty('left', 'auto', 'important');
      iframe.style.setProperty('width', '100%', 'important');
      iframe.style.setProperty('height', 'calc(100% + ' + crop + 'px)', 'important');
      iframe.style.setProperty('min-height', 'calc(100% + ' + crop + 'px)', 'important');
      iframe.style.setProperty('max-height', 'none', 'important');
      iframe.removeAttribute('height');
    }
  }

  function injectMap(lazyMap) {
    if (!lazyMap || lazyMap.dataset.mapLoaded === '1') return;
    var html = lazyMap.getAttribute('data-postMap');
    if (!html || !html.trim()) return;
    lazyMap.dataset.mapLoaded = '1';
    lazyMap.innerHTML = html;
    lazyMap.style.display = 'block';
    lazyMap.style.overflow = 'hidden';
    lazyMap.style.position = 'relative';
    applyCrop(lazyMap);
    setTimeout(function () { applyCrop(lazyMap); }, 500);
    setTimeout(function () { applyCrop(lazyMap); }, 1500);
  }

  function bind() {
    var lazyMap = document.querySelector('#map.map-frame, .map-frame#map, .map-frame[data-postMap], .map[data-postMap]');
    if (!lazyMap) return;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          injectMap(lazyMap);
          obs.disconnect();
        });
      }, { rootMargin: '300px 0px' });
      io.observe(lazyMap);
    }

    // Fallback for old browsers / missed IO
    function onMapScroll() {
      if (window.scrollY > 300) {
        window.removeEventListener('scroll', onMapScroll);
        setTimeout(function () { injectMap(lazyMap); }, 200);
      }
    }
    window.addEventListener('scroll', onMapScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
