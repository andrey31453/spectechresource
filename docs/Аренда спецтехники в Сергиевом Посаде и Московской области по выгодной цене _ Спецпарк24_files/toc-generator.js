document.addEventListener('DOMContentLoaded', function () {
  const content = document.getElementById('article-content');
  const toc = document.getElementById('toc');
  if (!content || !toc) return;

  const headings = content.querySelectorAll('h2, h3');
  if (!headings.length) return;

  let tocHTML = '<div class="toc-title">Содержание<span class="toc-arrow">▼</span></div><ul>';
  let h2Counter = 1;

  headings.forEach((heading) => {
    const text = heading.textContent.trim();
    if (!text) return;

    // Генерация ID
    let slug = text
      .toLowerCase()
      .replace(/[\s\–—]+/g, '-')
      .replace(/[^a-zа-яё0-9\-]/gi, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      slug = 'heading-' + Math.random().toString(36).substr(2, 5);
    }

    if (!heading.id) {
      heading.id = slug;
    }

    // Добавление цифры только к h2
    const displayText = heading.tagName.toLowerCase() === 'h2'
      ? `${h2Counter++}. ${text}`
      : text;

    tocHTML += `<li class="${heading.tagName.toLowerCase()}"><a href="#${heading.id}" data-toc-anchor>${displayText}</a></li>`;
  });

  tocHTML += '</ul>';
  toc.innerHTML = tocHTML;

  // Плавная прокрутка
  document.querySelectorAll('a[data-toc-anchor]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, '#' + targetId);
      }
    });
  });

  const tocWrapper = document.querySelector('.table-of-contents');
  const tocTitle = tocWrapper?.querySelector('.toc-title');

  if (tocWrapper && tocTitle) {
    tocTitle.addEventListener('click', () => {
      tocWrapper.classList.toggle('active');
    });
  }
});