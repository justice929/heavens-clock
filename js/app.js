import {
  loadSettings,
  computeLifeRange,
  formatTargetLabel,
} from "./settings.js";
import { loadLocale, t, applyI18n, getQuoteForToday, getLocale } from "./i18n.js";
import { buildWidgetSnapshot, saveWidgetSnapshot } from "./widget-data.js";
import { THEMES, loadTheme, saveTheme } from "./themes.js";
import {
  applyPurchase,
  canUseMood,
  FREE_LIMITS,
  getPremiumPlan,
  grantLifetimePremium,
  grantYearlyPremium,
  hasPremiumThemeAccess,
  hasPremiumWidgetAccess,
  isPremium,
  loadEntitlements,
  PRODUCT_IDS,
  revokePremium,
} from "./entitlements.js";

const settings = loadSettings();
if (!settings.onboardingComplete || !settings.birthDate) {
  window.location.replace("onboarding.html");
}

const { birth: LIFE_START, target: TARGET } = computeLifeRange(settings);
const MOOD_KEY = "heaven-clock-mood";
let entitlements = loadEntitlements();
document.body.classList.toggle("is-premium", isPremium(entitlements));

const RING_DEFS = [
  { key: "years", radius: 92, width: 2.8, max: () => Math.max(1, initialYears) },
  { key: "days", radius: 80, width: 2.4, max: () => 365 },
  { key: "hours", radius: 68, width: 2, max: () => 24 },
  { key: "minutes", radius: 56, width: 1.8, max: () => 60 },
  { key: "seconds", radius: 44, width: 1.6, max: () => 60 },
];

let initialYears = 0;
const ringEls = {};
const ringCirc = {};

const pctValue = document.getElementById("pct-value");
const caption = document.getElementById("caption");
const moodHint = document.getElementById("mood-hint");
const targetLabel = document.getElementById("target-label");
const dailyQuote = document.getElementById("daily-quote");
const clockWrap = document.getElementById("clock-wrap");
const editSettings = document.getElementById("edit-settings");
const themeSwitch = document.getElementById("theme-switch");
const tabs = [...document.querySelectorAll(".mood-switch button")];
const valueEls = Object.fromEntries(
  [...document.querySelectorAll(".unit-value")].map((el) => [el.dataset.key, el])
);

await loadLocale(settings.locale || "en");
applyI18n();
document.title = t("appTitle");
targetLabel.textContent = formatTargetLabel(TARGET, getLocale());
dailyQuote.textContent = getQuoteForToday();

tabs[0].textContent = t("mood.calm");
tabs[1].textContent = t("mood.impact");

function openPremiumPage() {
  const page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  window.location.href = `premium.html?return=${encodeURIComponent(page)}`;
}

function setTheme(id) {
  const requested = THEMES.find((item) => item.id === id) || THEMES[0];
  if (!hasPremiumThemeAccess(requested, entitlements)) {
    openPremiumPage();
    return;
  }
  const next = saveTheme(requested.id);
  const theme = THEMES.find((item) => item.id === next) || THEMES[0];
  document.body.dataset.theme = theme.id;
  themeSwitch?.querySelectorAll("button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.theme === theme.id ? "true" : "false");
  });
  updateWidgetSnapshot();
}

function buildThemeSwitcher() {
  if (!themeSwitch) return;
  themeSwitch.textContent = "";
  THEMES.forEach((theme) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-dot";
    btn.dataset.theme = theme.id;
    btn.style.setProperty("--theme-accent", theme.accent);
    const locked = !hasPremiumThemeAccess(theme, entitlements);
    btn.classList.toggle("locked", locked);
    btn.setAttribute("aria-label", locked ? `${theme.name} premium theme` : `${theme.name} theme`);
    btn.title = `${theme.name} (${theme.tier})`;
    btn.addEventListener("click", () => setTheme(theme.id));
    themeSwitch.appendChild(btn);
  });
}

(function buildRings() {
  const g = document.getElementById("rings");
  const NS = "http://www.w3.org/2000/svg";
  RING_DEFS.forEach(({ key, radius, width }) => {
    const track = document.createElementNS(NS, "circle");
    track.setAttribute("cx", "100");
    track.setAttribute("cy", "100");
    track.setAttribute("r", radius);
    track.setAttribute("stroke-width", width);
    track.setAttribute("class", "ring-track");

    const fill = document.createElementNS(NS, "circle");
    fill.setAttribute("cx", "100");
    fill.setAttribute("cy", "100");
    fill.setAttribute("r", radius);
    fill.setAttribute("stroke-width", width);
    fill.setAttribute("class", `ring-fill ring-${key}`);
    fill.id = `ring-${key}`;

    g.appendChild(track);
    g.appendChild(fill);
    ringEls[key] = fill;
    ringCirc[key] = 2 * Math.PI * radius;
    fill.style.strokeDasharray = ringCirc[key];
  });
})();

function setMood(mood) {
  if (!canUseMood(mood, entitlements)) {
    return;
  }
  document.body.dataset.mood = mood;
  tabs.forEach((btn) => {
    const on = btn.dataset.mood === mood;
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  caption.textContent = t("remaining");
  moodHint.textContent = t(`hint.${mood === "calm" ? "calm" : "impact"}`);
  try { localStorage.setItem(MOOD_KEY, mood); } catch (_) {}
  updateWidgetSnapshot();
}

tabs.forEach((btn) => {
  const locked = btn.dataset.mood === "impact" && !canUseMood("impact", entitlements);
  btn.classList.toggle("locked", locked);
  btn.addEventListener("click", () => setMood(btn.dataset.mood));
});
editSettings?.addEventListener("click", () => {
  window.location.href = "onboarding.html?edit=1";
});
document.getElementById("open-premium")?.addEventListener("click", openPremiumPage);

const savedMood = (() => { try { return localStorage.getItem(MOOD_KEY); } catch (_) { return null; } })();
buildThemeSwitcher();
const savedTheme = THEMES.find((theme) => theme.id === loadTheme()) || THEMES[0];
setTheme(hasPremiumThemeAccess(savedTheme, entitlements) ? savedTheme.id : FREE_LIMITS.themeId);
setMood(savedMood === "impact" && canUseMood("impact", entitlements) ? "impact" : "calm");

function pad(n) { return String(n).padStart(2, "0"); }

function remainingParts(from, to) {
  if (to <= from) return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  let cursor = new Date(from.getTime());
  let years = 0;
  while (true) {
    const next = new Date(cursor);
    next.setFullYear(next.getFullYear() + 1);
    if (next > to) break;
    years++;
    cursor = next;
  }
  let days = 0;
  while (true) {
    const next = new Date(cursor);
    next.setDate(next.getDate() + 1);
    if (next > to) break;
    days++;
    cursor = next;
  }
  const ms = to - cursor;
  return {
    years,
    days,
    hours: Math.floor(ms / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1_000),
  };
}

function lifeRatio(now) {
  const total = TARGET - LIFE_START;
  const left = TARGET - now;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, left / total));
}

function ringValue(key, parts, now) {
  if (key === "seconds") return parts.seconds + now.getMilliseconds() / 1000;
  return parts[key];
}

function updateRings(parts, now) {
  if (initialYears === 0) initialYears = Math.max(1, parts.years);
  RING_DEFS.forEach(({ key, max }) => {
    const cap = max();
    const val = ringValue(key, parts, now);
    const ratio = Math.max(0, Math.min(1, val / cap));
    ringEls[key].style.strokeDashoffset = ringCirc[key] * (1 - ratio);
  });
}

let prevSeconds = -1;

function pulseImpact() {
  if (document.body.dataset.mood !== "impact") return;
  clockWrap.classList.remove("heartbeat");
  void clockWrap.offsetWidth;
  clockWrap.classList.add("heartbeat");
}

function updateDigits(now) {
  const parts = remainingParts(now, TARGET);
  updateRings(parts, now);
  pctValue.textContent = (lifeRatio(now) * 100).toFixed(2);
  valueEls.years.textContent = parts.years;
  valueEls.days.textContent = parts.days;
  valueEls.hours.textContent = pad(parts.hours);
  valueEls.minutes.textContent = pad(parts.minutes);
  if (parts.seconds !== prevSeconds) {
    valueEls.seconds.textContent = pad(parts.seconds);
    valueEls.seconds.classList.add("tick-flash");
    requestAnimationFrame(() => valueEls.seconds.classList.remove("tick-flash"));
    pulseImpact();
    prevSeconds = parts.seconds;
  }
}

function updateWidgetSnapshot() {
  if (!hasPremiumWidgetAccess(entitlements)) return;
  const locale = getLocale();
  saveWidgetSnapshot(buildWidgetSnapshot({
    settings,
    locale,
    quote: dailyQuote.textContent,
    labels: {
      memento: t("mementoMori"),
      daysLeft: locale.startsWith("ko") ? "남은 일수" : locale.startsWith("en") ? "DAYS LEFT" : t("remaining"),
    },
    theme: document.body.dataset.theme || "void",
  }));
}

function animateRings() {
  const now = new Date();
  updateRings(remainingParts(now, TARGET), now);
  requestAnimationFrame(animateRings);
}

updateDigits(new Date());
updateWidgetSnapshot();
setInterval(() => updateDigits(new Date()), 1000);
setInterval(updateWidgetSnapshot, 60_000);
requestAnimationFrame(animateRings);

document.addEventListener("keydown", (e) => {
  if (e.key === "1") setMood("calm");
  if (e.key === "2" && canUseMood("impact", entitlements)) setMood("impact");
});

window.HeavensClockDev = {
  getPlan: () => getPremiumPlan(entitlements),
  isPremium: () => isPremium(entitlements),
  grantLifetime: () => {
    grantLifetimePremium();
    entitlements = loadEntitlements();
    document.body.classList.toggle("is-premium", true);
    buildThemeSwitcher();
    tabs.forEach((btn) => btn.classList.toggle("locked", btn.dataset.mood === "impact"));
    updateWidgetSnapshot();
  },
  grantYearly: (expiresAt) => {
    grantYearlyPremium(expiresAt);
    entitlements = loadEntitlements();
    document.body.classList.toggle("is-premium", true);
    buildThemeSwitcher();
    tabs.forEach((btn) => btn.classList.toggle("locked", false));
    updateWidgetSnapshot();
  },
  revoke: () => {
    revokePremium();
    entitlements = loadEntitlements();
    document.body.classList.remove("is-premium");
    setTheme(FREE_LIMITS.themeId);
    setMood("calm");
    buildThemeSwitcher();
    tabs.forEach((btn) => btn.classList.toggle("locked", btn.dataset.mood === "impact"));
    updateWidgetSnapshot();
  },
  applyPurchase,
  PRODUCT_IDS,
};
