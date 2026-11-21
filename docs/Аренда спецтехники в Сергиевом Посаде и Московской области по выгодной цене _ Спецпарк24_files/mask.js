(function () {
  if (typeof IMask === 'undefined') return;

  /**
   * RU mobile normalizer for IMask:
   * 8… → +7…, 7… → +7…, 9XXXXXXXXX → +7 9…, paste of digits/+7/8…
   * Mask already owns the fixed country digit via +{7}.
   */
  function prepareRuPhone(appended, masked) {
    var raw = String(appended == null ? '' : appended);
    var digits = raw.replace(/\D/g, '');

    // Paste / autofill of a full-ish number
    if (digits.length > 1) {
      if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
      if (digits.charAt(0) === '9' && digits.length === 10) digits = '7' + digits;
      if (digits.charAt(0) === '7') digits = digits.slice(1);
      return digits.slice(0, 10);
    }

    // First typed digit while field is empty: 8/7 = country code, skip into mask's +7
    var empty = !masked || !masked.unmaskedValue;
    if (empty) {
      if (raw === '8' || raw === '7' || raw === '+') return '';
      return raw;
    }

    return raw;
  }

  var maskOptions = {
    mask: '+{7} (000) 000-00-00',
    lazy: false,
    placeholderChar: '_',
    prepare: prepareRuPhone
  };

  function phoneInputs(scope) {
    var list = [];
    scope.querySelectorAll('input.telephone, #sp_quiz_phone, .sp-quiz-input[type="tel"]').forEach(function (el) {
      list.push(el);
    });
    return list;
  }

  function applyMasks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    phoneInputs(scope).forEach(function (el) {
      if (el.dataset.imaskReady === '1') return;
      var im = IMask(el, maskOptions);
      el.dataset.imaskReady = '1';
      el._spPhoneMask = im;
      if (!el.classList.contains('telephone')) el.classList.add('telephone');
      el.setAttribute('inputmode', 'tel');
      el.setAttribute('autocomplete', 'tel');
      if (!el.getAttribute('placeholder') || /номер телефона|999/i.test(el.getAttribute('placeholder'))) {
        el.setAttribute('placeholder', '+7 (___) ___-__-__');
      }
      if (!el.getAttribute('pattern')) {
        el.setAttribute('pattern', '^\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}$');
      }

      // Autofill / paste can bypass prepare — normalize after the fact
      el.addEventListener('blur', function () {
        var d = (el.value || '').replace(/\D/g, '');
        if (!d) return;
        if (d.charAt(0) === '8') d = '7' + d.slice(1);
        if (d.charAt(0) === '9' && d.length === 10) d = '7' + d;
        if (d.charAt(0) !== '7') d = '7' + d;
        d = d.slice(0, 11);
        if (im && typeof im.unmaskedValue !== 'undefined') {
          im.unmaskedValue = d.charAt(0) === '7' ? d.slice(1) : d;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyMasks(document); });
  } else {
    applyMasks(document);
  }

  window.spApplyPhoneMasks = applyMasks;
})();
