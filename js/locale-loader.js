/**
 * Shared locale JSON loader (clock app, onboarding, bucket).
 */
(function (root) {
  const CACHE_VERSION = "3";

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

  async function fetchLocaleJson(code) {
    const res = await fetch(localeUrl(code), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadLocale(code) {
    const locale = normalize(code);
    for (const candidate of [locale, "en"]) {
      try {
        const data = await fetchLocaleJson(candidate);
        if (!data) continue;
        root.document.documentElement.lang = documentLang(candidate);
        root.document.documentElement.dir = candidate === "ar" ? "rtl" : "ltr";
        if (!data.quotes?.length && candidate !== "en") {
          const en = await fetchLocaleJson("en");
          if (en?.quotes?.length) data.quotes = en.quotes;
        }
        return { locale: candidate, strings: data };
      } catch (_) {}
    }
    const en = await fetchLocaleJson("en");
    return { locale: "en", strings: en || {} };
  }

  root.HeavensClockLocaleLoader = {
    CACHE_VERSION,
    LOCALE_CODES,
    normalize,
    localeUrl,
    documentLang,
    intlLocale,
    loadLocale,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
