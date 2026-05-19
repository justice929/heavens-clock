(function () {

  const SITE_VERSION = "20260519-lang-2";

  const SITE_LOCALE_KEY = "heavens-clock-site-locale";

  const SETTINGS_KEY = "memento-mori-settings";

  const WAITLIST_KEY = "heavens-clock-site-waitlist";
  const SITE_FULLY_TRANSLATED = ["en", "ko"];

  const { SUPPORTED, normalize, detectBrowser, documentLang, fillLanguageSelect } =

    window.HeavensClockLocales || {

      SUPPORTED: ["en", "ko"],

      normalize: (c) => {
        const codes = ["en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it", "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl"];
        return codes.includes(c) ? c : "en";
      },

      detectBrowser: () => "en",

      documentLang: (c) => c,

      fillLanguageSelect: () => {},

    };



  let strings = {};



  function getPathValue(key) {

    let value = strings;

    for (const part of key.split(".")) value = value?.[part];

    return typeof value === "string" ? value : key;

  }



  function readSettings() {

    try {

      const raw = localStorage.getItem(SETTINGS_KEY);

      return raw ? JSON.parse(raw) : {};

    } catch (_) {

      return {};

    }

  }



  function writeSettingsLocale(code) {

    try {

      const settings = { ...readSettings(), locale: code };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    } catch (_) {}

    try {

      localStorage.setItem(SITE_LOCALE_KEY, code);

    } catch (_) {}

  }



  function preferredLocale() {

    const fromSettings = normalize(readSettings().locale);

    if (fromSettings !== "en" || readSettings().locale) {

      return fromSettings;

    }



    try {

      const saved = localStorage.getItem(SITE_LOCALE_KEY);

      if (saved && SUPPORTED.includes(saved)) return saved;

    } catch (_) {}



    return detectBrowser();

  }



  async function fetchSiteLocale(code) {

    for (const candidate of [code, "en"]) {

      try {

        const response = await fetch(`/site/locales/${candidate}.json?v=${SITE_VERSION}`, {

          cache: "no-store",

        });

        if (!response.ok) continue;

        return await response.json();

      } catch (_) {}

    }

    return {};

  }



  async function fetchAppLocale(code) {

    for (const candidate of [code, "en"]) {

      try {

        const response = await fetch(

          `/locales/${encodeURIComponent(candidate)}.json?v=${SITE_VERSION}`,

          { cache: "no-store" }

        );

        if (!response.ok) continue;

        return await response.json();

      } catch (_) {}

    }

    return null;

  }



  function mergeAppPreview(site, app) {

    if (!app) return site;

    return {

      ...site,

      brand: app.appTitle || site.brand,

      meta: {

        ...site.meta,

        title: app.appTitle || site.meta?.title,

      },

      mock: {

        ...site.mock,

        appTitle: app.appTitle || site.mock?.appTitle,

        caption: app.remaining || site.mock?.caption,

        year: app.unit?.year || site.mock?.year,

        day: app.unit?.day || site.mock?.day,

        hour: app.unit?.hour || site.mock?.hour,

        bucketTitle: app.bucket?.today || site.mock?.bucketTitle,

        bucketText: app.bucket?.empty || site.mock?.bucketText,

      },

    };

  }



  async function loadLocale(locale) {

    const next = normalize(locale);

    const site = await fetchSiteLocale(next);

    const app = await fetchAppLocale(next);

    strings = mergeAppPreview(site, app);

    document.documentElement.lang = documentLang(next);

    // Landing RTL only when Arabic copy exists (not English placeholder stubs).
    document.documentElement.dir =
      next === "ar" && SITE_FULLY_TRANSLATED.includes("ar") ? "rtl" : "ltr";

    writeSettingsLocale(next);

    return next;

  }



  function applyI18n() {

    document.querySelectorAll("[data-i18n]").forEach((element) => {

      element.textContent = getPathValue(element.dataset.i18n);

    });



    document.querySelectorAll("[data-i18n-html]").forEach((element) => {

      element.innerHTML = getPathValue(element.dataset.i18nHtml);

    });



    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {

      element.setAttribute("placeholder", getPathValue(element.dataset.i18nPlaceholder));

    });

  }



  function updateLocaleNotice(active) {
    let notice = document.getElementById("locale-notice");
    const mockCaption = getPathValue("mock.caption");
    const mockTranslated = mockCaption && mockCaption !== "Time left";
    if (SITE_FULLY_TRANSLATED.includes(active) || (active !== "en" && mockTranslated)) {
      notice?.remove();
      return;
    }
    if (!notice) {
      notice = document.createElement("p");
      notice.id = "locale-notice";
      notice.className = "locale-notice";
      document.querySelector("header.topbar")?.append(notice);
    }
    const msg = getPathValue("meta.landingEnglishFallback");
    notice.textContent =
      msg !== "meta.landingEnglishFallback"
        ? msg
        : "Landing page in English for now. The clock app uses your selected language.";
  }

  async function setLocale(locale) {

    const active = await loadLocale(locale);

    const select = document.getElementById("language");

    if (select) select.value = active;

    document.title = getPathValue("meta.title");

    applyI18n();

    updateLocaleNotice(active);

    return active;

  }



  document.getElementById("language")?.addEventListener("change", (event) => {

    setLocale(event.target.value);

  });



  document.querySelector(".signup")?.addEventListener("submit", (event) => {

    event.preventDefault();

    const input = document.getElementById("waitlist-email");

    const email = input?.value.trim() || "";

    const note = document.querySelector(".form-note");

    const status = document.getElementById("waitlist-status");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

      if (status) status.textContent = getPathValue("join.invalidEmail");

      return;

    }



    try {

      const list = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");

      const next = Array.isArray(list) ? list.filter(Boolean) : [];

      if (!next.includes(email)) next.push(email);

      localStorage.setItem(WAITLIST_KEY, JSON.stringify(next));

    } catch (_) {}



    if (status) status.textContent = getPathValue("join.success");

    if (note) note.textContent = getPathValue("join.note");

    if (input) input.value = "";

  });



  function isPremiumWeb() {

    try {

      const raw = localStorage.getItem("heavens-clock-entitlements");

      if (!raw) return false;

      const entitlements = JSON.parse(raw);

      if (entitlements.lifetimePremium) return true;

      if (entitlements.yearlyPremium) {

        if (!entitlements.yearlyExpiresAt) return true;

        return new Date(entitlements.yearlyExpiresAt) > new Date();

      }

      if (entitlements.premiumThemes || entitlements.premiumWidgets) return true;

    } catch (_) {}

    return false;

  }



  function mountPremiumWebClockCta() {

    if (!isPremiumWeb()) return;

    const cta = document.querySelector(".hero .cta");

    if (!cta) return;



    if (!document.getElementById("open-web-clock")) {

      const link = document.createElement("a");

      link.id = "open-web-clock";

      link.className = "button";

      link.href = "../index.html";

      link.textContent = getPathValue("hero.openWebClock");

      cta.appendChild(link);

    }



    if (!document.getElementById("install-web-clock")) {

      const install = document.createElement("a");

      install.id = "install-web-clock";

      install.className = "button primary";

      install.href = "../index.html#install";

      install.textContent = getPathValue("hero.installWebClock");

      cta.appendChild(install);

    }

  }



  const initial = preferredLocale();

  fillLanguageSelect(document.getElementById("language"), initial);

  setLocale(initial).then(() => {

    mountPremiumWebClockCta();

  });

})();

