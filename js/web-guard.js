/**
 * Web-only access gate: free users may view the marketing site only.
 * Native app (Capacitor) bypasses this guard.
 */
(function () {
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";
  const LANDING_PATH = "site/index.html";

  function isNativeApp() {
    try {
      if (window.HeavensClockBridge) return true;
      if (window.Capacitor?.isNativePlatform?.()) return true;
      const platform = window.Capacitor?.getPlatform?.();
      if (platform && platform !== "web") return true;
    } catch (_) {}
    return false;
  }

  function loadEntitlements() {
    try {
      const raw = localStorage.getItem(ENTITLEMENTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function isPremium(entitlements) {
    if (entitlements.lifetimePremium) return true;
    if (entitlements.yearlyPremium) {
      if (!entitlements.yearlyExpiresAt) return true;
      return new Date(entitlements.yearlyExpiresAt) > new Date();
    }
    if (entitlements.premiumThemes || entitlements.premiumWidgets) return true;
    return false;
  }

  function landingUrl() {
    return new URL(LANDING_PATH, window.location.href).href;
  }

  function isLandingPage() {
    return /\/site\/?(index\.html)?(\?|#|$)/i.test(window.location.pathname);
  }

  if (isNativeApp()) return;
  if (isPremium(loadEntitlements())) return;
  if (isLandingPage()) return;

  const target = landingUrl();
  if (window.location.href.split("#")[0] !== target.split("#")[0]) {
    window.location.replace(LANDING_PATH);
  }
})();
