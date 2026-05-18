const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "www");

const entries = [
  "index.html",
  "onboarding.html",
  "bucket.html",
  "manifest.webmanifest",
  "icon.svg",
  "assets",
  "js",
  "locales",
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

