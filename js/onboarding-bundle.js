(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const meta = window.HeavensClockLocales || {};
  const SUPPORTED = meta.SUPPORTED || ["en", "ko"];
  const LANG_NAMES = meta.LABELS || { en: "English", ko: "한국어" };
  const DEFAULT_SETTINGS = {
    birthDate: "", birthTime: "00:00", lifespanYears: 80, timeZone: "",
    locale: "", onboardingComplete: false, setupVersion: 2, purchased: false,
  };
  let strings = {};
  let step = 0;

  const $ = (id) => document.getElementById(id);

  function detectTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (_) { return "UTC"; }
  }

  function detectLocale() {
    const lang = (navigator.language || "en").toLowerCase();
    const map = { ko: "ko", ja: "ja", zh: "zh-Hans", "zh-cn": "zh-Hans", "zh-tw": "zh-Hant", es: "es", fr: "fr", de: "de", pt: "pt", it: "it", ar: "ar", hi: "hi", ru: "ru", vi: "vi", th: "th", id: "id", tr: "tr", nl: "nl", pl: "pl" };
    return map[lang] || map[lang.split("-")[0]] || "en";
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS, timeZone: detectTimeZone() };
    } catch (_) {
      return { ...DEFAULT_SETTINGS, timeZone: detectTimeZone() };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function loadLocale(code) {
    const loader = window.HeavensClockLocaleLoader;
    if (!loader?.loadLocale) return;
    const loaded = await loader.loadLocale(code);
    strings = loaded.strings;
  }

  function t(key) {
    let v = strings;
    for (const p of key.split(".")) v = v?.[p];
    return typeof v === "string" ? v : key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
  }

  function two(n) { return String(n).padStart(2, "0"); }
  function num(id) { return Number($(id).value.trim()); }
  function validDate(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && y <= new Date().getFullYear() && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  async function init() {
    const isEdit =
      new URLSearchParams(location.search).get("edit") === "1" || location.hash === "#edit";
    const draft = loadSettings();
    draft.locale = draft.locale || detectLocale();
    draft.timeZone = draft.timeZone || detectTimeZone();

    await loadLocale(draft.locale);
    applyI18n();
    document.title = t("appTitle");
    if (isEdit) {
      document.body.classList.add("is-edit");
      $("subtitle").textContent = t("onboarding.editSubtitle");
      $("edit-bottom")?.classList.remove("hidden");
      $("btn-clock")?.addEventListener("click", () => {
        saveSettings(draft);
        location.replace("index.html");
      });
    }
    $("tz-display").textContent = draft.timeZone;

    if (draft.birthDate) {
      const [y, m, d] = draft.birthDate.split("-");
      $("birth-year").value = y || "";
      $("birth-month").value = m || "";
      $("birth-day").value = d || "";
    }
    if (draft.birthTime) {
      const [h, m] = draft.birthTime.split(":");
      $("birth-hour").value = h || "12";
      $("birth-minute").value = m || "00";
    }
    $("lifespan").value = draft.lifespanYears || 80;
    $("lifespan-display").textContent = $("lifespan").value;

    const grid = $("lang-grid");
    SUPPORTED.forEach((code) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = LANG_NAMES[code] || code;
      b.classList.toggle("active", code === draft.locale);
      b.addEventListener("click", async () => {
        grid.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        draft.locale = code;
        await loadLocale(code);
        applyI18n();
        document.title = t("appTitle");
        $("btn-next").textContent = step === 3 ? t("onboarding.start") : t("onboarding.next");
        $("btn-back").textContent = t("onboarding.back");
        if (isEdit) {
          $("subtitle").textContent = t("onboarding.editSubtitle");
          $("btn-clock").textContent = t("onboarding.backToClock");
        }
      });
      grid.appendChild(b);
    });

    const dots = $("dots");
    for (let i = 0; i < 4; i++) dots.appendChild(document.createElement("span"));

    $("lifespan").addEventListener("input", (e) => {
      $("lifespan-display").textContent = e.target.value;
    });

    function showStep(n) {
      step = n;
      $("error").textContent = "";
      for (let i = 0; i < 4; i++) {
        $(`step-${i}`).classList.toggle("hidden", i !== n);
        dots.children[i].classList.toggle("on", i === n);
      }
      $("btn-back").classList.toggle("hidden", n === 0);
      $("btn-next").textContent = n === 3 ? t("onboarding.start") : t("onboarding.next");
      $("btn-back").textContent = t("onboarding.back");
    }

    $("btn-next").addEventListener("click", () => {
      if (step === 1) {
        const y = num("birth-year"), m = num("birth-month"), d = num("birth-day");
        if (!validDate(y, m, d)) {
          $("error").textContent = t("onboarding.invalidDate");
          return;
        }
        draft.birthDate = `${y}-${two(m)}-${two(d)}`;
      }
      if (step === 2) {
        const h = num("birth-hour"), m = num("birth-minute");
        if (h < 0 || h > 23 || m < 0 || m > 59 || Number.isNaN(h) || Number.isNaN(m)) {
          $("error").textContent = t("onboarding.invalidTime");
          return;
        }
        draft.birthTime = `${two(h)}:${two(m)}`;
      }
      if (step === 3) {
        draft.lifespanYears = Number($("lifespan").value) || 80;
        draft.onboardingComplete = true;
        draft.setupVersion = 2;
        saveSettings(draft);
        location.replace("index.html");
        return;
      }
      showStep(step + 1);
    });

    $("btn-back").addEventListener("click", () => {
      if (step > 0) showStep(step - 1);
    });

    showStep(0);
  }

  init().catch((err) => {
    const error = $("error");
    if (error) error.textContent = `Startup error: ${err.message || err}`;
  });
})();

