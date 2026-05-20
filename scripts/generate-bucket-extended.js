/**
 * Generates bucketExtended block for all locales/*.json
 * Run: node scripts/generate-bucket-extended.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "locales");

const EN = {
  page: {
    back: "← Clock",
    kicker: "Memento Mori Practice",
    intro:
      "Do not try to write 100 things at once. Answer one question, borrow one good example, and slowly collect the life you do not want to postpone.",
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
  categories: {
    family: "Family",
    travel: "Travel",
    learning: "Learning",
    courage: "Courage",
    health: "Health",
    creation: "Creation",
    spirit: "Spirit",
  },
  prompts: {
    beforeLate: "What do you want to do before it is too late?",
    gratitude: "Who do you want to thank while you still can?",
    place: "Is there a place you must visit before you die?",
    learn: "If money were not the issue, what would you learn?",
    apology: "Is there an apology or reconciliation you have postponed?",
    body: "What do you want to do for your body?",
    memory: "What scene do you want to leave with someone you love?",
  },
  suggestions: {
    family_phone_free: "Spend a full day with my parents without phones",
    family_photo: "Take a proper family photo and frame it",
    family_letter: "Write a handwritten letter to someone I am grateful for",
    travel_city_week: "Live for one week in the city I keep saying I will visit someday",
    travel_dawn_train: "Take a dawn train alone to see an unfamiliar sea",
    travel_meaningful_place: "Return to a place that means something to me",
    learning_instrument: "Start one instrument I have wanted to learn for years",
    learning_language_letter: "Study until I can write a short letter in another language",
    learning_books: "Reread 10 books that changed my life",
    courage_apology: "Deliver the apology I have postponed",
    courage_public_start: "Share even a small start on the thing fear kept me from beginning",
    courage_release_regret: "Name the regret that held me for too long and let it go",
    health_walk_100: "Walk for 100 days in a way my body will thank me for",
    health_checkup: "Book the health checkup I have been delaying",
    health_sleep_month: "Live one month without sacrificing sleep",
    creation_finish_work: "Finish one small work under my own name",
    creation_record_year: "Record this year of my life through photos, writing, or video",
    creation_teach: "Teach someone something I know",
    spirit_no_proving: "Spend one day proving nothing to anyone",
    spirit_values: "Write down the five values that truly matter to me",
    spirit_end_today: "Imagine the end of my life in a quiet place and choose today again",
  },
};

/** Per-locale overrides (full bucketExtended). Missing keys fall back to EN. */
const LOCALES = {
  ko: {
    page: {
      back: "← 시계",
      kicker: "Memento Mori Practice",
      intro:
        "처음부터 100개를 쓰려고 하지 마세요. 질문 하나에 답하고, 좋은 예시를 눌러 담고, 오늘 미루지 않을 삶을 조금씩 모으면 됩니다.",
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
    categories: { family: "가족", travel: "여행", learning: "배움", courage: "용기", health: "건강", creation: "창작", spirit: "정신" },
    prompts: {
      beforeLate: "무엇을 더 늦기 전에 하고 싶나요?",
      gratitude: "누구에게 고맙다고 말하고 싶나요?",
      place: "죽기 전에 꼭 가보고 싶은 장소가 있나요?",
      learn: "돈이 문제가 아니라면 배우고 싶은 것은?",
      apology: "오래 미뤄둔 사과나 화해가 있나요?",
      body: "내 몸을 위해 꼭 해주고 싶은 일은 무엇인가요?",
      memory: "사랑하는 사람과 함께 남기고 싶은 장면은 무엇인가요?",
    },
    suggestions: {
      family_phone_free: "부모님과 하루 종일 휴대폰 없이 시간을 보내기",
      family_photo: "가족사진을 제대로 찍고 액자로 남기기",
      family_letter: "고마웠던 사람에게 손편지 쓰기",
      travel_city_week: "언젠가만 말하던 도시에서 일주일 살아보기",
      travel_dawn_train: "혼자 새벽 기차를 타고 낯선 바다 보러 가기",
      travel_meaningful_place: "나에게 의미 있는 장소를 다시 찾아가기",
      learning_instrument: "오랫동안 배우고 싶었던 악기 하나 시작하기",
      learning_language_letter: "외국어로 짧은 편지를 쓸 수 있을 만큼 공부하기",
      learning_books: "내 인생을 바꾼 책 10권을 다시 읽기",
      courage_apology: "미뤄둔 사과를 직접 전하기",
      courage_public_start: "두려워서 시작하지 못한 일을 작게라도 공개하기",
      courage_release_regret: "나를 오래 붙잡던 후회를 한 문장으로 정리하고 놓아주기",
      health_walk_100: "내 몸이 고마워할 만큼 100일 걷기",
      health_checkup: "건강검진을 미루지 않고 예약하기",
      health_sleep_month: "잠을 희생하지 않는 한 달을 보내기",
      creation_finish_work: "내 이름으로 작은 작품 하나 완성하기",
      creation_record_year: "사진, 글, 영상으로 올해의 삶을 기록하기",
      creation_teach: "내가 아는 것을 누군가에게 가르쳐보기",
      spirit_no_proving: "하루 동안 아무것도 증명하지 않고 살아보기",
      spirit_values: "나에게 정말 중요한 가치 5개를 적어보기",
      spirit_end_today: "조용한 곳에서 내 삶의 끝을 상상하고 오늘을 다시 정하기",
    },
  },
  ja: {
    page: {
      back: "← 時計",
      kicker: "Memento Mori Practice",
      intro: "いきなり100個書こうとしないでください。問いに答え、良い例を借り、先延ばしにしたくない人生を少しずつ集めましょう。",
      writeTitle: "自分で書く",
      inputPlaceholder: "例：両親と先延ばしにしていた旅行に行く",
      addToLife: "人生に追加",
      promptsTitle: "書かせる問い",
      suggestionsTitle: "質の高い例",
      myList: "バケットリスト",
      emptyPage: "まだありません。問いか例をタップして始めましょう。",
      all: "すべて",
      done: "完了",
      bucketLimit: "無料プランは3件までです。プレミアムを開きますか？",
    },
    categories: { family: "家族", travel: "旅", learning: "学び", courage: "勇気", health: "健康", creation: "創作", spirit: "精神" },
    prompts: {
      beforeLate: "手遅れになる前に何をしたいですか？",
      gratitude: "まだできるうちに誰に感謝を伝えたいですか？",
      place: "死ぬ前に必ず訪れたい場所はありますか？",
      learn: "お金が問題でなければ何を学びたいですか？",
      apology: "先延ばしにしている謝罪や和解はありますか？",
      body: "体のために必ずしたいことは何ですか？",
      memory: "愛する人と残したい思い出の場面は？",
    },
    suggestions: {
      family_phone_free: "両親とスマホなしで一日過ごす",
      family_photo: "家族写真をちゃんと撮って額に入れる",
      family_letter: "感謝する人に手紙を書く",
      travel_city_week: "いつか行くと言っていた街で一週間暮らす",
      travel_dawn_train: "一人で夜明けの電車に乗り知らない海を見る",
      travel_meaningful_place: "意味のある場所にもう一度戻る",
      learning_instrument: "ずっと学びたかった楽器を始める",
      learning_language_letter: "外国語で短い手紙が書けるまで勉強する",
      learning_books: "人生を変えた本10冊を読み直す",
      courage_apology: "先延ばしにした謝罪を伝える",
      courage_public_start: "怖くて始められなかったことを小さく共有する",
      courage_release_regret: "長く引きずった後悔を言葉にして手放す",
      health_walk_100: "体が喜ぶ100日間の散歩",
      health_checkup: "先延ばしの健康診断を予約する",
      health_sleep_month: "睡眠を犠牲にしない一ヶ月を送る",
      creation_finish_work: "自分の名前で小さな作品を一つ完成させる",
      creation_record_year: "写真・文章・動画で今年の人生を記録する",
      creation_teach: "自分の知っていることを誰かに教える",
      spirit_no_proving: "誰にも何も証明しない一日を生きる",
      spirit_values: "本当に大切な価値観を5つ書き出す",
      spirit_end_today: "静かな場所で人生の終わりを想像し、今日を選び直す",
    },
  },
};

// Load full translations from JSON file if present (generated batches)
const extraPath = path.join(__dirname, "bucket-extended-locales.json");
if (fs.existsSync(extraPath)) {
  Object.assign(LOCALES, JSON.parse(fs.readFileSync(extraPath, "utf8")));
}

function deepMerge(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base));
  const out = JSON.parse(JSON.stringify(base));
  for (const section of ["page", "categories", "prompts", "suggestions"]) {
    if (!override[section]) continue;
    out[section] = { ...out[section], ...override[section] };
  }
  return out;
}

const codes = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

for (const code of codes) {
  const filePath = path.join(localesDir, `${code}.json`);
  const locale = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const bucketExtended = code === "en" ? EN : deepMerge(EN, LOCALES[code]);
  locale.bucketExtended = bucketExtended;
  fs.writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`);
  console.log("bucketExtended →", code);
}

console.log("Done. Run node scripts/verify-i18n.js");
