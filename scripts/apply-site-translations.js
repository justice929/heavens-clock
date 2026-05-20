/**
 * Apply full site/locales/*.json from site-locales-translations.json + app mock sync.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site", "locales");
const appDir = path.join(root, "locales");

const SITE_LOCALES = [
  "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
  "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
];

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base));
  const out = JSON.parse(JSON.stringify(base));
  for (const key of Object.keys(override)) {
    if (isPlainObject(override[key]) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

function syncMockFromApp(site, app) {
  if (!app) return site;
  site.brand = app.appTitle || site.brand;
  if (!site.meta?.title || site.meta.title.endsWith("Live Today")) {
    const suffix = site.meta?.title?.includes(" - ") ? "" : " - Live Today";
    site.meta = { ...site.meta, title: `${app.appTitle}${suffix === " - Live Today" ? " - Live Today" : ""}` };
  }
  site.mock = {
    ...site.mock,
    appTitle: app.appTitle,
    caption: app.remaining,
    year: app.unit?.year,
    day: app.unit?.day,
    hour: app.unit?.hour,
    bucketTitle: app.bucket?.today,
    bucketText: app.bucket?.empty,
  };
  return site;
}

const en = JSON.parse(fs.readFileSync(path.join(siteDir, "en.json"), "utf8"));
const translationsPath = path.join(__dirname, "site-locales-translations.json");
if (!fs.existsSync(translationsPath)) {
  console.error("Missing site-locales-translations.json — run: node scripts/_gen-site-locales.mjs");
  process.exit(1);
}
const translations = JSON.parse(fs.readFileSync(translationsPath, "utf8"));

if (fs.existsSync(path.join(siteDir, "ko.json"))) {
  translations.ko = JSON.parse(fs.readFileSync(path.join(siteDir, "ko.json"), "utf8"));
}

for (const code of SITE_LOCALES) {
  let site =
    code === "en"
      ? JSON.parse(JSON.stringify(en))
      : deepMerge(en, translations[code] || {});

  const appPath = path.join(appDir, `${code}.json`);
  if (fs.existsSync(appPath)) {
    site = syncMockFromApp(site, JSON.parse(fs.readFileSync(appPath, "utf8")));
  }

  fs.writeFileSync(path.join(siteDir, `${code}.json`), `${JSON.stringify(site, null, 2)}\n`);
  console.log("site locale →", code);
}

console.log("Applied site translations.");
