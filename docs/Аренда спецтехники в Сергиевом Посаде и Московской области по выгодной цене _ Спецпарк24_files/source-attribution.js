(function () {
  'use strict';

  var domain = 'xn--24-6kct0a1abje6c.xn--p1ai';
  var fields = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'utm_content', 'utm_term', 'yclid', 'gclid'
  ];

  var host = function (value) {
    return value.toLowerCase().replace(/\.+$/, '');
  };

  var own = function (value) {
    value = host(value);
    return value === domain || value.endsWith('.' + domain);
  };

  if (!own(location.hostname)) return;

  var clip = function (value, limit) {
    return Array.from(String(value))
      .slice(0, limit)
      .join('')
      .replace(
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
        '$1'
      );
  };

  function external(value) {
    if (!value) return '';

    try {
      var u = new URL(value);

      if (
        u.protocol === 'android-app:' &&
        host(u.hostname) === 'com.google.android.googlequicksearchbox'
      ) {
        return u.href;
      }

      if (
        !/^https?:$/.test(u.protocol) ||
        !u.hostname ||
        u.username ||
        u.password ||
        own(u.hostname)
      ) {
        return '';
      }

      u.hash = '';
      return u.href;
    } catch (e) {
      return '';
    }
  }

  function read(name) {
    try {
      var entry = document.cookie
        .split(';')
        .map(function (x) {
          return x.trim();
        })
        .find(function (x) {
          return x.startsWith(name + '=');
        });

      if (!entry) return null;

      var raw = entry.slice(name.length + 1);
      if (raw.length > 16384) return null;

      var data;

      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = JSON.parse(decodeURIComponent(raw));
      }

      if (
        !data ||
        Array.isArray(data) ||
        typeof data !== 'object'
      ) {
        return null;
      }

      if (
        typeof data.landing !== 'string' ||
        typeof data.ts !== 'string'
      ) {
        return null;
      }

      var u = new URL(data.landing);

      if (
        !/^https?:$/.test(u.protocol) ||
        !own(u.hostname) ||
        u.username ||
        u.password ||
        u.hash
      ) {
        return null;
      }

      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(data.ts) ||
        !Number.isFinite(Date.parse(data.ts))
      ) {
        return null;
      }

      var keys = fields.concat(['referrer']);

      for (var i = 0; i < keys.length; i++) {
        if (
          data[keys[i]] !== undefined &&
          typeof data[keys[i]] !== 'string'
        ) {
          return null;
        }
      }

      return data;
    } catch (e) {
      return null;
    }
  }

  function write(name, touch) {
    var data = Object.assign({}, touch);
    var keys = fields.concat(['referrer', 'landing']);

    var encoded = function () {
      return encodeURIComponent(JSON.stringify(data));
    };

    var value = encoded();

    while (value.length > 3700) {
      var largest = keys
        .filter(function (key) {
          return key !== 'landing' ||
            Array.from(data[key]).length > 120;
        })
        .sort(function (a, b) {
          return encodeURIComponent(data[b]).length -
            encodeURIComponent(data[a]).length;
        })[0];

      if (!largest || !data[largest]) return;

      data[largest] = clip(
        data[largest],
        Math.max(0, Array.from(data[largest]).length - 20)
      );

      value = encoded();
    }

    document.cookie =
      name + '=' + value +
      '; Max-Age=7776000' +
      '; Path=/' +
      '; Domain=' + domain +
      '; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
  }

  try {
    var params = new URLSearchParams(location.search);
    var touch = {};

    fields.forEach(function (key) {
      touch[key] = clip((params.get(key) || '').trim(), 200);
    });

    touch.referrer = clip(
      external(document.referrer) ||
      external(params.get('utm_referrer')),
      300
    );

    touch.landing = clip(
      location.origin + location.pathname + location.search,
      1200
    );

    touch.ts = new Date().toISOString();

    if (!read('src_first')) {
      write('src_first', touch);
    }

    if (
      !read('src_last') ||
      fields.some(function (key) {
        return touch[key] !== '';
      }) ||
      touch.referrer !== ''
    ) {
      write('src_last', touch);
    }
  } catch (e) {
    // Ошибка сбора меток не должна мешать работе форм.
  }
})();