const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "locales");
const codes = [
  "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
  "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
];

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMergeWithEnglish(english, localeStrings) {
  if (!english) return localeStrings || {};
  if (!localeStrings) return { ...english };
  const out = { ...english };
  for (const key of Object.keys(localeStrings)) {
    const lv = localeStrings[key];
    const ev = english[key];
    if (isPlainObject(lv) && isPlainObject(ev)) out[key] = deepMergeWithEnglish(ev, lv);
    else out[key] = lv;
  }
  return out;
}

function t(strings, key) {
  let value = strings;
  for (const part of key.split(".")) value = value?.[part];
  return typeof value === "string" ? value : key;
}

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
const enPremiumTitle = t(en, "premium.title");
const enPremiumSubtitle = t(en, "premium.subtitle");
const required = [
  "appTitle",
  "remaining",
  "premium.title",
  "premium.subtitle",
  "premium.continue",
  "premium.restore",
  "bucket.title",
  "onboarding.step1",
  "bucketExtended.page.intro",
  "bucketExtended.prompts.beforeLate",
  "bucketExtended.suggestions.family_phone_free",
];

let failed = 0;
for (const code of codes) {
  const raw = JSON.parse(fs.readFileSync(path.join(localesDir, `${code}.json`), "utf8"));
  const strings = code === "en" ? raw : deepMergeWithEnglish(en, raw);
  for (const key of required) {
    const value = t(strings, key);
    if (value === key || !value) {
      console.error(`FAIL ${code}: missing ${key}`);
      failed += 1;
    }
  }
  if (code !== "en") {
    const premiumTitle = t(strings, "premium.title");
    const premiumSubtitle = t(strings, "premium.subtitle");
    if (premiumTitle === enPremiumTitle && premiumSubtitle === enPremiumSubtitle) {
      console.error(`FAIL ${code}: premium still English (title/subtitle)`);
      failed += 1;
    }
    if (!raw.premium || Object.keys(raw.premium).length < Object.keys(en.premium).length) {
      console.error(`FAIL ${code}: premium block incomplete in locale file`);
      failed += 1;
    }
  }
  const appTitle = t(strings, "appTitle");
  if (code === "ja" && !appTitle.includes("時計")) {
    console.error(`FAIL ja: appTitle not Japanese: ${appTitle}`);
    failed += 1;
  }
  if (code === "ko" && !appTitle.includes("시계")) {
    console.error(`FAIL ko: appTitle not Korean: ${appTitle}`);
    failed += 1;
  }
  if (code === "ja") {
    const intro = t(strings, "bucketExtended.page.intro");
    if (!intro || intro === "bucketExtended.page.intro" || intro.startsWith("Do not try")) {
      console.error(`FAIL ja: bucket intro not Japanese: ${intro?.slice(0, 40)}`);
      failed += 1;
    }
  }
}

if (failed) {
  console.error(`\n${failed} i18n check(s) failed.`);
  process.exit(1);
}
console.log(`OK: ${codes.length} locales resolve required UI keys.`);
