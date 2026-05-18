(function () {
  const BUCKET_KEY = "heavens-clock-bucket-list";
  const MAX_ITEMS = 100;

  const prompts = [
    "무엇을 더 늦기 전에 하고 싶나요?",
    "누구에게 고맙다고 말하고 싶나요?",
    "죽기 전에 꼭 가보고 싶은 장소가 있나요?",
    "돈이 문제가 아니라면 배우고 싶은 것은?",
    "오래 미뤄둔 사과나 화해가 있나요?",
    "내 몸을 위해 꼭 해주고 싶은 일은 무엇인가요?",
    "사랑하는 사람과 함께 남기고 싶은 장면은 무엇인가요?",
  ];

  const suggestions = [
    { category: "family", label: "Family", text: "부모님과 하루 종일 휴대폰 없이 시간을 보내기" },
    { category: "family", label: "Family", text: "가족사진을 제대로 찍고 액자로 남기기" },
    { category: "family", label: "Family", text: "고마웠던 사람에게 손편지 쓰기" },
    { category: "travel", label: "Travel", text: "언젠가만 말하던 도시에서 일주일 살아보기" },
    { category: "travel", label: "Travel", text: "혼자 새벽 기차를 타고 낯선 바다 보러 가기" },
    { category: "travel", label: "Travel", text: "나에게 의미 있는 장소를 다시 찾아가기" },
    { category: "learning", label: "Learning", text: "오랫동안 배우고 싶었던 악기 하나 시작하기" },
    { category: "learning", label: "Learning", text: "외국어로 짧은 편지를 쓸 수 있을 만큼 공부하기" },
    { category: "learning", label: "Learning", text: "내 인생을 바꾼 책 10권을 다시 읽기" },
    { category: "courage", label: "Courage", text: "미뤄둔 사과를 직접 전하기" },
    { category: "courage", label: "Courage", text: "두려워서 시작하지 못한 일을 작게라도 공개하기" },
    { category: "courage", label: "Courage", text: "나를 오래 붙잡던 후회를 한 문장으로 정리하고 놓아주기" },
    { category: "health", label: "Health", text: "내 몸이 고마워할 만큼 100일 걷기" },
    { category: "health", label: "Health", text: "건강검진을 미루지 않고 예약하기" },
    { category: "health", label: "Health", text: "잠을 희생하지 않는 한 달을 보내기" },
    { category: "creation", label: "Creation", text: "내 이름으로 작은 작품 하나 완성하기" },
    { category: "creation", label: "Creation", text: "사진, 글, 영상으로 올해의 삶을 기록하기" },
    { category: "creation", label: "Creation", text: "내가 아는 것을 누군가에게 가르쳐보기" },
    { category: "spirit", label: "Spirit", text: "하루 동안 아무것도 증명하지 않고 살아보기" },
    { category: "spirit", label: "Spirit", text: "나에게 정말 중요한 가치 5개를 적어보기" },
    { category: "spirit", label: "Spirit", text: "조용한 곳에서 내 삶의 끝을 상상하고 오늘을 다시 정하기" },
  ];

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

  function loadItems() {
    try {
      const parsed = JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.text === "string").slice(0, MAX_ITEMS) : [];
    } catch (_) {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function addItem(text) {
    const next = normalizeText(text);
    if (!next) return;
    const exists = items.some((item) => item.text === next);
    if (exists) return;
    items = [
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: next, done: false },
      ...items,
    ].slice(0, MAX_ITEMS);
    saveItems();
    renderItems();
  }

  function renderPrompts() {
    promptWrap.textContent = "";
    prompts.forEach((text) => {
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
      ["all", "All"],
      ...Array.from(new Map(suggestions.map((item) => [item.category, item.label])).entries()),
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
        button.innerHTML = `<strong>${item.label}</strong><span></span>`;
        button.querySelector("span").textContent = item.text;
        button.addEventListener("click", () => addItem(item.text));
        suggestionWrap.appendChild(button);
      });
  }

  function renderItems() {
    itemWrap.textContent = "";
    const completed = items.filter((item) => item.done).length;
    count.textContent = `${items.length}/${MAX_ITEMS} · done ${completed}`;
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
      text.textContent = item.text;

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(input.value);
    input.value = "";
  });

  renderPrompts();
  renderFilters();
  renderSuggestions();
  renderItems();
})();
