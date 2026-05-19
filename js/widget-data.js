import { computeLifeRange, loadSettings } from "./settings.js";

export const WIDGET_DATA_KEY = "memento-mori-widget";

function wholeDaysLeft(target, now = new Date()) {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
}

function hoursLeftToday(target, now = new Date()) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  return Math.floor((ms % 86_400_000) / 3_600_000);
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

  return {
    version: 1,
    updatedAt: now.toISOString(),
    locale,
    theme,
    quote,
    labels,
    timeZone,
    birthAt: birth.toISOString(),
    targetAt: target.toISOString(),
    lifespanYears: Number(settings.lifespanYears || 80),
    daysLeft: wholeDaysLeft(target, now),
    hoursLeftToday: hoursLeftToday(target, now),
    percentLeft: Number((lifeRatio * 100).toFixed(2)),
  };
}

export function saveWidgetSnapshot(snapshot) {
  try {
    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(snapshot));
  } catch (_) {}

  // Native Android/iOS wrappers can expose this bridge later to copy the same
  // snapshot into SharedPreferences/App Group storage for widgets.
  window.HeavensClockBridge?.saveWidgetSnapshot?.(JSON.stringify(snapshot));
}

