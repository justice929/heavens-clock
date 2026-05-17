export const PRODUCT_IDS = {
  premiumThemePack: "heavens_clock_theme_pack_01",
  premiumWidgetPack: "heavens_clock_widget_pack_01",
  lifetimePremium: "heavens_clock_lifetime_premium",
};

export const ENTITLEMENTS_KEY = "heavens-clock-entitlements";

export const DEFAULT_ENTITLEMENTS = {
  premiumThemes: false,
  premiumWidgets: false,
  lifetimePremium: false,
};

export function loadEntitlements() {
  try {
    const raw = localStorage.getItem(ENTITLEMENTS_KEY);
    return raw ? { ...DEFAULT_ENTITLEMENTS, ...JSON.parse(raw) } : DEFAULT_ENTITLEMENTS;
  } catch {
    return DEFAULT_ENTITLEMENTS;
  }
}

export function hasPremiumThemeAccess(theme, entitlements = loadEntitlements()) {
  if (theme?.tier !== "premium") return true;
  return entitlements.premiumThemes || entitlements.lifetimePremium;
}

export function hasPremiumWidgetAccess(entitlements = loadEntitlements()) {
  return entitlements.premiumWidgets || entitlements.lifetimePremium;
}

