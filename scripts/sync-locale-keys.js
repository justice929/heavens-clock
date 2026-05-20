/**
 * Ensures every locales/*.json has premium + quotes from en when missing.
 * Run via prepare:web — does not overwrite existing translated keys.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dir = path.join(root, "locales");
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMergeWithEnglish(english, localeStrings) {
  if (!english) return localeStrings || {};
  if (!localeStrings) return JSON.parse(JSON.stringify(english));
  const out = { ...english };
  for (const key of Object.keys(localeStrings)) {
    const lv = localeStrings[key];
    const ev = english[key];
    if (isPlainObject(lv) && isPlainObject(ev)) out[key] = deepMergeWithEnglish(ev, lv);
    else out[key] = lv;
  }
  return out;
}

let updated = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  if (file === "en.json") continue;
  const p = path.join(dir, file);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const merged = deepMergeWithEnglish(en, raw);
  const next = JSON.stringify(merged, null, 2) + "\n";
  if (next !== fs.readFileSync(p, "utf8")) {
    fs.writeFileSync(p, next);
    updated += 1;
    console.log("synced", file);
  }
}
console.log(updated ? `Updated ${updated} locale file(s).` : "All locale files already in sync.");
