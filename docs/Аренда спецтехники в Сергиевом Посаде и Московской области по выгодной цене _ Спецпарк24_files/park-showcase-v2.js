(function () {
  var showcase = document.getElementById('spParkShowcase');
  if (!showcase) return;

  var wrapper = showcase.querySelector('[data-park-wrapper]');
  var sliderEl = showcase.querySelector('.parkSlider');
  var tabs = showcase.querySelectorAll('[data-park-filter]');
  if (!wrapper || !sliderEl) return;

  function getHostSeed(hostname) {
    var hash = 2166136261;
    var host = String(hostname || '');
    for (var i = 0; i < host.length; i++) {
      hash ^= host.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }

  var hostSeed = getHostSeed(window.location.hostname || 'спецпарк24.рф');
  var allSlides = Array.prototype.slice.call(wrapper.querySelectorAll('.swiper-slide'));

  // Client-side deterministic reorder (server already CRC-sorts; this keeps uniqueness if cache shared)
  allSlides.sort(function (a, b) {
    var hitA = a.getAttribute('data-park-hit') === '1' ? 0 : 1;
    var hitB = b.getAttribute('data-park-hit') === '1' ? 0 : 1;
    if (hitA !== hitB) return hitA - hitB;

    var idA = a.getAttribute('data-park-id') || a.innerText;
    var idB = b.getAttribute('data-park-id') || b.innerText;
    var weightA = (getHostSeed(idA) + hostSeed) % 997;
    var weightB = (getHostSeed(idB) + hostSeed) % 997;
    return weightA - weightB;
  });
  allSlides.forEach(function (slide) {
    wrapper.appendChild(slide);
  });

  function refreshSwiper() {
    var sw = sliderEl.swiper;
    if (!sw) return;
    try {
      if (sw.params) sw.params.loop = false;
      if (typeof sw.loopDestroy === 'function') sw.loopDestroy();
      sw.update();
      sw.slideTo(0, 0);
    } catch (err) {}
  }

  function applyFilter(filterKey) {
    allSlides.forEach(function (slide) {
      var cat = slide.getAttribute('data-park-cat');
      var isHit = slide.getAttribute('data-park-hit') === '1';
      var show = true;
      if (filterKey === 'hits') show = isHit;
      else if (filterKey !== 'all') show = cat === filterKey;
      slide.style.display = show ? '' : 'none';
      slide.classList.toggle('swiper-slide-hidden', !show);
    });
    refreshSwiper();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var filterKey = tab.getAttribute('data-park-filter');
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      applyFilter(filterKey);
    });
  });

  function boot() {
    applyFilter('hits');
  }

  if (document.readyState === 'complete') {
    window.setTimeout(boot, 50);
  } else {
    window.addEventListener('load', function () {
      window.setTimeout(boot, 50);
    });
  }
})();
