(function () {
  const SITE_VERSION = "20260519-beta-path-2";
  const SITE_LOCALE_KEY = "heavens-clock-site-locale";
  const WAITLIST_KEY = "heavens-clock-site-waitlist";
  const SUPPORTED_LOCALES = ["en", "ko"];
  let strings = {};

  function getPathValue(key) {
    let value = strings;
    for (const part of key.split(".")) value = value?.[part];
    return typeof value === "string" ? value : key;
  }

  function preferredLocale() {
    try {
      const saved = localStorage.getItem(SITE_LOCALE_KEY);
      if (SUPPORTED_LOCALES.includes(saved)) return saved;
    } catch (_) {}

    const browser = (navigator.language || "en").toLowerCase();
    return browser.startsWith("ko") ? "ko" : "en";
  }

  async function loadLocale(locale) {
    const next = SUPPORTED_LOCALES.includes(locale) ? locale : "en";
    for (const candidate of [next, "en"]) {
      try {
        const response = await fetch(`locales/${candidate}.json?v=${SITE_VERSION}`, { cache: "no-store" });
        if (!response.ok) continue;
        strings = await response.json();
        document.documentElement.lang = candidate;
        try { localStorage.setItem(SITE_LOCALE_KEY, candidate); } catch (_) {}
        return candidate;
      } catch (_) {}
    }
    return "en";
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

  async function setLocale(locale) {
    const active = await loadLocale(locale);
    const select = document.getElementById("language");
    if (select) select.value = active;
    document.title = getPathValue("meta.title");
    applyI18n();
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

  setLocale(preferredLocale());
})();
