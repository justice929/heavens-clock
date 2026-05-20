const fs = require("fs");
const path = require("path");

const siteDir = path.join(__dirname, "..", "site", "locales");
const codes = [
  "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
  "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
];

function t(obj, key) {
  let v = obj;
  for (const p of key.split(".")) v = v?.[p];
  return typeof v === "string" ? v : "";
}

const en = JSON.parse(fs.readFileSync(path.join(siteDir, "en.json"), "utf8"));
const enHero = t(en, "hero.title");
const enLead = t(en, "app.lead");

let failed = 0;
for (const code of codes) {
  const site = JSON.parse(fs.readFileSync(path.join(siteDir, `${code}.json`), "utf8"));
  if (!t(site, "hero.title") || !t(site, "footer")) {
    console.error(`FAIL ${code}: missing hero.title or footer`);
    failed += 1;
  }
  if (code !== "en" && t(site, "hero.title") === enHero && t(site, "app.lead") === enLead) {
    console.error(`FAIL ${code}: marketing copy still English`);
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} site i18n check(s) failed.`);
  process.exit(1);
}
console.log(`OK: ${codes.length} site locales have translated marketing copy.`);
