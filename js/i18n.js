const SUPPORTED =
  typeof globalThis !== "undefined" && globalThis.HeavensClockLocales?.SUPPORTED
    ? globalThis.HeavensClockLocales.SUPPORTED
    : [
        "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
        "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
      ];

let strings = {};
let currentLocale = "en";

export async function loadLocale(code) {
  const locale = SUPPORTED.includes(code) ? code : "en";
  const paths = [locale, "en"];
  for (const p of paths) {
    try {
      const res = await fetch(`locales/${p}.json`);
      if (res.ok) {
        strings = await res.json();
        currentLocale = p;
        document.documentElement.lang = p === "zh-Hans" ? "zh-CN" : p === "zh-Hant" ? "zh-TW" : p.split("-")[0];
        document.documentElement.dir = p === "ar" ? "rtl" : "ltr";
        if (!strings.quotes?.length && p !== "en") {
          try {
            const enRes = await fetch("locales/en.json");
            if (enRes.ok) strings.quotes = (await enRes.json()).quotes;
          } catch (_) {}
        }
        return strings;
      }
    } catch (_) {}
  }
  return strings;
}

export function t(key, vars = {}) {
  const parts = key.split(".");
  let v = strings;
  for (const p of parts) {
    v = v?.[p];
  }
  if (typeof v !== "string") return key;
  return v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function getLocale() {
  return currentLocale;
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const attr = el.dataset.i18nAttr;
    const text = t(key);
    if (attr) el.setAttribute(attr, text);
    else el.textContent = text;
  });
}

export function getQuoteForToday() {
  const quotes = strings.quotes;
  if (!Array.isArray(quotes) || !quotes.length) return "";
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86_400_000);
  return quotes[day % quotes.length];
}

export { SUPPORTED };
