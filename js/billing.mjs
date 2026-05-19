/**
 * Google Play / App Store billing bridge (Capacitor native only).
 * Bundled to js/billing-bundle.js for premium.html.
 */
import {
  store,
  ProductType,
  Platform,
  LogLevel,
  ErrorCode,
} from "capacitor-plugin-cdv-purchase";

export const PRODUCT_IDS = {
  yearlyPremium: "heavens_clock_yearly_premium",
  lifetimePremium: "heavens_clock_lifetime_premium",
};

const ENTITLEMENTS_KEY = "heavens-clock-entitlements";

let initPromise = null;
let storeReady = false;
let onProductsUpdated = () => {};

export function isNativeStoreAvailable() {
  try {
    return window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

function getStorePlatforms() {
  const platform = window.Capacitor?.getPlatform?.();
  if (platform === "android") return [Platform.GOOGLE_PLAY];
  if (platform === "ios") return [Platform.APPLE_APPSTORE];
  return [];
}

function loadEntitlements() {
  try {
    const raw = localStorage.getItem(ENTITLEMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEntitlements(patch) {
  const next = {
    yearlyPremium: false,
    lifetimePremium: false,
    yearlyExpiresAt: null,
    ...loadEntitlements(),
    ...patch,
  };
  delete next.premiumThemes;
  delete next.premiumWidgets;
  localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(next));
  return next;
}

function oneYearFromNowIso() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

function syncEntitlementsFromStore() {
  if (!storeReady) return getPlan();

  if (store.owned(PRODUCT_IDS.lifetimePremium)) {
    saveEntitlements({
      lifetimePremium: true,
      yearlyPremium: false,
      yearlyExpiresAt: null,
    });
    return "lifetime";
  }

  if (store.owned(PRODUCT_IDS.yearlyPremium)) {
    const product = store.get(PRODUCT_IDS.yearlyPremium);
    const purchase =
      (product &&
        (store.findInVerifiedReceipts(product) ??
          store.findInLocalReceipts(product))) ||
      null;
    const expiresAt =
      purchase?.expirationDate?.toISOString?.() || oneYearFromNowIso();
    saveEntitlements({
      lifetimePremium: false,
      yearlyPremium: true,
      yearlyExpiresAt: expiresAt,
    });
    return "yearly";
  }

  saveEntitlements({
    lifetimePremium: false,
    yearlyPremium: false,
    yearlyExpiresAt: null,
  });
  return "free";
}

export function getPlan() {
  const entitlements = loadEntitlements();
  if (entitlements.lifetimePremium) return "lifetime";
  if (entitlements.yearlyPremium) {
    if (!entitlements.yearlyExpiresAt) return "yearly";
    if (new Date(entitlements.yearlyExpiresAt) > new Date()) return "yearly";
  }
  return "free";
}

export function isPremium() {
  return getPlan() !== "free";
}

export function getProductPriceLabel(productId) {
  if (!storeReady) return null;
  const product = store.get(productId);
  const offer = product?.getOffer?.();
  if (!offer) return null;
  const phase = offer.pricingPhases?.[0] || offer.pricing;
  return phase?.price || null;
}

/**
 * @param {{ onProductsUpdated?: () => void }} options
 * @returns {Promise<{ mode: 'store' | 'preview' }>}
 */
export async function initStore(options = {}) {
  onProductsUpdated = options.onProductsUpdated || (() => {});

  if (!isNativeStoreAvailable()) {
    return { mode: "preview" };
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const platforms = getStorePlatforms();
    if (!platforms.length) return { mode: "preview" };

    store.verbosity = LogLevel.WARNING;

    store.register([
      {
        id: PRODUCT_IDS.yearlyPremium,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.lifetimePremium,
        type: ProductType.NON_CONSUMABLE,
        platform: Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.yearlyPremium,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.APPLE_APPSTORE,
      },
      {
        id: PRODUCT_IDS.lifetimePremium,
        type: ProductType.NON_CONSUMABLE,
        platform: Platform.APPLE_APPSTORE,
      },
    ]);

    store.when()
      .productUpdated(() => onProductsUpdated())
      .approved((transaction) => {
        syncEntitlementsFromStore();
        transaction.finish();
      })
      .finished(() => {
        syncEntitlementsFromStore();
        onProductsUpdated();
      });

    store.error((error) => {
      if (error.code === ErrorCode.PAYMENT_CANCELLED) return;
      console.warn("[billing] store error", error.code, error.message);
    });

    await store.initialize(platforms);
    storeReady = true;
    syncEntitlementsFromStore();
    onProductsUpdated();
    return { mode: "store" };
  })().catch((err) => {
    console.warn("[billing] init failed", err);
    initPromise = null;
    storeReady = false;
    return { mode: "preview" };
  });

  return initPromise;
}

export async function purchaseProduct(productId) {
  if (!storeReady) {
    throw new Error("STORE_NOT_READY");
  }

  const product = store.get(productId);
  const offer = product?.getOffer?.();
  if (!offer) throw new Error("PRODUCT_NOT_FOUND");

  const result = await offer.order();
  if (result?.isError) {
    if (result.code === ErrorCode.PAYMENT_CANCELLED) {
      throw new Error("PAYMENT_CANCELLED");
    }
    throw new Error(result.message || "PURCHASE_FAILED");
  }

  return syncEntitlementsFromStore();
}

export async function restorePurchases() {
  if (!storeReady) {
    throw new Error("STORE_NOT_READY");
  }

  await store.restorePurchases();
  return syncEntitlementsFromStore();
}

/** Local-only grant for web preview / dev (no Play Billing). */
export function applyLocalPurchase(productId) {
  if (productId === PRODUCT_IDS.lifetimePremium) {
    saveEntitlements({
      lifetimePremium: true,
      yearlyPremium: false,
      yearlyExpiresAt: null,
    });
    return "lifetime";
  }
  if (productId === PRODUCT_IDS.yearlyPremium) {
    saveEntitlements({
      lifetimePremium: false,
      yearlyPremium: true,
      yearlyExpiresAt: oneYearFromNowIso(),
    });
    return "yearly";
  }
  return getPlan();
}
