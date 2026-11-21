(() => {
  'use strict';

  const root = 'xn--24-6kct0a1abje6c.xn--p1ai';
  const zone = '.' + root;
  const host = location.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  const script = document.currentScript;
  if (!script || window.sp24MessengerLinksReady ||
      (host !== root && !host.endsWith(zone))) return;

  const cityIds = {
    "": 74, "xn-----7kcgn5cdbagnnnx": 134, "xn----7sbb7afirdq1f": 95, "xn--80a0apj7a": 97,
    "xn--80a0biks": 123, "xn--80a1bd": 137, "xn--80a9aci": 116, "xn--80aa1ac9a": 313,
    "xn--80aa4alnee": 10, "xn--80aaa0a0avl": 449, "xn--80aaa0cvac": 96, "xn--80aaa4cl": 231,
    "xn--80aaa6cmfh0a9d": 36, "xn--80aaaa2chc7eta": 112, "xn--80aaab1bq6ewa": 58, "xn--80aaac0ct": 241,
    "xn--80aaadd3bkbewbe5be8a5o": 400, "xn--80aaafckyesce": 111, "xn--80aaah7b8am": 117, "xn--80aab6birx": 157,
    "xn--80aab8af5be": 128, "xn--80aabg3bexb": 152, "xn--80aabg7bt3e": 189, "xn--80aae4afdlib8ai": 185,
    "xn--80aaeboarvx4c": 85, "xn--80aafalwhgh4aediyf": 278, "xn--80aag0dcjp0f": 347, "xn--80aag1ciek": 44,
    "xn--80aagyrxe": 125, "xn--80aah0afdmhbsrj": 202, "xn--80aahvz2a9a": 318, "xn--80aai0ag2c": 69,
    "xn--80aai3amuh": 333, "xn--80aaib3cgnl": 122, "xn--80aaifraljtb8a": 37, "xn--80aajizflwo8a1f": 15,
    "xn--80aalwqglfe": 30, "xn--80aamc3a6ac9a": 234, "xn--80aanmmcj2ahke": 46, "xn--80aauks4g": 92,
    "xn--80aauwdq0g": 207, "xn--80ab2awgf": 344, "xn--80abi1b2a": 253, "xn--80ablvtof7b4b": 99,
    "xn--80abuahp6f": 250, "xn--80abyfap4al": 348, "xn--80acd2blu": 43, "xn--80acm0ccg": 211,
    "xn--80adbjeltrcnvok": 11, "xn--80adbv1agb": 50, "xn--80adc3adrbo": 568, "xn--80addag2buct": 146,
    "xn--80addcdua5attdt": 165, "xn--80adde7arb": 14, "xn--80adgc8c": 191, "xn--80adhqaok7a": 91,
    "xn--80adi0aoagldk8i": 53, "xn--80adio3aejo4j": 446, "xn--80adiweqejcms5i": 243, "xn--80adjubnhbtma0e": 156,
    "xn--80adtilddb4ah6a8a": 131, "xn--80adxb5abi4ec": 12, "xn--80adzdhgbqlq6h": 340, "xn--80ae1alafffj1i": 28,
    "xn--80ae9ahd": 375, "xn--80aebrsu": 317, "xn--80aegbbpxekdns0mei": 335, "xn--80aegbkvxddlre": 22,
    "xn--80aeia0ach7bg1hd": 101, "xn--80aeo2a": 155, "xn--80aeqfgedu2a8a": 158, "xn--80aesccdb4a2a8c": 494,
    "xn--80aezclli6gta": 164, "xn--80af2b1c": 199, "xn--80af3ac9eo": 139, "xn--80afebak3arjv": 64,
    "xn--80affadiwaewehb2acne": 300, "xn--80afugfi8g": 249, "xn--80afuomr": 4, "xn--80afwbmyk": 569,
    "xn--80afwlu8e": 88, "xn--80agatlhjjbulh": 24, "xn--80agpm5a": 25, "xn--80agtcngblfff": 63,
    "xn--80ai2adl": 68, "xn--80aimioqj4c": 141, "xn--80aitj1ad5e": 159, "xn--80aiyb6e": 252,
    "xn--80ajaublc1bet": 127, "xn--80ajchmbncc8b": 170, "xn--80ajgxi": 45, "xn--80ajpcdqnjgd6ib": 67,
    "xn--80ak3aicg": 143, "xn--80akatihikn": 71, "xn--80akncih2a": 26, "xn--80anmnpecg": 104,
    "xn--80antj7do": 49, "xn--80antkd4dl": 150, "xn--80ap4as": 228, "xn--80apgbbjjxg": 212,
    "xn--80apizf6d": 109, "xn--80aplwa": 102, "xn--80aqdbd1and": 360, "xn--80aqejg8dua": 149,
    "xn--80aqgci6d8a": 110, "xn--80aqggddeaqp2a": 220, "xn--80aqglu7a": 315, "xn--80aqjbmffz8f": 518,
    "xn--80asdfng": 163, "xn--80atblfjdfd2l": 126, "xn--80atdefdb": 66, "xn--80atghalgi": 51,
    "xn--80aueagpkl": 16, "xn--80avue": 48, "xn--80avv4c": 380, "xn--90a1af": 94,
    "xn--90abblsferjb2bt1eyb": 154, "xn--90abe7bk7d": 186, "xn--90absbknhbvge": 135, "xn--90aciiggf4aqn6o": 341,
    "xn--90aciypb": 254, "xn--90acyoijkz": 484, "xn--90adqhq6a": 377, "xn--90aedc4atap": 32,
    "xn--90aee6admdx": 33, "xn--90afdb4bpr": 121, "xn--90agcv2ah": 385, "xn--90ahbkbmcxgsedes2l": 224,
    "xn--90ahjbkbwtebe": 399, "xn--90ahkico2a6b9d": 38, "xn--90ahp": 41, "xn--90aiaifanwy": 251,
    "xn--90aiqw4a4aq": 60, "xn--90aodbbvqig6h4a": 105, "xn--90aode8a": 325, "xn--90aogkbcz": 236,
    "xn--90aoglmj0e": 98, "xn--90asckbtc8f": 82, "xn--90ashelg0fva": 118, "xn--90asilg6f": 40,
    "xn--90athc1g": 78, "xn--b1aafcbuoxfthj": 18, "xn--b1aaifueubwg": 319, "xn--b1aaimagfgwk": 23,
    "xn--b1aawqbl": 194, "xn--b1aaxbhehbbb5ad": 345, "xn--b1abahbrq1aso": 469, "xn--b1abfb0avok0h": 289,
    "xn--b1acd7afcap": 145, "xn--b1acdcii8akat": 219, "xn--b1acdycodcb5a": 124, "xn--b1adaae4bnbdb": 62,
    "xn--b1admplln": 86, "xn--b1admucdb5d": 65, "xn--b1aedk0ag": 79, "xn--b1aekhddvbxf": 120,
    "xn--b1af0abbi0b": 75, "xn--b1af1a1ai": 84, "xn--b1af1adeerq": 72, "xn--b1af1aglf": 59,
    "xn--b1af1ahd": 273, "xn--b1afab7bff7cb": 19, "xn--b1afaslnbn": 178, "xn--b1afbu3ace": 314,
    "xn--b1afc3b": 382, "xn--b1afchn5b": 130, "xn--b1afkijcdaj5aa2j": 132, "xn--b1afndcrecw": 226,
    "xn--b1afocqbedfq2j": 174, "xn--b1ag7af7c": 21, "xn--b1agajjeybkf6ei": 472, "xn--b1agalablcee2g": 147,
    "xn--b1agascrdrhdc": 76, "xn--b1agd0aean": 182, "xn--b1agflcndeb5cwb": 160, "xn--b1ahhecb0azo": 167,
    "xn--b1aigedeu0a": 113, "xn--b1alfrj": 13, "xn--b1amdelgbarlac": 29, "xn--b1amgjfbapr7b": 376,
    "xn--b1apcnb5dwc": 73, "xn--b1apdlal5j": 70, "xn--b1apmck": 20, "xn--b1aqbiftj7e1a": 47,
    "xn--c1abbuhodcjk7a6g": 176, "xn--c1accagmodt": 181, "xn--c1adagsdpibul": 232, "xn--c1adknif": 129,
    "xn--c1adnogiu": 119, "xn--c1adqbkbdebucj6e": 80, "xn--c1aesfx9dc": 100, "xn--c1aigpdl4f": 107,
    "xn--c1ajhpcjhd0j": 108, "xn--c1akgjcdy": 168, "xn--c1azcgcc": 9, "xn--d1abacdeqluciba1a2o": 171,
    "xn--d1abbac1ainynr4c": 184, "xn--d1acdcbhaih3a3aq": 77, "xn--d1acpke4c": 257, "xn--d1amckbds1g": 61,
    "xn--e1aajhowakj": 151, "xn--e1aaob1aia6b": 106, "xn--e1aar9b": 485, "xn--e1afhbv7b": 42,
    "xn--e1afkclaggf6a2g": 52, "xn--e1aibcrgq": 115, "xn--e1aid1a": 153, "xn--e1ajt2aza": 93,
    "xn--e1akbdhdtf": 39, "xn--e1amg1bxa": 17, "xn--e1aner7ci": 1, "xn--e1aohf5d": 34,
    "xn--g1afe6db": 256, "xn--h1aafh7b": 57, "xn--h1aagcg0aedh6g": 493, "xn--h1aagfgb0aco": 316,
    "xn--h1aagfhqjm9a": 161, "xn--h1aaky0bj": 56, "xn--h1adancaggv": 235, "xn--h1addj": 83,
    "xn--h1adkeby9a": 162, "xn--h1aeawgfg": 140, "xn--h1aecgfmj1g": 247, "xn--h1aekhj1a": 221,
    "xn--h1afipca2eya": 31, "xn--h1aliz": 27, "xn--j1aarei": 35, "xn--j1achbn": 81,
    "xn--j1adfn": 142, "xn--j1adfnc": 209, "xn--j1ahge": 200, "xn--k1afg2e": 5,
    "xn--l1aafho": 248
  };
  const city = host === root ? '' : host.slice(0, -zone.length);
  const cityId = cityIds[city];
  const isMainHome = host === root && location.pathname === '/';
  const base = !isMainHome && Number.isInteger(cityId) ? 'site-' + cityId : 'site';

  const bot = 'https://t.me/spetspark24_bot';
  const withSource = script.getAttribute('data-sp24-source') === '1';
  const selector = 'a[data-site-messenger="telegram"]';
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const otherClickIds = ['gclid', 'gbraid', 'wbraid', 'dclid', 'msclkid', 'fbclid', 'ttclid'];
  const touchFields = [...utmFields, 'yclid', ...otherClickIds, 'utm_referrer'];

  function sourceSuffix() {
    if (!withSource) return '';

    try {
      const key = 'src_first=';
      const entry = document.cookie.split(';').map(pair => pair.trim())
        .find(pair => pair.startsWith(key));
      if (!entry) return '';

      const raw = entry.slice(key.length).trim();
      const data = JSON.parse(raw.startsWith('{') ? raw : decodeURIComponent(raw));
      if (!data || Array.isArray(data) || typeof data.landing !== 'string' ||
          typeof data.referrer !== 'string' || typeof data.ts !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(data.ts) ||
          !Number.isFinite(Date.parse(data.ts))) return '';

      const landing = new URL(data.landing);
      const landingHost = landing.hostname.toLowerCase().replace(/\.+$/, '');
      if (!/^https?:$/.test(landing.protocol) ||
          (landingHost !== root && !landingHost.endsWith(zone)) ||
          landing.username || landing.password || landing.hash) return '';

      if (touchFields.some(field => data[field] !== undefined && typeof data[field] !== 'string')) {
        return '';
      }

      // landing хранит URL первого захода, включая метки, которые сборщик
      // форм не выносит в отдельные поля, например wbraid и gbraid.
      const value = field => data[field]?.trim() || landing.searchParams.get(field)?.trim() || '';
      if (value('yclid')) return '-d';
      if (otherClickIds.some(field => value(field))) return '';

      const source = value('utm_source').toLowerCase();
      const medium = value('utm_medium').toLowerCase();
      if (source === 'yandex' && medium === 'cpc') return '-d';
      if (source === 'yandex' && medium === 'organic') return '-sy';
      if (source === 'google' && medium === 'organic') return '-sg';
      if (utmFields.some(field => value(field))) return '';

      const referrer = data.referrer.trim();
      if (!referrer) return value('utm_referrer') ? '' : '-t';

      const ref = new URL(referrer);
      const name = ref.hostname.toLowerCase().replace(/\.+$/, '');
      if (ref.protocol === 'android-app:' && name === 'com.google.android.googlequicksearchbox') {
        return '-sg';
      }
      if (!/^https?:$/.test(ref.protocol) || ref.username || ref.password) return '';

      const yandex = /^(?:www\.)?(?:yandex\.(?:com\.tr|[a-z]{2,3})|ya\.ru)$/.test(name);
      const google = /^(?:www\.)?google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(name);
      const path = ref.pathname;
      if (yandex && (path === '/' || /^\/(?:search|yandsearch)(?:\/|$)/.test(path))) {
        return '-sy';
      }
      if (google && (path === '/' || /^\/(?:search|webhp|url)(?:\/|$)/.test(path))) {
        return '-sg';
      }
    } catch {
      // Повреждённое первое касание оставляет базовую метку.
    }
    return '';
  }

  function update(link, suffix) {
    const href = bot + '?start=' + base + suffix;
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  const suffix = sourceSuffix();
  document.querySelectorAll(selector).forEach(link => update(link, suffix));
  for (const name of ['click', 'auxclick', 'pointerdown', 'contextmenu']) {
    document.addEventListener(name, event => {
      const link = event.target?.closest?.(selector);
      if (link) update(link, sourceSuffix());
    }, true);
  }
  window.sp24MessengerLinksReady = true;
})();