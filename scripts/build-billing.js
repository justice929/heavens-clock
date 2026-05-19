const esbuild = require("esbuild");
const path = require("path");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "js", "billing.mjs");
const outfile = path.join(root, "js", "billing-bundle.js");

esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    globalName: "HeavensClockBilling",
    outfile,
    platform: "browser",
    target: ["es2020"],
    logLevel: "info",
  })
  .then(() => {
    console.log(`Built ${path.relative(root, outfile)}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
