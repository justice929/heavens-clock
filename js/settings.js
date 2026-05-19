const STORAGE_KEY = "memento-mori-settings";

export const DEFAULT_SETTINGS = {
  birthDate: "",
  birthTime: "00:00",
  lifespanYears: 80,
  timeZone: "",
  locale: "",
  onboardingComplete: false,
  purchased: false,
};

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function detectLocale() {
  const lang = (navigator.language || "en").toLowerCase();
  const map = {
    ko: "ko",
    ja: "ja",
    zh: "zh-Hans",
    "zh-cn": "zh-Hans",
    "zh-tw": "zh-Hant",
    "zh-hk": "zh-Hant",
    es: "es",
    fr: "fr",
    de: "de",
    pt: "pt",
    it: "it",
    ar: "ar",
    hi: "hi",
    ru: "ru",
    vi: "vi",
    th: "th",
    id: "id",
    tr: "tr",
    nl: "nl",
    pl: "pl",
  };
  if (map[lang]) return map[lang];
  const base = lang.split("-")[0];
  return map[base] || "en";
}

export function loadSettings() {
  const detected = {
    locale: detectLocale(),
    timeZone: detectTimeZone(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    return {
      ...settings,
      locale: settings.locale || detected.locale,
      timeZone: settings.timeZone || detected.timeZone,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, ...detected };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Local date+time in IANA timezone → UTC Date */
export function zonedLocalToUtc(dateStr, timeStr, timeZone) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  let utc = Date.UTC(y, mo - 1, d, h, mi, 0);
  for (let i = 0; i < 6; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .formatToParts(new Date(utc))
        .map((p) => [p.type, p.value])
    );
    const ly = Number(parts.year);
    const lm = Number(parts.month);
    const ld = Number(parts.day);
    const lh = Number(parts.hour);
    const lmin = Number(parts.minute);
    const diffMin = (y - ly) * 525600 + (mo - lm) * 43200 + (d - ld) * 1440 + (h - lh) * 60 + (mi - lmin);
    if (diffMin === 0) break;
    utc += diffMin * 60_000;
  }
  return new Date(utc);
}

export function computeLifeRange(settings) {
  const tz = settings.timeZone || detectTimeZone();
  if (!settings.birthDate) {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - Number(settings.lifespanYears || 80));
    const target = new Date(fallback);
    target.setFullYear(target.getFullYear() + Number(settings.lifespanYears || 80));
    return { birth: fallback, target, timeZone: tz };
  }
  const birth = zonedLocalToUtc(settings.birthDate, settings.birthTime, tz);
  const target = new Date(birth.getTime());
  target.setUTCFullYear(target.getUTCFullYear() + Number(settings.lifespanYears));
  return { birth, target, timeZone: tz };
}

export function formatTargetLabel(target, locale) {
  const loc = locale?.startsWith("ko") ? "ko-KR" : locale || "en";
  return new Intl.DateTimeFormat(loc, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  })
    .format(target)
    .replace(/\//g, ".")
    .replace(/\s/g, "");
}
