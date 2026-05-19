(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const BUCKET_KEY = "heavens-clock-bucket-list";
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";
  const PREMIUM_MAX_ITEMS = 100;
  const FREE_BUCKET_ITEMS = 3;

  const pageText = {
    en: {
      back: "← Clock",
      kicker: "Memento Mori Practice",
      intro: "Do not try to write 100 things at once. Answer one question, borrow one good example, and slowly collect the life you do not want to postpone.",
      writeTitle: "Write My Own",
      inputPlaceholder: "Example: Take the trip I postponed with my parents",
      addToLife: "Add to My Life",
      promptsTitle: "Questions That Make You Write",
      suggestionsTitle: "High-Quality Examples",
      myList: "My Bucket List",
      emptyPage: "No buckets yet. Tap a question or example to begin with one.",
      all: "All",
      done: "done",
      bucketLimit: "Free plan allows up to 3 bucket items. Open Premium to add more?",
    },
    ko: {
      back: "← 시계",
      kicker: "Memento Mori Practice",
      intro: "처음부터 100개를 쓰려고 하지 마세요. 질문 하나에 답하고, 좋은 예시를 눌러 담고, 오늘 미루지 않을 삶을 조금씩 모으면 됩니다.",
      writeTitle: "내가 직접 쓰기",
      inputPlaceholder: "예: 부모님과 오래 미뤄둔 여행을 가기",
      addToLife: "내 삶에 추가",
      promptsTitle: "쓰게 만드는 질문",
      suggestionsTitle: "고품질 예시",
      myList: "내 버킷리스트",
      emptyPage: "아직 등록된 버킷이 없습니다. 질문이나 예시를 눌러 하나부터 시작하세요.",
      all: "전체",
      done: "완료",
      bucketLimit: "무료 이용 시 버킷리스트는 3개까지입니다. 프리미엄 화면으로 이동할까요?",
    },
  };

  const categoryLabels = {
    family: { en: "Family", ko: "가족" },
    travel: { en: "Travel", ko: "여행" },
    learning: { en: "Learning", ko: "배움" },
    courage: { en: "Courage", ko: "용기" },
    health: { en: "Health", ko: "건강" },
    creation: { en: "Creation", ko: "창작" },
    spirit: { en: "Spirit", ko: "정신" },
  };

  const prompts = [
    { key: "beforeLate", text: { en: "What do you want to do before it is too late?", ko: "무엇을 더 늦기 전에 하고 싶나요?" } },
    { key: "gratitude", text: { en: "Who do you want to thank while you still can?", ko: "누구에게 고맙다고 말하고 싶나요?" } },
    { key: "place", text: { en: "Is there a place you must visit before you die?", ko: "죽기 전에 꼭 가보고 싶은 장소가 있나요?" } },
    { key: "learn", text: { en: "If money were not the issue, what would you learn?", ko: "돈이 문제가 아니라면 배우고 싶은 것은?" } },
    { key: "apology", text: { en: "Is there an apology or reconciliation you have postponed?", ko: "오래 미뤄둔 사과나 화해가 있나요?" } },
    { key: "body", text: { en: "What do you want to do for your body?", ko: "내 몸을 위해 꼭 해주고 싶은 일은 무엇인가요?" } },
    { key: "memory", text: { en: "What scene do you want to leave with someone you love?", ko: "사랑하는 사람과 함께 남기고 싶은 장면은 무엇인가요?" } },
  ];

  const suggestions = [
    { key: "family_phone_free", category: "family", text: { en: "Spend a full day with my parents without phones", ko: "부모님과 하루 종일 휴대폰 없이 시간을 보내기" } },
    { key: "family_photo", category: "family", text: { en: "Take a proper family photo and frame it", ko: "가족사진을 제대로 찍고 액자로 남기기" } },
    { key: "family_letter", category: "family", text: { en: "Write a handwritten letter to someone I am grateful for", ko: "고마웠던 사람에게 손편지 쓰기" } },
    { key: "travel_city_week", category: "travel", text: { en: "Live for one week in the city I keep saying I will visit someday", ko: "언젠가만 말하던 도시에서 일주일 살아보기" } },
    { key: "travel_dawn_train", category: "travel", text: { en: "Take a dawn train alone to see an unfamiliar sea", ko: "혼자 새벽 기차를 타고 낯선 바다 보러 가기" } },
    { key: "travel_meaningful_place", category: "travel", text: { en: "Return to a place that means something to me", ko: "나에게 의미 있는 장소를 다시 찾아가기" } },
    { key: "learning_instrument", category: "learning", text: { en: "Start one instrument I have wanted to learn for years", ko: "오랫동안 배우고 싶었던 악기 하나 시작하기" } },
    { key: "learning_language_letter", category: "learning", text: { en: "Study until I can write a short letter in another language", ko: "외국어로 짧은 편지를 쓸 수 있을 만큼 공부하기" } },
    { key: "learning_books", category: "learning", text: { en: "Reread 10 books that changed my life", ko: "내 인생을 바꾼 책 10권을 다시 읽기" } },
    { key: "courage_apology", category: "courage", text: { en: "Deliver the apology I have postponed", ko: "미뤄둔 사과를 직접 전하기" } },
    { key: "courage_public_start", category: "courage", text: { en: "Share even a small start on the thing fear kept me from beginning", ko: "두려워서 시작하지 못한 일을 작게라도 공개하기" } },
    { key: "courage_release_regret", category: "courage", text: { en: "Name the regret that held me for too long and let it go", ko: "나를 오래 붙잡던 후회를 한 문장으로 정리하고 놓아주기" } },
    { key: "health_walk_100", category: "health", text: { en: "Walk for 100 days in a way my body will thank me for", ko: "내 몸이 고마워할 만큼 100일 걷기" } },
    { key: "health_checkup", category: "health", text: { en: "Book the health checkup I have been delaying", ko: "건강검진을 미루지 않고 예약하기" } },
    { key: "health_sleep_month", category: "health", text: { en: "Live one month without sacrificing sleep", ko: "잠을 희생하지 않는 한 달을 보내기" } },
    { key: "creation_finish_work", category: "creation", text: { en: "Finish one small work under my own name", ko: "내 이름으로 작은 작품 하나 완성하기" } },
    { key: "creation_record_year", category: "creation", text: { en: "Record this year of my life through photos, writing, or video", ko: "사진, 글, 영상으로 올해의 삶을 기록하기" } },
    { key: "creation_teach", category: "creation", text: { en: "Teach someone something I know", ko: "내가 아는 것을 누군가에게 가르쳐보기" } },
    { key: "spirit_no_proving", category: "spirit", text: { en: "Spend one day proving nothing to anyone", ko: "하루 동안 아무것도 증명하지 않고 살아보기" } },
    { key: "spirit_values", category: "spirit", text: { en: "Write down the five values that truly matter to me", ko: "나에게 정말 중요한 가치 5개를 적어보기" } },
    { key: "spirit_end_today", category: "spirit", text: { en: "Imagine the end of my life in a quiet place and choose today again", ko: "조용한 곳에서 내 삶의 끝을 상상하고 오늘을 다시 정하기" } },
  ];

  const suggestionsByKey = Object.fromEntries(suggestions.map((item) => [item.key, item]));
  const legacyTextToKey = Object.fromEntries(suggestions.map((item) => [item.text.ko, item.key]));
  let strings = {};
  let currentLocale = "en";
  let items = loadItems();
  let activeCategory = "all";

  const input = document.getElementById("input");
  const form = document.getElementById("form");
  const count = document.getElementById("count");
  const promptWrap = document.getElementById("prompts");
  const filterWrap = document.getElementById("filters");
  const suggestionWrap = document.getElementById("suggestions");
  const itemWrap = document.getElementById("items");
  const empty = document.getElementById("empty");

  function localeBase() {
    return currentLocale === "ko" ? "ko" : "en";
  }

  function localize(value) {
    if (typeof value === "string") return value;
    return value?.[localeBase()] || value?.en || "";
  }

  function page(key) {
    return pageText[localeBase()]?.[key] || pageText.en[key] || key;
  }

  function t(key) {
    let value = strings;
    for (const part of key.split(".")) value = value?.[part];
    return typeof value === "string" ? value : key;
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
    const locale = code || "en";
    for (const candidate of [locale, "en"]) {
      try {
        const res = await fetch(`locales/${candidate}.json`);
        if (!res.ok) continue;
        strings = await res.json();
        currentLocale = candidate;
        document.documentElement.lang = candidate === "ko" ? "ko" : candidate.split("-")[0];
        document.documentElement.dir = candidate === "ar" ? "rtl" : "ltr";
        document.title = `${t("bucket.title")} - ${t("appTitle")}`;
        return;
      } catch (_) {}
    }
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
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
    return key && suggestionsByKey[key] ? localize(suggestionsByKey[key].text) : item.text;
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
    prompts.forEach((prompt) => {
      const text = localize(prompt.text);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt";
      button.textContent = text;
      button.addEventListener("click", () => {
        input.value = text.replace("?", " ");
        input.focus();
      });
      promptWrap.appendChild(button);
    });
  }

  function renderFilters() {
    const categories = [
      ["all", page("all")],
      ...Object.keys(categoryLabels).map((id) => [id, localize(categoryLabels[id])]),
    ];
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
    suggestions
      .filter((item) => activeCategory === "all" || item.category === activeCategory)
      .forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "suggestion";
        button.innerHTML = `<strong>${localize(categoryLabels[item.category])}</strong><span></span>`;
        button.querySelector("span").textContent = localize(item.text);
        button.addEventListener("click", () => addItem(localize(item.text), { key: item.key }));
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
        items = items.map((next) => next.id === item.id ? { ...next, done: checkbox.checked } : next);
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

  async function init() {
    const settings = loadSettings();
    await loadLocale(settings.locale || "en");
    applyI18n();
    items = loadItems();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      addItem(input.value);
      input.value = "";
    });

    renderPrompts();
    renderFilters();
    renderSuggestions();
    renderItems();
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
