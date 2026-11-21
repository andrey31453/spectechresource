document.addEventListener('DOMContentLoaded', function () {
    const content = document.getElementById('article-content');
    const output = document.getElementById('read-time');
    if (!content || !output) return;
  
    const words = content.innerText.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 180); // средняя скорость чтения
    output.innerText = `⏱ ${minutes} мин.`;
  });
  