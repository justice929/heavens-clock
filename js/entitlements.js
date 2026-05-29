/**
 * Heaven's Clock — product & entitlement rules (single source of truth).
 *
 * App free:  basic clock, bucket list up to 3 items
 * App paid:  everything (yearly subscription OR lifetime)
 * Web free:  landing page only
 * Web paid:  web clock + installable PWA on PC
 */

/** Google Play / App Store product identifiers */
export const PRODUCT_IDS = {
  yearlyPremium: "heavens_clock_yearly_premium",
  lifetimePremium: "heavens_clock_lifetime_premium",
};

/** Earlier experiment IDs — kept for migration only */
export const LEGACY_PRODUCT_IDS = {
  premiumThemePack: "heavens_clock_theme_pack_01",
  premiumWidgetPack: "heavens_clock_widget_pack_01",
};

export const ENTITLEMENTS_KEY = "heavens-clock-entitlements";

/** Hard limits for free users */
export const FREE_LIMITS = {
  bucketItems: 3,
  themeId: "void",
  moods: ["calm"],
};

/**
 * Feature matrix — documents what each plan may use.
 * Enforcement is implemented in tasks 2–5 via the helpers below.
 */
export const PLAN_ACCESS = {
  free: {
    app: {
      basicClock: true,
      premiumThemes: false,
      impactMood: false,
      homeWidget: false,
      bucketListMax: FREE_LIMITS.bucketItems,
    },
    web: {
      landingOnly: true,
      clock: false,
      pwaInstall: false,
    },
  },
  premium: {
    app: {
      basicClock: true,
      premiumThemes: true,
      impactMood: true,
      homeWidget: true,
      bucketListMax: Infinity,
    },
    web: {
      landingOnly: false,
      clock: true,
      pwaInstall: true,
    },
  },
};

export const DEFAULT_ENTITLEMENTS = {
  yearlyPremium: false,
  lifetimePremium: false,
  /** ISO-8601 end date for yearly subscription; null until billing sets it */
  yearlyExpiresAt: null,
};

export function isPremium(entitlements = loadEntitlements()) {
  if (entitlements.lifetimePremium) return true;

  if (entitlements.yearlyPremium) {
    if (!entitlements.yearlyExpiresAt) return true;
    return new Date(entitlements.yearlyExpiresAt) > new Date();
  }

  // Legacy flags from theme/widget pack experiments
  if (entitlements.premiumThemes || entitlements.premiumWidgets) return true;

  return false;
}

export function loadEntitlements() {
  try {
    const raw = localStorage.getItem(ENTITLEMENTS_KEY);
    if (!raw) return { ...DEFAULT_ENTITLEMENTS };
    return normalizeEntitlements({ ...DEFAULT_ENTITLEMENTS, ...JSON.parse(raw) });
  } catch {
    return { ...DEFAULT_ENTITLEMENTS };
  }
}

export function saveEntitlements(entitlements) {
  localStorage.setItem(
    ENTITLEMENTS_KEY,
    JSON.stringify(normalizeEntitlements({ ...DEFAULT_ENTITLEMENTS, ...entitlements }))
  );
}

function normalizeEntitlements(entitlements) {
  const next = { ...entitlements };

  if (next.premiumThemes || next.premiumWidgets) {
    next.lifetimePremium = Boolean(next.lifetimePremium || next.premiumThemes || next.premiumWidgets);
  }

  delete next.premiumThemes;
  delete next.premiumWidgets;

  return next;
}

// ——— App access ———

export function hasAppFullAccess(entitlements = loadEntitlements()) {
  return isPremium(entitlements);
}

export function maxBucketItems(entitlements = loadEntitlements()) {
  return isPremium(entitlements) ? Infinity : FREE_LIMITS.bucketItems;
}

export function hasPremiumThemeAccess(theme, entitlements = loadEntitlements()) {
  if (theme?.tier !== "premium") return true;
  return isPremium(entitlements);
}

export function canUseMood(mood, entitlements = loadEntitlements()) {
  if (FREE_LIMITS.moods.includes(mood)) return true;
  return isPremium(entitlements);
}

export function hasPremiumWidgetAccess(entitlements = loadEntitlements()) {
  return isPremium(entitlements);
}

// ——— Web access ———

export function hasWebClockAccess(entitlements = loadEntitlements()) {
  return isPremium(entitlements);
}

export function hasWebPwaAccess(entitlements = loadEntitlements()) {
  return isPremium(entitlements);
}

export function shouldShowWebLandingOnly(entitlements = loadEntitlements()) {
  return !isPremium(entitlements);
}

/** @returns {"free" | "yearly" | "lifetime"} */
export function getPremiumPlan(entitlements = loadEntitlements()) {
  if (entitlements.lifetimePremium) return "lifetime";
  if (entitlements.yearlyPremium && isPremium(entitlements)) return "yearly";
  return "free";
}

function oneYearFromNowIso() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

export function grantLifetimePremium() {
  saveEntitlements({
    lifetimePremium: true,
    yearlyPremium: false,
    yearlyExpiresAt: null,
  });
}

export function grantYearlyPremium(expiresAt = oneYearFromNowIso()) {
  saveEntitlements({
    lifetimePremium: false,
    yearlyPremium: true,
    yearlyExpiresAt: expiresAt,
  });
}

export function revokePremium() {
  saveEntitlements({ ...DEFAULT_ENTITLEMENTS });
}

/** Apply a store purchase to local entitlements (billing layer calls this). */
export function applyPurchase(productId) {
  if (productId === PRODUCT_IDS.lifetimePremium) {
    grantLifetimePremium();
    return getPremiumPlan();
  }
  if (productId === PRODUCT_IDS.yearlyPremium) {
    grantYearlyPremium();
    return getPremiumPlan();
  }
  return getPremiumPlan();
}
