const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const SITE_LOCALES = [
  "en", "ko", "ja", "zh-Hans", "zh-Hant", "es", "fr", "de", "pt", "it",
  "ar", "hi", "ru", "vi", "th", "id", "tr", "nl", "pl",
];

/** Landing copy is fully translated for en/ko only; others use English until translated. */
function ensureSiteLocaleStubs() {
  const dir = path.join(root, "site", "locales");
  const enPath = path.join(dir, "en.json");
  if (!fs.existsSync(enPath)) return;
  const en = fs.readFileSync(enPath, "utf8");
  for (const code of SITE_LOCALES) {
    const target = path.join(dir, `${code}.json`);
    if (!fs.existsSync(target)) fs.writeFileSync(target, en);
  }
}

/** Sync landing phone mock + brand from clock app locale files. */
function enrichSiteLocalesFromApp() {
  const siteDir = path.join(root, "site", "locales");
  const appDir = path.join(root, "locales");
  const enSitePath = path.join(siteDir, "en.json");
  if (!fs.existsSync(enSitePath)) return;
  const enSite = JSON.parse(fs.readFileSync(enSitePath, "utf8"));

  for (const code of SITE_LOCALES) {
    if (code === "en" || code === "ko") continue;
    const appPath = path.join(appDir, `${code}.json`);
    const sitePath = path.join(siteDir, `${code}.json`);
    if (!fs.existsSync(appPath)) continue;
    const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
    const site = fs.existsSync(sitePath)
      ? JSON.parse(fs.readFileSync(sitePath, "utf8"))
      : { ...enSite };
    site.brand = app.appTitle || site.brand;
    site.meta = { ...site.meta, title: app.appTitle || site.meta?.title };
    site.mock = {
      appTitle: app.appTitle,
      caption: app.remaining,
      year: app.unit?.year,
      day: app.unit?.day,
      hour: app.unit?.hour,
      bucketTitle: app.bucket?.today,
      bucketText: app.bucket?.empty,
    };
    fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);
  }
}

execSync("node scripts/build-billing.js", { cwd: root, stdio: "inherit" });
ensureSiteLocaleStubs();
enrichSiteLocalesFromApp();
const out = path.join(root, "www");

const entries = [
  "index.html",
  "onboarding.html",
  "premium.html",
  "bucket.html",
  "manifest.webmanifest",
  "icon.svg",
  "assets",
  "js",
  "locales",
  "site",
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dst, child));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

for (const entry of entries) {
  const src = path.join(root, entry);
  const dst = path.join(out, entry);
  if (!fs.existsSync(src)) continue;
  copyRecursive(src, dst);
}

console.log(`Prepared web assets in ${out}`);

