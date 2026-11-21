(function () {
  const section = document.getElementById('spCatalogSection');
  if (!section) return;

  const tabs = section.querySelectorAll('[data-cat-filter]');
  const cards = section.querySelectorAll('[data-cat-group]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-cat-filter');

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      cards.forEach((card) => {
        const group = card.getAttribute('data-cat-group');
        const show = filter === 'all' || group === filter;
        card.hidden = !show;
      });
    });
  });
})();
