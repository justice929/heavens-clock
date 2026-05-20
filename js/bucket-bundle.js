(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const BUCKET_KEY = "heavens-clock-bucket-list";
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";
  const PREMIUM_MAX_ITEMS = 100;
  const FREE_BUCKET_ITEMS = 3;

  const PROMPT_KEYS = [
    "beforeLate", "gratitude", "place", "learn", "apology", "body", "memory",
  ];
  const SUGGESTION_DEFS = [
    { key: "family_phone_free", category: "family" },
    { key: "family_photo", category: "family" },
    { key: "family_letter", category: "family" },
    { key: "travel_city_week", category: "travel" },
    { key: "travel_dawn_train", category: "travel" },
    { key: "travel_meaningful_place", category: "travel" },
    { key: "learning_instrument", category: "learning" },
    { key: "learning_language_letter", category: "learning" },
    { key: "learning_books", category: "learning" },
    { key: "courage_apology", category: "courage" },
    { key: "courage_public_start", category: "courage" },
    { key: "courage_release_regret", category: "courage" },
    { key: "health_walk_100", category: "health" },
    { key: "health_checkup", category: "health" },
    { key: "health_sleep_month", category: "health" },
    { key: "creation_finish_work", category: "creation" },
    { key: "creation_record_year", category: "creation" },
    { key: "creation_teach", category: "creation" },
    { key: "spirit_no_proving", category: "spirit" },
    { key: "spirit_values", category: "spirit" },
    { key: "spirit_end_today", category: "spirit" },
  ];
  const CATEGORY_IDS = ["family", "travel", "learning", "courage", "health", "creation", "spirit"];

  let strings = {};
  let bucketExt = {};
  let currentLocale = "en";
  let items = [];
  let activeCategory = "all";
  let legacyTextToKey = {};

  const input = document.getElementById("input");
  const form = document.getElementById("form");
  const count = document.getElementById("count");
  const promptWrap = document.getElementById("prompts");
  const filterWrap = document.getElementById("filters");
  const suggestionWrap = document.getElementById("suggestions");
  const itemWrap = document.getElementById("items");
  const empty = document.getElementById("empty");

  function t(key) {
    return window.HeavensClockLocaleLoader?.t(strings, key) ?? key;
  }

  function page(key) {
    return bucketExt.page?.[key] || window.HeavensClockLocaleLoader?.t(strings, `bucketExtended.page.${key}`) || key;
  }

  function categoryLabel(id) {
    return bucketExt.categories?.[id] || id;
  }

  function promptText(key) {
    return bucketExt.prompts?.[key] || key;
  }

  function suggestionText(key) {
    return bucketExt.suggestions?.[key] || key;
  }

  function rebuildLegacyMap() {
    legacyTextToKey = {};
    for (const [key, text] of Object.entries(bucketExt.suggestions || {})) {
      if (typeof text === "string" && text.trim()) legacyTextToKey[text] = key;
    }
  }

  function loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function loadEntitlements() {
    try {
      const raw = localStorage.getItem(ENTITLEMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
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

  function maxBucketItems() {
    return isPremium(loadEntitlements()) ? PREMIUM_MAX_ITEMS : FREE_BUCKET_ITEMS;
  }

  function saveEntitlementsLocal(patch) {
    const current = loadEntitlements();
    const next = { yearlyPremium: false, lifetimePremium: false, yearlyExpiresAt: null, ...current, ...patch };
    localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(next));
    return next;
  }

  async function loadLocale(code) {
    const loader = window.HeavensClockLocaleLoader;
    if (!loader?.loadLocale) return;
    const loaded = await loader.loadLocale(code);
    strings = loaded.strings;
    bucketExt = strings.bucketExtended || {};
    currentLocale = loaded.locale;
    rebuildLegacyMap();
    document.title = `${loader.t(strings, "bucket.title")} - ${loader.t(strings, "appTitle")}`;
  }

  function applyI18n() {
    window.HeavensClockLocaleLoader?.applyI18n(strings);
    document.querySelectorAll("[data-page-i18n]").forEach((el) => {
      el.textContent = page(el.dataset.pageI18n);
    });
    document.querySelectorAll("[data-page-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", page(el.dataset.pageI18nPlaceholder));
    });
  }

  function loadItems() {
    try {
      const parsed = JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]");
      const valid = Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.text === "string") : [];
      return valid.slice(0, maxBucketItems());
    } catch (_) {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(items.slice(0, maxBucketItems())));
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function displayItemText(item) {
    const key = item.key || legacyTextToKey[item.text];
    if (key && bucketExt.suggestions?.[key]) return suggestionText(key);
    return item.text;
  }

  function addItem(text, meta = {}) {
    const next = normalizeText(text);
    if (!next) return;
    const limit = maxBucketItems();
    if (items.length >= limit) {
      const returnTo = encodeURIComponent("bucket.html");
      if (confirm(page("bucketLimit"))) {
        location.href = `premium.html?return=${returnTo}`;
      }
      return;
    }
    const exists = items.some((item) => (meta.key && item.key === meta.key) || normalizeText(displayItemText(item)) === next);
    if (exists) return;
    items = [
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: next, key: meta.key || "", done: false },
      ...items,
    ].slice(0, limit);
    saveItems();
    renderItems();
  }

  function renderPrompts() {
    promptWrap.textContent = "";
    PROMPT_KEYS.forEach((key) => {
      const text = promptText(key);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt";
      button.textContent = text;
      button.addEventListener("click", () => {
        input.value = text.replace("?", " ").replace("？", " ");
        input.focus();
      });
      promptWrap.appendChild(button);
    });
  }

  function renderFilters() {
    const categories = [["all", page("all")], ...CATEGORY_IDS.map((id) => [id, categoryLabel(id)])];
    filterWrap.textContent = "";
    categories.forEach(([id, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter${activeCategory === id ? " active" : ""}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        activeCategory = id;
        renderFilters();
        renderSuggestions();
      });
      filterWrap.appendChild(button);
    });
  }

  function renderSuggestions() {
    suggestionWrap.textContent = "";
    SUGGESTION_DEFS.filter((item) => activeCategory === "all" || item.category === activeCategory).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion";
      button.innerHTML = `<strong>${categoryLabel(item.category)}</strong><span></span>`;
      button.querySelector("span").textContent = suggestionText(item.key);
      button.addEventListener("click", () => addItem(suggestionText(item.key), { key: item.key }));
      suggestionWrap.appendChild(button);
    });
  }

  function renderItems() {
    itemWrap.textContent = "";
    const completed = items.filter((item) => item.done).length;
    count.textContent = `${items.length}/${maxBucketItems()} · ${page("done")} ${completed}`;
    empty.style.display = items.length ? "none" : "block";

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `item${item.done ? " done" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!item.done;
      checkbox.addEventListener("change", () => {
        items = items.map((next) => (next.id === item.id ? { ...next, done: checkbox.checked } : next));
        saveItems();
        renderItems();
      });

      const text = document.createElement("div");
      text.className = "item-text";
      text.textContent = displayItemText(item);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        items = items.filter((next) => next.id !== item.id);
        saveItems();
        renderItems();
      });

      row.append(checkbox, text, remove);
      itemWrap.appendChild(row);
    });
  }

  async function refreshBucketUi() {
    applyI18n();
    renderPrompts();
    renderFilters();
    renderSuggestions();
    renderItems();
  }

  async function init() {
    const settings = loadSettings();
    await loadLocale(settings.locale || "en");
    items = loadItems();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addItem(input.value);
      input.value = "";
    });

    await refreshBucketUi();
  }

  window.HeavensClockDev = {
    getPlan: () => {
      const ent = loadEntitlements();
      if (ent.lifetimePremium) return "lifetime";
      if (isPremium(ent)) return "yearly";
      return "free";
    },
    grantLifetime: () => {
      saveEntitlementsLocal({ lifetimePremium: true, yearlyPremium: false, yearlyExpiresAt: null });
      items = loadItems();
      renderItems();
    },
    grantYearly: (expiresAt) => {
      const expiry = expiresAt || new Date(Date.now() + 365 * 86_400_000).toISOString();
      saveEntitlementsLocal({ lifetimePremium: false, yearlyPremium: true, yearlyExpiresAt: expiry });
      items = loadItems();
      renderItems();
    },
    revoke: () => {
      saveEntitlementsLocal({ lifetimePremium: false, yearlyPremium: false, yearlyExpiresAt: null });
      items = loadItems();
      renderItems();
    },
  };

  init();
})();
