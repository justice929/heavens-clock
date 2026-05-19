(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const THEME_KEY = "heavens-clock-theme";
  const WIDGET_DATA_KEY = "memento-mori-widget";
  const MOOD_KEY = "heaven-clock-mood";
  const BUCKET_KEY = "heavens-clock-bucket-list";
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";

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

  const FREE_LIMITS = { bucketItems: 3, themeId: "void", moods: ["calm"] };
  const DEFAULT_ENTITLEMENTS = {
    yearlyPremium: false,
    lifetimePremium: false,
    yearlyExpiresAt: null,
  };

  const BUCKET_SUGGESTIONS = {
    family_phone_free: { en: "Spend a full day with my parents without phones", ko: "부모님과 하루 종일 휴대폰 없이 시간을 보내기" },
    family_photo: { en: "Take a proper family photo and frame it", ko: "가족사진을 제대로 찍고 액자로 남기기" },
    family_letter: { en: "Write a handwritten letter to someone I am grateful for", ko: "고마웠던 사람에게 손편지 쓰기" },
    travel_city_week: { en: "Live for one week in the city I keep saying I will visit someday", ko: "언젠가만 말하던 도시에서 일주일 살아보기" },
    travel_dawn_train: { en: "Take a dawn train alone to see an unfamiliar sea", ko: "혼자 새벽 기차를 타고 낯선 바다 보러 가기" },
    travel_meaningful_place: { en: "Return to a place that means something to me", ko: "나에게 의미 있는 장소를 다시 찾아가기" },
    learning_instrument: { en: "Start one instrument I have wanted to learn for years", ko: "오랫동안 배우고 싶었던 악기 하나 시작하기" },
    learning_language_letter: { en: "Study until I can write a short letter in another language", ko: "외국어로 짧은 편지를 쓸 수 있을 만큼 공부하기" },
    learning_books: { en: "Reread 10 books that changed my life", ko: "내 인생을 바꾼 책 10권을 다시 읽기" },
    courage_apology: { en: "Deliver the apology I have postponed", ko: "미뤄둔 사과를 직접 전하기" },
    courage_public_start: { en: "Share even a small start on the thing fear kept me from beginning", ko: "두려워서 시작하지 못한 일을 작게라도 공개하기" },
    courage_release_regret: { en: "Name the regret that held me for too long and let it go", ko: "나를 오래 붙잡던 후회를 한 문장으로 정리하고 놓아주기" },
    health_walk_100: { en: "Walk for 100 days in a way my body will thank me for", ko: "내 몸이 고마워할 만큼 100일 걷기" },
    health_checkup: { en: "Book the health checkup I have been delaying", ko: "건강검진을 미루지 않고 예약하기" },
    health_sleep_month: { en: "Live one month without sacrificing sleep", ko: "잠을 희생하지 않는 한 달을 보내기" },
    creation_finish_work: { en: "Finish one small work under my own name", ko: "내 이름으로 작은 작품 하나 완성하기" },
    creation_record_year: { en: "Record this year of my life through photos, writing, or video", ko: "사진, 글, 영상으로 올해의 삶을 기록하기" },
    creation_teach: { en: "Teach someone something I know", ko: "내가 아는 것을 누군가에게 가르쳐보기" },
    spirit_no_proving: { en: "Spend one day proving nothing to anyone", ko: "하루 동안 아무것도 증명하지 않고 살아보기" },
    spirit_values: { en: "Write down the five values that truly matter to me", ko: "나에게 정말 중요한 가치 5개를 적어보기" },
    spirit_end_today: { en: "Imagine the end of my life in a quiet place and choose today again", ko: "조용한 곳에서 내 삶의 끝을 상상하고 오늘을 다시 정하기" },
  };
  const LEGACY_BUCKET_TEXT_TO_KEY = Object.fromEntries(
    Object.entries(BUCKET_SUGGESTIONS).map(([key, text]) => [text.ko, key])
  );

  let strings = {};
  let currentLocale = "en";
  let initialYears = 0;
  const ringEls = {};
  const ringCirc = {};

  function detectTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (_) { return "UTC"; }
  }

  function detectLocale() {
    const lang = (navigator.language || "en").toLowerCase();
    const map = {
      ko: "ko", ja: "ja", zh: "zh-Hans", "zh-cn": "zh-Hans", "zh-tw": "zh-Hant", "zh-hk": "zh-Hant",
      es: "es", fr: "fr", de: "de", pt: "pt", it: "it", ar: "ar", hi: "hi", ru: "ru",
      vi: "vi", th: "th", id: "id", tr: "tr", nl: "nl", pl: "pl",
    };
    return map[lang] || map[lang.split("-")[0]] || "en";
  }

  function loadSettings() {
    const detected = { locale: detectLocale(), timeZone: detectTimeZone() };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
      return {
        ...settings,
        locale: settings.locale || detected.locale,
        timeZone: settings.timeZone || detected.timeZone,
      };
    } catch (_) {
      return { ...DEFAULT_SETTINGS, ...detected };
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

  function normalizeLocale(code) {
    const loader = window.HeavensClockLocaleLoader;
    if (loader?.normalize) return loader.normalize(code);
    return code || "en";
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function loadLocale(code) {
    const loader = window.HeavensClockLocaleLoader;
    if (!loader?.loadLocale) return;
    const loaded = await loader.loadLocale(code);
    strings = loaded.strings;
    currentLocale = loaded.locale;
  }

  function t(key) {
    let v = strings;
    for (const p of key.split(".")) v = v?.[p];
    return typeof v === "string" ? v : key;
  }

  function localizedBucketText(item) {
    const key = item.key || LEGACY_BUCKET_TEXT_TO_KEY[item.text];
    const suggestion = key ? BUCKET_SUGGESTIONS[key] : null;
    if (!suggestion) return item.text;
    return currentLocale === "ko" ? suggestion.ko : suggestion.en;
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
    const tag = window.HeavensClockLocaleLoader?.intlLocale(currentLocale) || "en";
    return new Intl.DateTimeFormat(tag, {
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

  function normalizeEntitlements(entitlements) {
    const next = { ...entitlements };
    if (next.premiumThemes || next.premiumWidgets) {
      next.lifetimePremium = Boolean(next.lifetimePremium || next.premiumThemes || next.premiumWidgets);
    }
    delete next.premiumThemes;
    delete next.premiumWidgets;
    return next;
  }

  function loadEntitlements() {
    try {
      const raw = localStorage.getItem(ENTITLEMENTS_KEY);
      if (!raw) return { ...DEFAULT_ENTITLEMENTS };
      return normalizeEntitlements({ ...DEFAULT_ENTITLEMENTS, ...JSON.parse(raw) });
    } catch (_) {
      return { ...DEFAULT_ENTITLEMENTS };
    }
  }

  function isPremium(entitlements) {
    if (entitlements.lifetimePremium) return true;
    if (entitlements.yearlyPremium) {
      if (!entitlements.yearlyExpiresAt) return true;
      return new Date(entitlements.yearlyExpiresAt) > new Date();
    }
    if (entitlements.premiumThemes || entitlements.premiumWidgets) return true;
    return false;
  }

  function hasPremiumThemeAccess(theme, entitlements) {
    if (theme?.tier !== "premium") return true;
    return isPremium(entitlements);
  }

  function canUseMood(mood, entitlements) {
    if (FREE_LIMITS.moods.includes(mood)) return true;
    return isPremium(entitlements);
  }

  function maxBucketItems(entitlements) {
    return isPremium(entitlements) ? Infinity : FREE_LIMITS.bucketItems;
  }

  function openPremiumPage() {
    const page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
    location.href = `premium.html?return=${encodeURIComponent(page)}`;
  }

  function saveEntitlementsLocal(patch) {
    const next = normalizeEntitlements({ ...loadEntitlements(), ...patch });
    localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(next));
    return next;
  }

  function getPremiumPlan(entitlements) {
    if (entitlements.lifetimePremium) return "lifetime";
    if (entitlements.yearlyPremium && isPremium(entitlements)) return "yearly";
    return "free";
  }

  function grantLifetimePremiumLocal() {
    return saveEntitlementsLocal({ lifetimePremium: true, yearlyPremium: false, yearlyExpiresAt: null });
  }

  function grantYearlyPremiumLocal(expiresAt) {
    const expiry = expiresAt || (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString();
    })();
    return saveEntitlementsLocal({ lifetimePremium: false, yearlyPremium: true, yearlyExpiresAt: expiry });
  }

  function revokePremiumLocal() {
    return saveEntitlementsLocal({ ...DEFAULT_ENTITLEMENTS });
  }

  function loadBucketItems(entitlements) {
    try {
      const items = JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]");
      if (!Array.isArray(items)) return [];
      const valid = items.filter((item) => item && typeof item.text === "string");
      const max = maxBucketItems(entitlements);
      return max === Infinity ? valid : valid.slice(0, max);
    } catch (_) {
      return [];
    }
  }

  function saveBucketItems(items, entitlements) {
    const max = maxBucketItems(entitlements);
    const next = max === Infinity ? items : items.slice(0, max);
    try { localStorage.setItem(BUCKET_KEY, JSON.stringify(next)); } catch (_) {}
  }

  function enforceBucketLimit(entitlements) {
    try {
      const raw = JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]");
      if (!Array.isArray(raw)) return;
      const max = maxBucketItems(entitlements);
      if (max === Infinity || raw.length <= max) return;
      localStorage.setItem(BUCKET_KEY, JSON.stringify(raw.slice(0, max)));
    } catch (_) {}
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
    let entitlements = loadEntitlements();
    enforceBucketLimit(entitlements);
    let bucketState = loadBucketItems(entitlements);
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
        labels: {
          memento: t("mementoMori"),
          daysLeft: currentLocale.startsWith("ko") ? "남은 일수" : currentLocale.startsWith("en") ? "DAYS LEFT" : t("remaining"),
        },
        timeZone: settings.timeZone || detectTimeZone(),
        birthAt: lifeStart.toISOString(),
        targetAt: target.toISOString(),
        lifespanYears: Number(settings.lifespanYears || 80),
        daysLeft: Math.max(0, Math.ceil((target - now) / 86_400_000)),
        hoursLeftToday: Math.floor((Math.max(0, target - now) % 86_400_000) / 3_600_000),
        percentLeft: Number(percentLeft.toFixed(2)),
      };
      try { localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(snapshot)); } catch (_) {}
      if (isPremium(entitlements)) {
        window.HeavensClockBridge?.saveWidgetSnapshot?.(JSON.stringify(snapshot));
      }
    }

    function setTheme(id) {
      const requested = THEMES.find((item) => item.id === id) || THEMES[0];
      if (!hasPremiumThemeAccess(requested, entitlements)) {
        openPremiumPage();
        return;
      }
      const next = saveTheme(requested.id);
      const theme = THEMES.find((item) => item.id === next) || THEMES[0];
      document.body.dataset.theme = theme.id;
      themeSwitch.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.theme === theme.id ? "true" : "false"));
      updateWidgetSnapshot();
    }

    function buildThemeSwitcher() {
      themeSwitch.textContent = "";
      THEMES.forEach((theme) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-dot";
        btn.dataset.theme = theme.id;
        btn.style.setProperty("--theme-accent", theme.accent);
        const locked = !hasPremiumThemeAccess(theme, entitlements);
        btn.classList.toggle("locked", locked);
        btn.setAttribute("aria-label", locked ? `${theme.name} premium theme` : `${theme.name} theme`);
        btn.title = `${theme.name} (${theme.tier})`;
        btn.addEventListener("click", () => setTheme(theme.id));
        themeSwitch.appendChild(btn);
      });
    }

    function syncMoodLocks() {
      tabs.forEach((btn) => {
        const locked = btn.dataset.mood === "impact" && !canUseMood("impact", entitlements);
        btn.classList.toggle("locked", locked);
      });
    }

    buildThemeSwitcher();

    function setMood(mood) {
      if (!canUseMood(mood, entitlements)) {
        openPremiumPage();
        return;
      }
      document.body.dataset.mood = mood;
      tabs.forEach((btn) => btn.setAttribute("aria-selected", btn.dataset.mood === mood ? "true" : "false"));
      caption.textContent = t("remaining");
      moodHint.textContent = t(`hint.${mood}`);
      try { localStorage.setItem(MOOD_KEY, mood); } catch (_) {}
      updateWidgetSnapshot();
    }

    tabs.forEach((btn) => btn.addEventListener("click", () => setMood(btn.dataset.mood)));
    syncMoodLocks();
    function refreshAppLocale() {
      document.title = t("appTitle");
      applyI18n();
      tabs[0].textContent = t("mood.calm");
      tabs[1].textContent = t("mood.impact");
      caption.textContent = t("remaining");
      moodHint.textContent = t(`hint.${document.body.dataset.mood || "calm"}`);
      quote.textContent = quoteForToday();
      targetLabel.textContent = formatTargetLabel(target);
      showBucketItem();
      updateWidgetSnapshot();
    }

    const langSelect = document.getElementById("app-language");
    if (langSelect && window.HeavensClockLocales?.fillLanguageSelect) {
      window.HeavensClockLocales.fillLanguageSelect(langSelect, settings.locale || currentLocale);
      langSelect.addEventListener("change", async () => {
        const next = normalizeLocale(langSelect.value);
        settings.locale = next;
        saveSettings(settings);
        await loadLocale(next);
        refreshAppLocale();
      });
    }

    document.getElementById("edit-settings")?.addEventListener("click", () => {
      location.href = "onboarding.html?edit=1";
    });
    document.getElementById("open-premium")?.addEventListener("click", openPremiumPage);
    document.body.classList.toggle("is-premium", isPremium(entitlements));
    const savedTheme = THEMES.find((theme) => theme.id === loadTheme()) || THEMES[0];
    setTheme(hasPremiumThemeAccess(savedTheme, entitlements) ? savedTheme.id : FREE_LIMITS.themeId);
    const savedMood = localStorage.getItem(MOOD_KEY);
    setMood(savedMood === "impact" && canUseMood("impact", entitlements) ? "impact" : "calm");

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
        bucketSpotlight.textContent = localizedBucketText(items[bucketIndex]);
        bucketSpotlight.classList.remove("swap");
      }, 220);
    }

    function syncAccessUI() {
      entitlements = loadEntitlements();
      document.body.classList.toggle("is-premium", isPremium(entitlements));
      buildThemeSwitcher();
      syncMoodLocks();
      bucketState = loadBucketItems(entitlements);
      showBucketItem();
      updateWidgetSnapshot();
    }

    window.HeavensClockDev = {
      getPlan: () => getPremiumPlan(entitlements),
      isPremium: () => isPremium(entitlements),
      grantLifetime: () => { entitlements = grantLifetimePremiumLocal(); syncAccessUI(); },
      grantYearly: (expiresAt) => { entitlements = grantYearlyPremiumLocal(expiresAt); syncAccessUI(); },
      revoke: () => {
        entitlements = revokePremiumLocal();
        setTheme(FREE_LIMITS.themeId);
        setMood("calm");
        syncAccessUI();
      },
      refresh: syncAccessUI,
    };

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
      pctValue.textContent = (lifeRatio(now) * 100).toFixed(1);
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

    async function refreshClockPage() {
      await loadLocale(settings.locale || currentLocale);
      refreshAppLocale();
      targetLabel.textContent = formatTargetLabel(target);
      updateDigits(new Date());
      updateWidgetSnapshot();
    }

    const mementoEl = document.querySelector(".brand-bar .memento");
    if (mementoEl) {
      mementoEl.setAttribute("aria-label", t("mementoMori"));
      let refreshing = false;
      mementoEl.addEventListener("click", (e) => {
        e.preventDefault();
        if (refreshing) return;
        refreshing = true;
        refreshClockPage()
          .catch(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("_r", String(Date.now()));
            window.location.replace(url.toString());
          })
          .finally(() => { refreshing = false; });
      });
    }
  }

  init().catch((err) => initError(`Startup error: ${err.message || err}`));
})();

