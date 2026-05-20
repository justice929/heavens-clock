/**
 * Shared locale JSON loader — all app pages use this.
 * Missing keys fall back to English so no page shows raw "premium.title" keys.
 */
(function (root) {
  const CACHE_VERSION = "4";

  const LOCALE_CODES = [
    "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
    "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
  ];

  function normalize(code) {
    const meta = root.HeavensClockLocales;
    if (meta?.normalize) return meta.normalize(code);
    if (code && LOCALE_CODES.includes(code)) return code;
    return "en";
  }

  function localeUrl(code) {
    const file = `${encodeURIComponent(code)}.json?v=${CACHE_VERSION}`;
    return new URL(`locales/${file}`, root.location.href).href;
  }

  function documentLang(code) {
    const meta = root.HeavensClockLocales;
    if (meta?.documentLang) return meta.documentLang(code);
    if (code === "ko") return "ko";
    if (code === "zh-Hans") return "zh-CN";
    if (code === "zh-Hant") return "zh-TW";
    return code.split("-")[0];
  }

  function intlLocale(code) {
    if (code === "ko") return "ko-KR";
    if (code === "zh-Hans") return "zh-CN";
    if (code === "zh-Hant") return "zh-TW";
    return documentLang(code);
  }

  function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  /** Locale strings override English; missing nested keys use English. */
  function deepMergeWithEnglish(english, localeStrings) {
    if (!english) return localeStrings || {};
    if (!localeStrings) return { ...english };
    const out = { ...english };
    for (const key of Object.keys(localeStrings)) {
      const lv = localeStrings[key];
      const ev = english[key];
      if (isPlainObject(lv) && isPlainObject(ev)) {
        out[key] = deepMergeWithEnglish(ev, lv);
      } else {
        out[key] = lv;
      }
    }
    return out;
  }

  async function fetchLocaleJson(code) {
    try {
      const res = await fetch(localeUrl(code), { cache: "no-store" });
      if (!res.ok) return null;
      return res.json();
    } catch (_) {
      return null;
    }
  }

  function t(strings, key) {
    let value = strings;
    for (const part of key.split(".")) value = value?.[part];
    return typeof value === "string" ? value : key;
  }

  function applyI18n(strings, rootNode) {
    const scope = rootNode || root.document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(strings, el.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(strings, el.dataset.i18nPlaceholder));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(strings, el.dataset.i18nHtml);
    });
  }

  function pickLocalized(map, locale) {
    if (typeof map === "string") return map;
    if (!map || typeof map !== "object") return "";
    const code = normalize(locale);
    return map[code] || map[locale] || map.en || "";
  }

  async function loadLocale(code) {
    const locale = normalize(code);
    const english = (await fetchLocaleJson("en")) || {};

    for (const candidate of [locale, "en"]) {
      const raw = candidate === "en" ? english : await fetchLocaleJson(candidate);
      if (!raw) continue;

      const base = candidate === "en" ? english : english;
      const strings =
        candidate === "en"
          ? { ...english }
          : deepMergeWithEnglish(base, raw);

      root.document.documentElement.lang = documentLang(candidate);
      root.document.documentElement.dir = candidate === "ar" ? "rtl" : "ltr";

      return { locale: candidate, strings };
    }

    return { locale: "en", strings: { ...english } };
  }

  root.HeavensClockLocaleLoader = {
    CACHE_VERSION,
    LOCALE_CODES,
    normalize,
    localeUrl,
    documentLang,
    intlLocale,
    deepMergeWithEnglish,
    t,
    applyI18n,
    pickLocalized,
    loadLocale,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
