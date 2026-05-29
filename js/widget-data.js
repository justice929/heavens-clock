import { computeLifeRange, loadSettings } from "./settings.js";

export const WIDGET_DATA_KEY = "memento-mori-widget";

/** Calendar breakdown aligned with the main clock (years → days → hours). */
export function remainingParts(from, to) {
  if (!(to > from)) return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
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

export function buildWidgetSnapshot({
  settings = loadSettings(),
  locale = "en",
  quote = "",
  labels = {},
  theme = "calm",
} = {}) {
  const { birth, target, timeZone } = computeLifeRange(settings);
  const now = new Date();
  const total = target.getTime() - birth.getTime();
  const left = target.getTime() - now.getTime();
  const lifeRatio = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const parts = remainingParts(now, target);

  return {
    version: 2,
    updatedAt: now.toISOString(),
    locale,
    theme,
    quote,
    labels,
    timeZone,
    birthAt: birth.toISOString(),
    targetAt: target.toISOString(),
    lifespanYears: Number(settings.lifespanYears || 80),
    yearsLeft: parts.years,
    daysLeft: parts.days,
    hoursLeft: parts.hours,
    percentLeft: Number((lifeRatio * 100).toFixed(2)),
  };
}

export function saveWidgetSnapshot(snapshot) {
  try {
    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(snapshot));
  } catch (_) {}

  window.HeavensClockBridge?.saveWidgetSnapshot?.(JSON.stringify(snapshot));
}
