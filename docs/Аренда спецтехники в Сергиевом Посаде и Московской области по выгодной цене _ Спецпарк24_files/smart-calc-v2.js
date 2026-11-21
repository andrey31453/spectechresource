(function () {
  'use strict';

  var calcSection = document.getElementById('spSmartCalc');
  if (!calcSection) return;

  var IMG = '/template/images-structurical/tech/';

  var CATALOG_DB = {
    'Автокран': {
      paramTitle: 'Грузоподъёмность и вылет стрелы:',
      url: '/catalog/arenda-avtokrana/',
      variants: [
        {
          label: 'До 25 тонн (стрела 21–28 м)',
          model: 'Автокран ИВАНОВЕЦ / Галичанин 25 т',
          specs: 'Стрела до 28 м • Груз до 25 т • Хит для 80% строек',
          hour: 2720,
          shift: 21760,
          img: IMG + '3-1564_avtokrany.webp'
        },
        {
          label: '50 тонн (стрела 40 м)',
          model: 'Автокран Галичанин КС-65713-1 (50 т)',
          specs: 'Стрела ~40 м + гусёк • Тяжёлый монтаж и ППР',
          hour: 5950,
          shift: 47510,
          img: IMG + '3-1564_avtokrany.webp'
        },
        {
          label: '90–100 тонн (Liebherr)',
          model: 'Автокран Liebherr LTM 1090 (90 т)',
          specs: 'Стрела до 50 м • Немецкий спецкран высокой точности',
          hour: 8330,
          shift: 65870,
          img: IMG + '3-1564_avtokrany.webp'
        }
      ]
    },
    'Автовышка': {
      paramTitle: 'Рабочая высота подъёма:',
      url: '/catalog/arenda-avtovyshki/',
      variants: [
        {
          label: 'До 18 метров',
          model: 'Автовышка Palfinger / Mitsubishi 18 м',
          specs: 'Корзина 200–250 кг • Фасады, реклама, освещение',
          hour: 1780,
          shift: 14240,
          img: IMG + '2-1563_avtovyshki.webp'
        },
        {
          label: '22–28 метров',
          model: 'Автовышка АГП 22–28 м',
          specs: 'Городские и промышленные работы на высоте',
          hour: 2460,
          shift: 19680,
          img: IMG + '2-1563_avtovyshki.webp'
        },
        {
          label: '45+ метров',
          model: 'Автовышка АГП 45 м',
          specs: 'Высотные объекты, ЛЭП, сложный доступ',
          hour: 4250,
          shift: 34000,
          img: IMG + '2-1563_avtovyshki.webp'
        }
      ]
    },
    'Экскаватор-погрузчик': {
      paramTitle: 'Класс и оснащение:',
      url: '/catalog/arenda-ekskavatora-pogruzchika',
      variants: [
        {
          label: 'Стандарт (JCB / CAT)',
          model: 'Экскаватор-погрузчик JCB 3CX / CAT',
          specs: 'Ковш + вилы • Универсал для земляных работ',
          hour: 2930,
          shift: 23440,
          img: IMG + '4-1634_ekskavator-pogruzchik-.webp'
        },
        {
          label: 'С гидромолотом',
          model: 'Экскаватор-погрузчик с гидромолотом',
          specs: 'Демонтаж бетона, асфальта, мёрзлый грунт',
          hour: 3400,
          shift: 27200,
          img: IMG + '4-1634_ekskavator-pogruzchik-.webp'
        },
        {
          label: 'С ямобуром',
          model: 'Экскаватор-погрузчик с ямобуром',
          specs: 'Столбы, фундаменты, ограждения',
          hour: 3550,
          shift: 28400,
          img: IMG + '4-1634_ekskavator-pogruzchik-.webp'
        }
      ]
    },
    'Манипулятор': {
      paramTitle: 'Грузоподъёмность КМУ:',
      url: '/catalog/manipulyatory-v-arendu/',
      variants: [
        {
          label: 'До 5 тонн',
          model: 'Манипулятор 5 т (КАМАЗ / Isuzu)',
          specs: 'Погрузка паллет, блоки, мелкий монтаж',
          hour: 2460,
          shift: 19680,
          img: IMG + '1-1562_manipulyatory.webp'
        },
        {
          label: '7–10 тонн',
          model: 'Манипулятор Soosan / Kanglim 7–10 т',
          specs: 'ЖБИ, металлоконструкции, стройматериалы',
          hour: 3140,
          shift: 25120,
          img: IMG + '1-1562_manipulyatory.webp'
        },
        {
          label: 'Вездеход',
          model: 'Манипулятор-вездеход',
          specs: 'Бездорожье, стройплощадки без твёрдого покрытия',
          hour: 3820,
          shift: 30560,
          img: IMG + '1-1562_manipulyatory.webp'
        }
      ]
    },
    'Экскаватор': {
      paramTitle: 'Тип и объём ковша:',
      url: '/catalog/arenda-ekskavatora-kolesnogo',
      variants: [
        {
          label: 'Колёсный ~1 м³',
          model: 'Экскаватор колёсный (ковш ~1 м³)',
          specs: 'Город, траншеи, планировка • Быстрая перебазировка',
          hour: 3140,
          shift: 25120,
          img: IMG + '6-1635_ekskavator-kolesnyy.webp'
        },
        {
          label: 'Гусеничный средний',
          model: 'Экскаватор гусеничный средний класс',
          specs: 'Котлованы, откосы, стабильная работа на грунте',
          hour: 2930,
          shift: 23440,
          img: IMG + '7-1638_ekskavator-gusenichnyy-.webp'
        },
        {
          label: 'Тяжёлый / болотник',
          model: 'Экскаватор гусеничный тяжёлый',
          specs: 'Большие объёмы, слабые грунты, карьеры',
          hour: 4250,
          shift: 34000,
          img: IMG + '7-1638_ekskavator-gusenichnyy-.webp'
        }
      ]
    },
    'Фронтальный погрузчик': {
      paramTitle: 'Объём ковша:',
      url: '/catalog/arenda-frontalnogo-pogruzchika/',
      variants: [
        {
          label: 'Ковш ~2 м³',
          model: 'Фронтальный погрузчик SDLG / XCMG 2 м³',
          specs: 'Песок, щебень, сыпучие на площадке',
          hour: 2930,
          shift: 23440,
          img: IMG + '5-1637_frontalnyy-pogruzchik.webp'
        },
        {
          label: 'Ковш ~3 м³',
          model: 'Фронтальный погрузчик 3 м³',
          specs: 'Интенсивная погрузка самосвалов',
          hour: 3550,
          shift: 28400,
          img: IMG + '5-1637_frontalnyy-pogruzchik.webp'
        },
        {
          label: 'Тяжёлый класс',
          model: 'Фронтальный погрузчик тяжёлый',
          specs: 'Скальный грунт, большие объёмы',
          hour: 4680,
          shift: 37440,
          img: IMG + '5-1637_frontalnyy-pogruzchik.webp'
        }
      ]
    },
    'Самосвал': {
      paramTitle: 'Объём кузова:',
      url: '/catalog/samosvaly',
      variants: [
        {
          label: '10 м³',
          model: 'Самосвал 10 м³',
          specs: 'Городские перевозки грунта и сыпучих',
          hour: 2210,
          shift: 17680,
          img: IMG + '9-1909_samosvaly.png'
        },
        {
          label: '20 м³ КАМАЗ',
          model: 'Самосвал КАМАЗ 20 м³',
          specs: 'Стройплощадки, карьеры, вывоз грунта',
          hour: 2720,
          shift: 21760,
          img: IMG + '9-1909_samosvaly.png'
        },
        {
          label: 'Вездеход',
          model: 'Самосвал-вездеход',
          specs: 'Слабые грунты и бездорожье',
          hour: 3400,
          shift: 27200,
          img: IMG + '9-1909_samosvaly.png'
        }
      ]
    },
    'Автотрал': {
      paramTitle: 'Грузоподъёмность трала:',
      url: '/catalog/avtotral-v-arendu',
      variants: [
        {
          label: 'До 40 тонн',
          model: 'Низкорамный трал до 40 т',
          specs: 'Перевозка спецтехники и негабарита',
          hour: 4080,
          shift: 32640,
          img: IMG + '8-1639_avtotral.webp'
        },
        {
          label: 'До 60 тонн',
          model: 'Низкорамный трал до 60 т',
          specs: 'Тяжёлая техника, длинномер',
          hour: 5100,
          shift: 40800,
          img: IMG + '8-1639_avtotral.webp'
        },
        {
          label: 'Тяжёлый негабарит',
          model: 'Трал для тяжёлого негабарита',
          specs: 'Сопровождение, сложные маршруты',
          hour: 6800,
          shift: 54400,
          img: IMG + '8-1639_avtotral.webp'
        }
      ]
    }
  };

  function loadCatalogFromMigx() {
    var el = document.getElementById('spSmartCalcData');
    if (!el) return null;
    try {
      var raw = (el.textContent || '').trim();
      if (!raw || raw.charAt(0) !== '{') return null;
      var data = JSON.parse(raw);
      if (!data || !data.catalog || typeof data.catalog !== 'object') return null;
      var keys = Object.keys(data.catalog);
      if (!keys.length) return null;
      return data.catalog;
    } catch (err) {
      return null;
    }
  }

  var migxCatalog = loadCatalogFromMigx();
  if (migxCatalog) {
    CATALOG_DB = migxCatalog;
  }

  var firstCat = Object.keys(CATALOG_DB)[0] || 'Автокран';

  var state = {
    cat: firstCat,
    variantIndex: 0,
    shifts: 1,
    discount: 0,
    zone: ''
  };

  var els = {
    root: calcSection.querySelector('.sp-smart-calc') || calcSection,
    categories: calcSection.querySelector('[data-calc-categories]'),
    paramTitle: calcSection.querySelector('[data-calc-param-title]'),
    variants: calcSection.querySelector('[data-calc-variants]'),
    zones: calcSection.querySelector('[data-calc-zones]'),
    shiftsLabel: calcSection.querySelector('[data-calc-shifts-label]'),
    matchCard: calcSection.querySelector('[data-calc-match-card]'),
    matchImg: calcSection.querySelector('[data-calc-match-img]'),
    matchImgLink: calcSection.querySelector('[data-calc-match-img-link]'),
    matchModel: calcSection.querySelector('[data-calc-match-model]'),
    matchModelLink: calcSection.querySelector('[data-calc-match-model-link]'),
    matchSpecs: calcSection.querySelector('[data-calc-match-specs]'),
    matchLink: calcSection.querySelector('[data-calc-match-link]'),
    matchTag: calcSection.querySelector('[data-calc-match-tag]'),
    priceHour: calcSection.querySelector('[data-calc-price-hour]'),
    priceShift: calcSection.querySelector('[data-calc-price-shift]'),
    discountBadge: calcSection.querySelector('[data-calc-discount-badge]'),
    hiddenInput: calcSection.querySelector('[data-calc-hidden-input]'),
    seoNote: calcSection.querySelector('[data-calc-seo-note]')
  };

  function renderCategories() {
    if (!els.categories) return;
    var html = '';
    Object.keys(CATALOG_DB).forEach(function (key, i) {
      var chip = (CATALOG_DB[key] && CATALOG_DB[key].chip) || key;
      html +=
        '<button type="button" class="sp-calc-chip' +
        (key === state.cat ? ' is-active' : '') +
        '" data-calc-cat="' +
        key.replace(/"/g, '&quot;') +
        '">' +
        chip +
        '</button>';
    });
    els.categories.innerHTML = html;
  }

  function formatMoney(n) {
    var v = Math.round(Number(n) || 0);
    return 'от ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function getCity() {
    var fromZones = els.zones && els.zones.getAttribute('data-city');
    var fcity = calcSection.querySelector('#fcity, input[name="fcity"]');
    var city = (fromZones || (fcity && fcity.value) || '').trim();
    if (!city) {
      var host = (location.hostname || '').toLowerCase();
      if (host.indexOf('ekb') >= 0 || host.indexOf('ekaterin') >= 0) city = 'Екатеринбург';
      else if (host.indexOf('spb') >= 0 || host.indexOf('peter') >= 0) city = 'Санкт-Петербург';
      else city = 'Москва';
    }
    return city;
  }

  function isMoscow(city) {
    var c = String(city || '').toLowerCase();
    return c.indexOf('москв') >= 0 || c === 'msk' || c === 'moscow';
  }

  function setupZones() {
    if (!els.zones) return;
    var city = getCity();
    var msk = isMoscow(city);
    var buttons = els.zones.querySelectorAll('.sp-calc-zone-btn');
    if (buttons.length < 2) return;

    if (msk) {
      buttons[0].textContent = 'Москва (пропуск включён)';
      buttons[0].setAttribute('data-zone', 'Москва (внутри МКАД / ТТК)');
      buttons[1].textContent = 'Московская обл.';
      buttons[1].setAttribute('data-zone', 'Московская область');
      if (els.seoNote) {
        els.seoNote.textContent =
          'В стоимость смены (8 часов: 7 часов работы + 1 час подачи) уже включены: ГСМ, работа аттестованного машиниста РФ и пропуск в Москву (МКАД, ТТК, СК). Работаем с НДС и ЭДО.';
      }
    } else {
      buttons[0].textContent = city + ' (в черте города)';
      buttons[0].setAttribute('data-zone', city + ' (в черте города)');
      buttons[1].textContent = 'Область / выезд';
      buttons[1].setAttribute('data-zone', city + ' — область / выезд');
      if (els.seoNote) {
        els.seoNote.textContent =
          'В стоимость смены (8 часов: 7 часов работы + 1 час подачи) уже включены: ГСМ и работа аттестованного машиниста РФ. Работаем с НДС и ЭДО.';
      }
    }

    var active = els.zones.querySelector('.sp-calc-zone-btn.is-active') || buttons[0];
    state.zone = active.getAttribute('data-zone') || '';
  }

  function getCat() {
    return CATALOG_DB[state.cat] || CATALOG_DB['Автокран'];
  }

  function getVariant() {
    var cat = getCat();
    var list = cat.variants || [];
    var idx = Math.max(0, Math.min(state.variantIndex, list.length - 1));
    return list[idx] || list[0];
  }

  function renderVariants() {
    if (!els.variants) return;
    var cat = getCat();
    if (els.paramTitle) els.paramTitle.textContent = cat.paramTitle;
    var html = '';
    (cat.variants || []).forEach(function (v, i) {
      html +=
        '<button type="button" class="sp-calc-variant' +
        (i === state.variantIndex ? ' is-active' : '') +
        '" data-variant-index="' +
        i +
        '">' +
        v.label +
        '</button>';
    });
    els.variants.innerHTML = html;
  }

  function updateMatchCard() {
    var cat = getCat();
    var v = getVariant();
    if (!v) return;

    var hour = v.hour * (1 - state.discount / 100);
    var shift = v.shift * (1 - state.discount / 100);

    if (els.matchCard) {
      els.matchCard.classList.add('is-updating');
      window.setTimeout(function () {
        els.matchCard.classList.remove('is-updating');
      }, 180);
    }

    var productUrl = (v.url || v.product_url || '').trim() || cat.url || '/catalog/';
    if (els.matchImg) {
      els.matchImg.src = v.img || '';
      els.matchImg.alt = v.model || '';
    }
    if (els.matchImgLink) els.matchImgLink.href = productUrl;
    if (els.matchModel) els.matchModel.textContent = v.model;
    if (els.matchModelLink) els.matchModelLink.href = productUrl;
    if (els.matchSpecs) els.matchSpecs.textContent = v.specs;
    if (els.matchLink) {
      els.matchLink.href = productUrl;
      els.matchLink.textContent = (v.url || v.product_url)
        ? 'Открыть карточку техники →'
        : 'Посмотреть все в категории →';
    }
    if (els.matchTag) {
      els.matchTag.textContent = state.discount > 0 ? 'Выгодный срок' : 'Оптимальный выбор';
    }
    if (els.priceHour) els.priceHour.textContent = formatMoney(hour);
    if (els.priceShift) els.priceShift.textContent = formatMoney(shift);
    if (els.discountBadge) {
      if (state.discount > 0) {
        els.discountBadge.hidden = false;
        els.discountBadge.textContent = '-' + state.discount + '%';
      } else {
        els.discountBadge.hidden = true;
      }
    }

    var shiftLabel = state.shifts === 1 ? '1 смена' : state.shifts + ' смен';
    if (els.shiftsLabel) {
      els.shiftsLabel.textContent =
        state.shifts === 1 ? '1 смена (7+1 ч)' : shiftLabel + ' (−' + state.discount + '%)';
    }

    if (els.hiddenInput) {
      els.hiddenInput.value = [state.cat, v.label, shiftLabel, state.zone].join(' | ');
    }
  }

  function setActive(group, el) {
    if (!group || !el) return;
    group.querySelectorAll('.is-active').forEach(function (n) {
      n.classList.remove('is-active');
    });
    el.classList.add('is-active');
  }

  function onCategoryClick(btn) {
    var cat = btn.getAttribute('data-calc-cat');
    if (!cat || !CATALOG_DB[cat]) return;
    state.cat = cat;
    state.variantIndex = 0;
    setActive(calcSection.querySelector('[data-calc-categories]'), btn);
    renderVariants();
    updateMatchCard();
  }

  function bind() {
    var cats = calcSection.querySelector('[data-calc-categories]');
    if (cats) {
      cats.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-calc-cat]');
        if (!btn || !cats.contains(btn)) return;
        onCategoryClick(btn);
      });
    }

    if (els.variants) {
      els.variants.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-variant-index]');
        if (!btn || !els.variants.contains(btn)) return;
        state.variantIndex = parseInt(btn.getAttribute('data-variant-index'), 10) || 0;
        setActive(els.variants, btn);
        updateMatchCard();
      });
    }

    var durs = calcSection.querySelector('[data-calc-durations]');
    if (durs) {
      durs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-shifts]');
        if (!btn || !durs.contains(btn)) return;
        state.shifts = parseInt(btn.getAttribute('data-shifts'), 10) || 1;
        state.discount = parseInt(btn.getAttribute('data-discount'), 10) || 0;
        setActive(durs, btn);
        updateMatchCard();
      });
    }

    if (els.zones) {
      els.zones.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-zone]');
        if (!btn || !els.zones.contains(btn)) return;
        state.zone = btn.getAttribute('data-zone') || '';
        setActive(els.zones, btn);
        updateMatchCard();
      });
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-scroll-to-calc]');
      if (!trigger) return;
      var sel = trigger.getAttribute('data-scroll-to-calc') || '#spSmartCalc';
      var target = document.querySelector(sel);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var box = target.querySelector('.sp-smart-calc') || target;
      box.classList.add('is-highlighted');
      window.setTimeout(function () {
        box.classList.remove('is-highlighted');
      }, 1600);
      var firstChip = target.querySelector('[data-calc-categories] .sp-calc-chip');
      if (firstChip) {
        firstChip.focus({ preventScroll: true });
      }
    });
  }

  function ensurePhoneMask() {
    var phone = calcSection.querySelector('input.telephone, #fphone');
    if (!phone || typeof IMask === 'undefined') return;
    if (phone.dataset.imaskReady === '1' || phone._spPhoneMask) return;
    try {
      phone._spPhoneMask = IMask(phone, {
        mask: '+{7} (000) 000-00-00',
        lazy: false,
        placeholderChar: '_'
      });
      phone.dataset.imaskReady = '1';
    } catch (err) {}
  }

  setupZones();
  bind();
  renderCategories();
  renderVariants();
  updateMatchCard();
  ensurePhoneMask();
})();
