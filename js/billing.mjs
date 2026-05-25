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

/**
 * Google Play product identifiers.
 *
 * These IDs must be created EXACTLY the same in Play Console:
 *   Yearly  → 구독 (subscription), Base plan ID below
 *   Lifetime → 인앱 상품 (non-consumable)
 *
 * Renaming requires updates here, premium.html data-product attrs,
 * premium-bundle.js PRODUCT_IDS, and docs/android-play-billing.md.
 */
export const PRODUCT_IDS = {
  yearlyPremium: "heavens_clock_yearly_premium",
  lifetimePremium: "heavens_clock_lifetime_premium",
};

/**
 * Base plan / offer identifiers for the subscription.
 * The cdv-purchase plugin picks the default offer automatically via
 * `product.getOffer()`, so these values are documentation only — but
 * Play Console MUST register the same base plan id for prices to load.
 */
export const BASE_PLAN_IDS = {
  yearlyPremium: "yearly-autorenew",
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
        try { transaction.finish(); } catch (_) {}
      })
      .finished(() => {
        syncEntitlementsFromStore();
        onProductsUpdated();
      })
      .receiptUpdated(() => {
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

function mapErrorCode(code) {
  if (code === ErrorCode.PAYMENT_CANCELLED) return "PAYMENT_CANCELLED";
  if (code === ErrorCode.PRODUCT_NOT_AVAILABLE) return "PRODUCT_NOT_AVAILABLE";
  if (
    code === ErrorCode.COMMUNICATION ||
    code === ErrorCode.CLOUD_SERVICE_NETWORK_CONNECTION_FAILED ||
    code === ErrorCode.LOAD ||
    code === ErrorCode.BAD_RESPONSE ||
    code === ErrorCode.REFRESH
  ) {
    return "NETWORK_ERROR";
  }
  if (
    code === ErrorCode.PAYMENT_INVALID ||
    code === ErrorCode.PAYMENT_NOT_ALLOWED ||
    code === ErrorCode.CLOUD_SERVICE_PERMISSION_DENIED ||
    code === ErrorCode.CLOUD_SERVICE_REVOKED
  ) {
    return "PAYMENT_NOT_ALLOWED";
  }
  if (code === ErrorCode.SUBSCRIPTIONS_NOT_AVAILABLE) {
    return "SUBSCRIPTIONS_NOT_AVAILABLE";
  }
  if (code === ErrorCode.VERIFICATION_FAILED || code === ErrorCode.INVALID_SIGNATURE) {
    return "VERIFICATION_FAILED";
  }
  return "PURCHASE_FAILED";
}

export async function purchaseProduct(productId) {
  if (!storeReady) {
    throw new Error("STORE_NOT_READY");
  }

  const product = store.get(productId);
  if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
  if (store.owned(productId)) {
    syncEntitlementsFromStore();
    throw new Error("ALREADY_OWNED");
  }

  const offer = product.getOffer?.();
  if (!offer) throw new Error("PRODUCT_NOT_AVAILABLE");

  const result = await offer.order();
  if (result?.isError) {
    throw new Error(mapErrorCode(result.code));
  }

  return syncEntitlementsFromStore();
}

export async function restorePurchases() {
  if (!storeReady) {
    throw new Error("STORE_NOT_READY");
  }

  try {
    await store.restorePurchases();
  } catch (err) {
    throw new Error(mapErrorCode(err?.code));
  }
  return syncEntitlementsFromStore();
}

export async function refreshEntitlements() {
  if (!storeReady) return getPlan();
  try {
    await store.update();
  } catch (_) {}
  return syncEntitlementsFromStore();
}

/** Remove local Premium flags (dev / test reset). */
export function revokeLocalEntitlements() {
  saveEntitlements({
    lifetimePremium: false,
    yearlyPremium: false,
    yearlyExpiresAt: null,
  });
  return "free";
}

/**
 * Print product/entitlement status to the console.
 * Run from chrome://inspect on a connected device:
 *   HeavensClockBilling.diagnose()
 */
export function diagnose() {
  const summary = {
    nativeStore: isNativeStoreAvailable(),
    storeReady,
    plan: getPlan(),
    entitlements: loadEntitlements(),
    products: {},
  };
  if (storeReady) {
    for (const [key, id] of Object.entries(PRODUCT_IDS)) {
      const product = store.get(id);
      summary.products[key] = product
        ? {
            id,
            title: product.title,
            owned: store.owned(id),
            canPurchase: product.canPurchase,
            priceLabel: getProductPriceLabel(id),
            offers: product.offers?.map((o) => o.id) || [],
          }
        : { id, registered: false };
    }
    summary.basePlanIds = BASE_PLAN_IDS;
  }
  console.table(summary.products);
  console.log("[billing] diagnose", summary);
  return summary;
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
