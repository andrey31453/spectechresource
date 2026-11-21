/**
 * Fill #modal-form product preview from the clicked catalog card «Заказать».
 * Prefers data-* on the trigger; falls back to .product-card-wrapper DOM.
 * Generic CTAs (header/footer) clear the preview.
 */
(function () {
  'use strict';

  var SELECTOR_TRIGGER = '[data-src="#modal-form"], [href="#modal-form"]';
  var SELECTOR_CARD = '.product-card-wrapper';

  function modalRoot() {
    return document.getElementById('modal-form');
  }

  function previewEl(root) {
    return root && root.querySelector('[data-sp-modal-product]');
  }

  function normalizePrice(raw) {
    if (!raw) return '';
    var t = String(raw).replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (!/^от\s/i.test(t) && /\d/.test(t)) t = 'от ' + t;
    return t;
  }

  function readFromTrigger(trigger) {
    if (!trigger || !trigger.getAttribute) return null;
    var img = trigger.getAttribute('data-product-image') || '';
    var title = trigger.getAttribute('data-product-title') || '';
    var shift = trigger.getAttribute('data-price-shift') || '';
    var hour = trigger.getAttribute('data-price-hour') || '';
    if (img || title || shift || hour) {
      return {
        image: img,
        title: title,
        shift: normalizePrice(shift),
        hour: normalizePrice(hour),
        alt: title || 'Техника'
      };
    }
    return null;
  }

  function readFromCard(card) {
    if (!card) return null;
    var imgEl =
      card.querySelector('a[tabindex="-1"] img') ||
      card.querySelector('.product-card-wrapper > a img') ||
      card.querySelector('img');
    var titleEl =
      card.querySelector('.product-card-wrapper-info-catalog-title span') ||
      card.querySelector('[itemprop="name"]') ||
      card.querySelector('.product-card-wrapper-info-catalog-title');
    var priceEls = card.querySelectorAll('.prices .price-for');
    var shiftRaw = priceEls[0] ? priceEls[0].textContent : '';
    var hourRaw = priceEls[1] ? priceEls[1].textContent : '';
    var image = imgEl ? (imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src') || '') : '';
    var title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var shift = normalizePrice(shiftRaw);
    var hour = normalizePrice(hourRaw);
    if (!image && !title && !shift && !hour) return null;
    return {
      image: image,
      title: title,
      shift: shift,
      hour: hour,
      alt: (imgEl && imgEl.getAttribute('alt')) || title || 'Техника'
    };
  }

  function clearPreview() {
    var root = modalRoot();
    var box = previewEl(root);
    if (!box) return;
    box.hidden = true;
    box.classList.remove('is-visible');
    var img = box.querySelector('[data-sp-modal-product-img]');
    var title = box.querySelector('[data-sp-modal-product-title]');
    var shift = box.querySelector('[data-sp-modal-product-shift]');
    var hour = box.querySelector('[data-sp-modal-product-hour]');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }
    if (title) title.textContent = '';
    if (shift) shift.textContent = '';
    if (hour) hour.textContent = '';
  }

  function fillPreview(data) {
    var root = modalRoot();
    var box = previewEl(root);
    if (!box) return;
    if (!data || (!data.image && !data.title && !data.shift && !data.hour)) {
      clearPreview();
      return;
    }
    var img = box.querySelector('[data-sp-modal-product-img]');
    var title = box.querySelector('[data-sp-modal-product-title]');
    var shift = box.querySelector('[data-sp-modal-product-shift]');
    var hour = box.querySelector('[data-sp-modal-product-hour]');
    if (img) {
      if (data.image) {
        img.src = data.image;
        img.alt = data.alt || data.title || 'Техника';
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.alt = '';
        img.hidden = true;
      }
    }
    if (title) title.textContent = data.title || '';
    if (shift) shift.textContent = data.shift || '';
    if (hour) hour.textContent = data.hour || '';
    box.hidden = false;
    box.classList.add('is-visible');
  }

  function syncFromTrigger(trigger) {
    if (!trigger) {
      clearPreview();
      return;
    }
    var data = readFromTrigger(trigger);
    if (!data) {
      var card = trigger.closest(SELECTOR_CARD);
      data = readFromCard(card);
    }
    fillPreview(data);
  }

  document.addEventListener(
    'click',
    function (e) {
      var trigger = e.target.closest && e.target.closest(SELECTOR_TRIGGER);
      if (!trigger) return;
      syncFromTrigger(trigger);
    },
    true
  );

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var trigger = e.target.closest && e.target.closest(SELECTOR_TRIGGER);
    if (!trigger) return;
    syncFromTrigger(trigger);
  }, true);

  function onFancyboxClose() {
    clearPreview();
  }

  function bindFancyboxClose() {
    if (typeof Fancybox === 'undefined' || !Fancybox.on) return;
    Fancybox.on('destroy', onFancyboxClose);
    Fancybox.on('close', onFancyboxClose);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindFancyboxClose);
  } else {
    bindFancyboxClose();
  }
})();
