/**
 * Apply premium.* translations to locales/*.json from premium-translations.json
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "locales");
const translations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "premium-translations.json"), "utf8")
);

const enPremium = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8")).premium;
const requiredKeys = Object.keys(enPremium);

let updated = 0;
for (const [code, premium] of Object.entries(translations)) {
  const filePath = path.join(localesDir, `${code}.json`);
  if (!fs.existsSync(filePath)) {
    console.error("Missing locale file:", code);
    process.exit(1);
  }
  for (const key of requiredKeys) {
    if (!(key in premium)) {
      console.error(`Missing key ${key} in premium-translations for ${code}`);
      process.exit(1);
    }
  }
  const locale = JSON.parse(fs.readFileSync(filePath, "utf8"));
  locale.premium = { ...premium };
  fs.writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`);
  updated += 1;
  console.log("premium →", code);
}

console.log(`Applied premium translations to ${updated} locale file(s).`);
