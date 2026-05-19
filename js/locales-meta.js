/**
 * Shared locale list for web + app (onboarding, landing, clock).
 */
(function (root) {
  const SUPPORTED = [
    "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
    "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
  ];

  const LABELS = {
    en: "English",
    ko: "한국어",
    ja: "日本語",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
    it: "Italiano",
    ar: "العربية",
    hi: "हिन्दी",
    ru: "Русский",
    vi: "Tiếng Việt",
    th: "ไทย",
    id: "Indonesia",
    tr: "Türkçe",
    nl: "Nederlands",
    pl: "Polski",
  };

  const BROWSER_MAP = {
    ko: "ko",
    ja: "ja",
    zh: "zh-Hans",
    "zh-cn": "zh-Hans",
    "zh-tw": "zh-Hant",
    "zh-hk": "zh-Hant",
    es: "es",
    fr: "fr",
    de: "de",
    pt: "pt",
    it: "it",
    ar: "ar",
    hi: "hi",
    ru: "ru",
    vi: "vi",
    th: "th",
    id: "id",
    tr: "tr",
    nl: "nl",
    pl: "pl",
  };

  function normalize(code) {
    if (!code || typeof code !== "string") return "en";
    return SUPPORTED.includes(code) ? code : "en";
  }

  function detectBrowser() {
    const lang = (navigator.language || "en").toLowerCase();
    if (BROWSER_MAP[lang]) return BROWSER_MAP[lang];
    const base = lang.split("-")[0];
    return BROWSER_MAP[base] || "en";
  }

  function documentLang(code) {
    if (code === "zh-Hans") return "zh-CN";
    if (code === "zh-Hant") return "zh-TW";
    return code.split("-")[0];
  }

  function fillLanguageSelect(select, activeCode) {
    if (!select) return;
    const active = normalize(activeCode);
    select.textContent = "";
    SUPPORTED.forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = LABELS[code] || code;
      if (code === active) option.selected = true;
      select.appendChild(option);
    });
  }

  root.HeavensClockLocales = {
    SUPPORTED,
    LABELS,
    normalize,
    detectBrowser,
    documentLang,
    fillLanguageSelect,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
