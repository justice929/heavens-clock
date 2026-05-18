(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const THEME_KEY = "heavens-clock-theme";
  const WIDGET_DATA_KEY = "memento-mori-widget";
  const MOOD_KEY = "heaven-clock-mood";
  const BUCKET_KEY = "heavens-clock-bucket-list";

  const DEFAULT_SETTINGS = {
    birthDate: "",
    birthTime: "00:00",
    lifespanYears: 80,
    timeZone: "",
    locale: "",
    onboardingComplete: false,
    setupVersion: 0,
    purchased: false,
  };

  const THEMES = [
    { id: "void", name: "Void", tier: "free", accent: "#e8d9b8" },
    { id: "ember", name: "Ember", tier: "premium", accent: "#ff6b4a" },
    { id: "cosmos", name: "Cosmos", tier: "premium", accent: "#8ae8ff" },
    { id: "chronograph", name: "Chronograph", tier: "premium", accent: "#d7c28a" },
    { id: "legacy", name: "Legacy", tier: "premium", accent: "#f3c76f" },
    { id: "hologram", name: "Hologram", tier: "premium", accent: "#48eaff" },
  ];

  let strings = {};
  let currentLocale = "en";
  let initialYears = 0;
  const ringEls = {};
  const ringCirc = {};

  function detectTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (_) { return "UTC"; }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS, timeZone: detectTimeZone() };
    } catch (_) {
      return { ...DEFAULT_SETTINGS, timeZone: detectTimeZone() };
    }
  }

  function zonedLocalToUtc(dateStr, timeStr, timeZone) {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, mi] = (timeStr || "00:00").split(":").map(Number);
    let utc = Date.UTC(y, mo - 1, d, h, mi, 0);
    for (let i = 0; i < 6; i++) {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
          timeZone, year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hour12: false,
        }).formatToParts(new Date(utc)).map((p) => [p.type, p.value])
      );
      const diffMin =
        (y - Number(parts.year)) * 525600 +
        (mo - Number(parts.month)) * 43200 +
        (d - Number(parts.day)) * 1440 +
        (h - Number(parts.hour)) * 60 +
        (mi - Number(parts.minute));
      if (diffMin === 0) break;
      utc += diffMin * 60_000;
    }
    return new Date(utc);
  }

  function computeLifeRange(settings) {
    const tz = settings.timeZone || detectTimeZone();
    const birth = zonedLocalToUtc(settings.birthDate, settings.birthTime, tz);
    const target = new Date(birth.getTime());
    target.setUTCFullYear(target.getUTCFullYear() + Number(settings.lifespanYears || 80));
    return { birth, target, timeZone: tz };
  }

  async function loadLocale(code) {
    const locale = code || "en";
    for (const p of [locale, "en"]) {
      try {
        const res = await fetch(`locales/${p}.json`);
        if (!res.ok) continue;
        strings = await res.json();
        currentLocale = p;
        document.documentElement.lang = p === "ko" ? "ko" : p.split("-")[0];
        document.documentElement.dir = p === "ar" ? "rtl" : "ltr";
        if (!strings.quotes?.length && p !== "en") {
          const enRes = await fetch("locales/en.json");
          if (enRes.ok) strings.quotes = (await enRes.json()).quotes;
        }
        return;
      } catch (_) {}
    }
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
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
  }

  function quoteForToday() {
    const quotes = strings.quotes || [];
    if (!quotes.length) return "";
    const start = new Date(new Date().getFullYear(), 0, 0);
    const day = Math.floor((Date.now() - start) / 86_400_000);
    return quotes[day % quotes.length];
  }

  function formatTargetLabel(target) {
    return new Intl.DateTimeFormat(currentLocale === "ko" ? "ko-KR" : currentLocale, {
      year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC",
    }).format(target).replace(/\//g, ".").replace(/\s/g, "");
  }

  function loadTheme() {
    try {
      const id = localStorage.getItem(THEME_KEY);
      return THEMES.some((theme) => theme.id === id) ? id : "void";
    } catch (_) { return "void"; }
  }

  function saveTheme(id) {
    const next = THEMES.some((theme) => theme.id === id) ? id : "void";
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    return next;
  }

  function loadBucketItems() {
    try {
      const items = JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]");
      return Array.isArray(items) ? items.filter((item) => item && typeof item.text === "string") : [];
    } catch (_) {
      return [];
    }
  }

  function saveBucketItems(items) {
    try { localStorage.setItem(BUCKET_KEY, JSON.stringify(items)); } catch (_) {}
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function remainingParts(from, to) {
    if (to <= from) return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    let cursor = new Date(from.getTime());
    let years = 0;
    while (true) {
      const next = new Date(cursor);
      next.setFullYear(next.getFullYear() + 1);
      if (next > to) break;
      years++;
      cursor = next;
    }
    let days = 0;
    while (true) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 1);
      if (next > to) break;
      days++;
      cursor = next;
    }
    const ms = to - cursor;
    return {
      years, days,
      hours: Math.floor(ms / 3_600_000),
      minutes: Math.floor((ms % 3_600_000) / 60_000),
      seconds: Math.floor((ms % 60_000) / 1_000),
    };
  }

  function initError(message) {
    const pct = document.getElementById("pct-value");
    if (pct) pct.textContent = "SET";
    const q = document.getElementById("daily-quote");
    if (q) q.textContent = message;
  }

  async function init() {
    const settings = loadSettings();
    if (!settings.onboardingComplete || !settings.birthDate || settings.setupVersion !== 2) {
      location.replace("onboarding.html");
      return;
    }

    await loadLocale(settings.locale || "en");
    applyI18n();

    const { birth: lifeStart, target } = computeLifeRange(settings);
    const pctValue = document.getElementById("pct-value");
    const targetLabel = document.getElementById("target-label");
    const quote = document.getElementById("daily-quote");
    const moodHint = document.getElementById("mood-hint");
    const caption = document.getElementById("caption");
    const clockWrap = document.getElementById("clock-wrap");
    const themeSwitch = document.getElementById("theme-switch");
    const bucketSpotlight = document.getElementById("bucket-spotlight");
    const bucketCount = document.getElementById("bucket-count");
    const values = Object.fromEntries([...document.querySelectorAll(".unit-value")].map((el) => [el.dataset.key, el]));
    const tabs = [...document.querySelectorAll(".mood-switch button")];
    let bucketState = loadBucketItems();
    let bucketIndex = 0;

    document.title = t("appTitle");
    targetLabel.textContent = formatTargetLabel(target);
    quote.textContent = quoteForToday();
    tabs[0].textContent = t("mood.calm");
    tabs[1].textContent = t("mood.impact");

    const ringDefs = [
      { key: "years", radius: 92, width: 2.8, max: () => Math.max(1, initialYears) },
      { key: "days", radius: 80, width: 2.4, max: () => 365 },
      { key: "hours", radius: 68, width: 2, max: () => 24 },
      { key: "minutes", radius: 56, width: 1.8, max: () => 60 },
      { key: "seconds", radius: 44, width: 1.6, max: () => 60 },
    ];
    const g = document.getElementById("rings");
    g.textContent = "";
    ringDefs.forEach(({ key, radius, width }) => {
      const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      track.setAttribute("cx", "100"); track.setAttribute("cy", "100"); track.setAttribute("r", radius);
      track.setAttribute("stroke-width", width); track.setAttribute("class", "ring-track");
      const fill = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      fill.setAttribute("cx", "100"); fill.setAttribute("cy", "100"); fill.setAttribute("r", radius);
      fill.setAttribute("stroke-width", width); fill.setAttribute("class", `ring-fill ring-${key}`);
      g.appendChild(track); g.appendChild(fill);
      ringEls[key] = fill;
      ringCirc[key] = 2 * Math.PI * radius;
      fill.style.strokeDasharray = ringCirc[key];
    });

    function updateWidgetSnapshot() {
      const now = new Date();
      const total = target - lifeStart;
      const left = target - now;
      const percentLeft = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;
      const snapshot = {
        version: 1,
        updatedAt: now.toISOString(),
        locale: currentLocale,
        theme: document.body.dataset.theme || "void",
        quote: quote.textContent,
        timeZone: settings.timeZone || detectTimeZone(),
        birthAt: lifeStart.toISOString(),
        targetAt: target.toISOString(),
        lifespanYears: Number(settings.lifespanYears || 80),
        daysLeft: Math.max(0, Math.ceil((target - now) / 86_400_000)),
        hoursLeftToday: Math.floor((Math.max(0, target - now) % 86_400_000) / 3_600_000),
        percentLeft: Number(percentLeft.toFixed(2)),
      };
      try { localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(snapshot)); } catch (_) {}
      window.HeavensClockBridge?.saveWidgetSnapshot?.(JSON.stringify(snapshot));
    }

    function setTheme(id) {
      const next = saveTheme(id);
      const theme = THEMES.find((item) => item.id === next) || THEMES[0];
      document.body.dataset.theme = theme.id;
      themeSwitch.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.theme === theme.id ? "true" : "false"));
      updateWidgetSnapshot();
    }

    themeSwitch.textContent = "";
    THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-dot";
      btn.dataset.theme = theme.id;
      btn.style.setProperty("--theme-accent", theme.accent);
      btn.setAttribute("aria-label", `${theme.name} theme`);
      btn.addEventListener("click", () => setTheme(theme.id));
      themeSwitch.appendChild(btn);
    });

    function setMood(mood) {
      document.body.dataset.mood = mood;
      tabs.forEach((btn) => btn.setAttribute("aria-selected", btn.dataset.mood === mood ? "true" : "false"));
      caption.textContent = t("remaining");
      moodHint.textContent = t(`hint.${mood}`);
      try { localStorage.setItem(MOOD_KEY, mood); } catch (_) {}
      updateWidgetSnapshot();
    }

    tabs.forEach((btn) => btn.addEventListener("click", () => setMood(btn.dataset.mood)));
    document.getElementById("edit-settings")?.addEventListener("click", () => location.href = "onboarding.html?edit=1");
    setTheme(loadTheme());
    setMood(localStorage.getItem(MOOD_KEY) === "impact" ? "impact" : "calm");

    function visibleBucketItems() {
      const active = bucketState.filter((item) => !item.done);
      return active.length ? active : bucketState;
    }

    function showBucketItem(nextIndex = bucketIndex) {
      const items = visibleBucketItems();
      const completed = bucketState.filter((item) => item.done).length;
      bucketCount.textContent = `${completed}/${bucketState.length}`;
      if (!items.length) {
        bucketSpotlight.textContent = t("bucket.empty");
        return;
      }
      bucketIndex = ((nextIndex % items.length) + items.length) % items.length;
      bucketSpotlight.classList.add("swap");
      window.setTimeout(() => {
        bucketSpotlight.textContent = items[bucketIndex].text;
        bucketSpotlight.classList.remove("swap");
      }, 220);
    }

    showBucketItem();
    setInterval(() => {
      const items = visibleBucketItems();
      if (items.length > 1) showBucketItem(bucketIndex + 1);
    }, 12_000);

    function lifeRatio(now) {
      const total = target - lifeStart;
      const left = target - now;
      return total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
    }
    function ringValue(key, parts, now) {
      return key === "seconds" ? parts.seconds + now.getMilliseconds() / 1000 : parts[key];
    }
    function updateRings(parts, now) {
      if (initialYears === 0) initialYears = Math.max(1, parts.years);
      ringDefs.forEach(({ key, max }) => {
        const ratio = Math.max(0, Math.min(1, ringValue(key, parts, now) / max()));
        ringEls[key].style.strokeDashoffset = ringCirc[key] * (1 - ratio);
      });
    }
    let prevSeconds = -1;
    function updateDigits(now) {
      const parts = remainingParts(now, target);
      updateRings(parts, now);
      pctValue.textContent = (lifeRatio(now) * 100).toFixed(2);
      values.years.textContent = parts.years;
      values.days.textContent = parts.days;
      values.hours.textContent = pad(parts.hours);
      values.minutes.textContent = pad(parts.minutes);
      if (parts.seconds !== prevSeconds) {
        values.seconds.textContent = pad(parts.seconds);
        values.seconds.classList.add("tick-flash");
        requestAnimationFrame(() => values.seconds.classList.remove("tick-flash"));
        if (document.body.dataset.mood === "impact") {
          clockWrap.classList.remove("heartbeat");
          void clockWrap.offsetWidth;
          clockWrap.classList.add("heartbeat");
        }
        prevSeconds = parts.seconds;
      }
    }
    function animate() {
      updateRings(remainingParts(new Date(), target), new Date());
      requestAnimationFrame(animate);
    }
    updateDigits(new Date());
    updateWidgetSnapshot();
    setInterval(() => updateDigits(new Date()), 1000);
    setInterval(updateWidgetSnapshot, 60_000);
    requestAnimationFrame(animate);
  }

  init().catch((err) => initError(`Startup error: ${err.message || err}`));
})();

