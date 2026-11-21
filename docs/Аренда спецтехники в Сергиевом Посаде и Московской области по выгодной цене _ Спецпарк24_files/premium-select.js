/**
 * Specpark premium select — custom listbox synced to native <select> (FetchIt-safe).
 * Inits: [data-sp-premium-select], [data-sp-hero-select], select.sp-premium-select,
 *        select.contacts-select, legacy .form__input-dropdown.
 */
(function () {
  'use strict';

  var UID = 0;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function nextId(prefix) {
    UID += 1;
    return prefix + '-' + UID;
  }

  function closeRoot(root, trigger, list) {
    root.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (list) list.hidden = true;
  }

  function openRoot(root, trigger, list) {
    root.classList.add('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (list) list.hidden = false;
    var selected = qs('.sp-premium-select__option.is-selected, .sp-hero-select__option.is-selected', list);
    if (selected) {
      selected.focus();
      return;
    }
    var first = qs('.sp-premium-select__option, .sp-hero-select__option', list);
    if (first) first.focus();
  }

  function optionBtnClass(prefix, selected) {
    return prefix + '__option' + (selected ? ' is-selected' : '');
  }

  function initFromMarkup(root) {
    if (!root || root.getAttribute('data-sp-premium-inited') === '1') return;
    root.setAttribute('data-sp-premium-inited', '1');

    var prefix = root.classList.contains('sp-hero-select') ? 'sp-hero-select' : 'sp-premium-select';
    var native = qs('select.' + prefix + '__native, select[name], select', root);
    var trigger = qs('.' + prefix + '__trigger', root);
    var valueEl = qs('.' + prefix + '__value', root);
    var list = qs('.' + prefix + '__list', root);
    if (!native || !trigger || !valueEl || !list) return;

    var initial = (root.getAttribute('data-initial') || '').trim();
    if (initial) {
      native.value = initial;
    }

    var options = Array.prototype.slice.call(native.options);
    var listId = list.id || nextId('sp-ps-list');
    list.id = listId;
    if (!trigger.id) trigger.id = nextId('sp-ps-btn');
    trigger.setAttribute('aria-controls', listId);
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    list.setAttribute('role', 'listbox');

    function close() {
      closeRoot(root, trigger, list);
    }

    function open() {
      openRoot(root, trigger, list);
    }

    function setValue(value, label, isPlaceholder) {
      native.value = value;
      valueEl.textContent = label;
      valueEl.classList.toggle('is-placeholder', !!isPlaceholder);
      qsa('.' + prefix + '__option', list).forEach(function (btn) {
        var on = btn.getAttribute('data-value') === value;
        btn.classList.toggle('is-selected', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      try {
        native.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {
        /* noop */
      }
    }

    list.innerHTML = '';
    options.forEach(function (opt, idx) {
      var selected = initial ? opt.value === initial : opt.selected;
      var li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = optionBtnClass(prefix, selected);
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-value', opt.value);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.id = listId + '-opt-' + idx;
      btn.textContent = opt.textContent;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setValue(opt.value, opt.textContent, !opt.value);
        close();
        trigger.focus();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    if (native.selectedIndex >= 0) {
      var cur = options[native.selectedIndex];
      valueEl.textContent = cur.textContent;
      valueEl.classList.toggle('is-placeholder', !cur.value);
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (root.classList.contains('is-open')) close();
      else open();
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!root.classList.contains('is-open')) open();
      }
    });

    list.addEventListener('keydown', function (e) {
      var items = qsa('.' + prefix + '__option', list);
      var i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        trigger.focus();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (i < items.length - 1) items[i + 1].focus();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i > 0) items[i - 1].focus();
        else {
          close();
          trigger.focus();
        }
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        if (items[0]) items[0].focus();
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        if (items.length) items[items.length - 1].focus();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (document.activeElement && document.activeElement.getAttribute('role') === 'option') {
          document.activeElement.click();
        }
      }
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) {
        close();
        trigger.focus();
      }
    });
  }

  function buildMarkupAroundSelect(native, opts) {
    opts = opts || {};
    if (!native || native.closest('.sp-premium-select, .sp-hero-select')) {
      var existing = native.closest('.sp-premium-select, .sp-hero-select');
      if (existing) initFromMarkup(existing);
      return;
    }

    var root = document.createElement('div');
    root.className = 'sp-premium-select';
    root.setAttribute('data-sp-premium-select', '');

    var labelId = opts.labelId || '';
    var listId = nextId('sp-ps-list');
    var btnId = nextId('sp-ps-btn');

    native.classList.add('sp-premium-select__native');
    native.setAttribute('tabindex', '-1');
    native.setAttribute('aria-hidden', 'true');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'sp-premium-select__trigger';
    trigger.id = btnId;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listId);
    if (labelId) trigger.setAttribute('aria-labelledby', labelId + ' ' + btnId);

    var valueEl = document.createElement('span');
    valueEl.className = 'sp-premium-select__value';
    var chevron = document.createElement('span');
    chevron.className = 'sp-premium-select__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    var list = document.createElement('ul');
    list.className = 'sp-premium-select__list';
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    if (labelId) list.setAttribute('aria-labelledby', labelId);

    var parent = native.parentNode;
    parent.insertBefore(root, native);
    root.appendChild(native);
    root.appendChild(trigger);
    root.appendChild(list);

    initFromMarkup(root);
  }

  function migrateLegacyDropdown(wrap) {
    if (!wrap || wrap.getAttribute('data-sp-premium-inited') === '1') return;
    if (wrap.querySelector('.sp-premium-select, .sp-hero-select')) return;

    var input = wrap.querySelector('input[name]');
    var items = qsa('.form__input-dropdown-items li', wrap);
    if (!input || !items.length) return;

    var name = input.getAttribute('name') || 'typeoftech';
    var id = input.id || nextId('sp-ps-field');
    var label = wrap.querySelector('label');
    var labelId = label && label.id ? label.id : '';
    if (label && !labelId) {
      labelId = id + '-label';
      label.id = labelId;
      label.setAttribute('for', id);
    }

    var select = document.createElement('select');
    select.name = name;
    select.id = id;
    select.className = 'sp-premium-select__native';
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    var placeholder = input.getAttribute('placeholder') || 'Выберите';
    var current = (input.value || '').trim();

    var empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    if (!current) empty.selected = true;
    select.appendChild(empty);

    items.forEach(function (li) {
      var text = (li.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      var opt = document.createElement('option');
      opt.value = text;
      opt.textContent = text;
      if (current && current === text) opt.selected = true;
      select.appendChild(opt);
    });

    var root = document.createElement('div');
    root.className = 'sp-premium-select';
    root.setAttribute('data-sp-premium-select', '');

    var listId = nextId('sp-ps-list');
    var btnId = nextId('sp-ps-btn');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'sp-premium-select__trigger';
    trigger.id = btnId;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listId);
    if (labelId) trigger.setAttribute('aria-labelledby', labelId + ' ' + btnId);

    var valueEl = document.createElement('span');
    valueEl.className = 'sp-premium-select__value';
    var chevron = document.createElement('span');
    chevron.className = 'sp-premium-select__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    var list = document.createElement('ul');
    list.className = 'sp-premium-select__list';
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    if (labelId) list.setAttribute('aria-labelledby', labelId);

    var scrollbar = wrap.querySelector('.scrollbar-list');
    var err = wrap.querySelector('[data-error]');

    if (input.parentNode === wrap) {
      wrap.insertBefore(root, input);
    } else {
      wrap.insertBefore(root, wrap.firstChild && label ? label.nextSibling : wrap.firstChild);
    }
    root.appendChild(select);
    root.appendChild(trigger);
    root.appendChild(list);

    input.remove();
    if (scrollbar) scrollbar.remove();
    else {
      var oldUl = wrap.querySelector('.form__input-dropdown-items');
      if (oldUl) oldUl.remove();
    }

    wrap.classList.remove('form__input-dropdown');
    if (err && err.parentNode !== wrap) {
      /* keep */
    }

    initFromMarkup(root);
  }

  function boot() {
    qsa('[data-sp-premium-select], [data-sp-hero-select]').forEach(initFromMarkup);

    qsa('select.sp-premium-select, select.contacts-select, select[data-sp-premium-select]').forEach(function (sel) {
      if (sel.classList.contains('sp-premium-select__native') || sel.classList.contains('sp-hero-select__native')) {
        return;
      }
      var label = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
      buildMarkupAroundSelect(sel, { labelId: label && label.id ? label.id : '' });
    });

    qsa('.form__input-dropdown').forEach(migrateLegacyDropdown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.SpPremiumSelect = { init: boot, initRoot: initFromMarkup };
})();
