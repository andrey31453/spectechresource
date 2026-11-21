(function () {
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      this.classList.toggle('active');
      var nav = document.querySelector('nav');
      if (nav) nav.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    });
  }

  var menuLists = document.querySelectorAll('.item.has__children');
  if (window.innerWidth < 1280) {
    menuLists.forEach(function (item) {
      var basicLink = item.children[0];
      if (!basicLink) return;
      basicLink.addEventListener('click', function (e) {
        e.preventDefault();
        item.classList.toggle('active');
        item.classList.toggle('is-open', item.classList.contains('active'));
        if (basicLink.hasAttribute('aria-expanded')) {
          basicLink.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');
        }
      });
    });
  }

  // Legacy .cityname strip replaced by sp-city-modal.js (data-sp-city-open).
})();