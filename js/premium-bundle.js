(function () {
  const SETTINGS_KEY = "memento-mori-settings";
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";
  const PRODUCT_IDS = {
    yearlyPremium: "heavens_clock_yearly_premium",
    lifetimePremium: "heavens_clock_lifetime_premium",
  };

  let strings = {};
  let selectedProduct = "";
  let billingMode = "preview";

  const backLink = document.getElementById("back-link");
  const planStatus = document.getElementById("plan-status");
  const activePanel = document.getElementById("active-panel");
  const featuresPanel = document.getElementById("features-panel");
  const plansPanel = document.getElementById("plans-panel");
  const purchaseActions = document.getElementById("purchase-actions");
  const btnPurchase = document.getElementById("btn-purchase");
  const btnRestore = document.getElementById("btn-restore");
  const message = document.getElementById("message");
  const previewNote = document.getElementById("preview-note");
  const planButtons = [...document.querySelectorAll(".plan")];

  const billing = () => window.HeavensClockBilling;

  function loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
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

  function getPlan(entitlements) {
    if (entitlements.lifetimePremium) return "lifetime";
    if (entitlements.yearlyPremium && isPremium(entitlements)) return "yearly";
    return "free";
  }

  async function loadLocale(code) {
    const locale = code || "en";
    for (const candidate of [locale, "en"]) {
      try {
        const res = await fetch(`locales/${candidate}.json`);
        if (!res.ok) continue;
        strings = await res.json();
        document.documentElement.lang = candidate === "ko" ? "ko" : candidate.split("-")[0];
        document.title = `${t("premium.title")} - ${t("appTitle")}`;
        return;
      } catch (_) {}
    }
  }

  function t(key) {
    let value = strings;
    for (const part of key.split(".")) value = value?.[part];
    return typeof value === "string" ? value : key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.id === "preview-note") return;
      el.textContent = t(el.dataset.i18n);
    });
    updatePreviewNote();
  }

  function setMessage(key) {
    if (message) message.textContent = t(key);
  }

  function setBusy(busy) {
    if (btnPurchase) btnPurchase.disabled = busy || !selectedProduct;
    if (btnRestore) btnRestore.disabled = busy;
    planButtons.forEach((btn) => {
      btn.disabled = busy;
    });
  }

  function returnUrl() {
    const params = new URLSearchParams(location.search);
    const target = params.get("return") || "index.html";
    return target.includes("://") ? "index.html" : target;
  }

  function updatePreviewNote() {
    if (!previewNote) return;
    previewNote.textContent =
      billingMode === "store" ? t("premium.storeNote") : t("premium.previewNote");
  }

  function updateStorePrices() {
    const api = billing();
    if (billingMode !== "store" || !api?.getProductPriceLabel) return;

    const yearlyPrice = api.getProductPriceLabel(PRODUCT_IDS.yearlyPremium);
    const lifetimePrice = api.getProductPriceLabel(PRODUCT_IDS.lifetimePremium);

    const yearlyEl = document.querySelector("#plan-yearly .plan-price");
    const lifetimeEl = document.querySelector("#plan-lifetime .plan-price");
    if (yearlyEl && yearlyPrice) yearlyEl.textContent = yearlyPrice;
    if (lifetimeEl && lifetimePrice) lifetimeEl.textContent = lifetimePrice;
  }

  function updatePlanUi() {
    const entitlements = loadEntitlements();
    const plan = getPlan(entitlements);
    const premium = isPremium(entitlements);

    if (planStatus) {
      planStatus.textContent =
        plan === "lifetime"
          ? t("premium.lifetimePlan")
          : plan === "yearly"
            ? t("premium.yearlyPlan")
            : t("premium.freePlan");
    }

    if (premium) {
      activePanel?.classList.remove("hidden");
      featuresPanel?.classList.add("hidden");
      plansPanel?.classList.add("hidden");
      purchaseActions?.classList.add("hidden");
      if (btnPurchase) btnPurchase.disabled = true;
      return;
    }

    activePanel?.classList.add("hidden");
    featuresPanel?.classList.remove("hidden");
    plansPanel?.classList.remove("hidden");
    purchaseActions?.classList.remove("hidden");
    if (btnPurchase) btnPurchase.disabled = !selectedProduct;
  }

  function selectPlan(productId) {
    selectedProduct = productId;
    planButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.product === productId);
    });
    if (btnPurchase) btnPurchase.disabled = !productId;
  }

  function redirectAfterSuccess(plan) {
    setMessage(
      plan === "lifetime" ? "premium.purchaseLifetimeDone" : "premium.purchaseYearlyDone"
    );
    window.setTimeout(() => {
      location.href = returnUrl();
    }, 700);
  }

  planButtons.forEach((btn) => {
    btn.addEventListener("click", () => selectPlan(btn.dataset.product || ""));
  });

  btnPurchase?.addEventListener("click", async () => {
    if (!selectedProduct) return;

    setBusy(true);
    setMessage("premium.purchasePending");

    try {
      const api = billing();
      let plan;

      if (billingMode === "store" && api?.purchaseProduct) {
        plan = await api.purchaseProduct(selectedProduct);
      } else if (api?.applyLocalPurchase) {
        plan = api.applyLocalPurchase(selectedProduct);
      } else {
        throw new Error("BILLING_UNAVAILABLE");
      }

      updatePlanUi();
      redirectAfterSuccess(plan);
    } catch (err) {
      const code = err?.message || "";
      if (code === "PAYMENT_CANCELLED") {
        setMessage("premium.purchaseCancelled");
      } else if (code === "STORE_NOT_READY" || code === "BILLING_UNAVAILABLE") {
        setMessage("premium.billingUnavailable");
      } else {
        setMessage("premium.purchaseFailed");
      }
    } finally {
      setBusy(false);
    }
  });

  btnRestore?.addEventListener("click", async () => {
    setBusy(true);
    setMessage("premium.restorePending");

    try {
      const api = billing();
      let plan = getPlan(loadEntitlements());

      if (billingMode === "store" && api?.restorePurchases) {
        plan = await api.restorePurchases();
      }

      if (plan === "free") {
        setMessage("premium.restoreEmpty");
        updatePlanUi();
        return;
      }

      setMessage("premium.restoreFound");
      updatePlanUi();
      window.setTimeout(() => {
        location.href = returnUrl();
      }, 700);
    } catch (_) {
      setMessage("premium.restoreFailed");
    } finally {
      setBusy(false);
    }
  });

  async function init() {
    const settings = loadSettings();
    await loadLocale(settings.locale || "en");
    applyI18n();

    if (backLink) backLink.href = returnUrl();
    updatePlanUi();
    selectPlan(PRODUCT_IDS.yearlyPremium);

    const api = billing();
    if (api?.isNativeStoreAvailable?.()) {
      setMessage("premium.loadingStore");
      const result = await api.initStore({
        onProductsUpdated: () => {
          updateStorePrices();
          updatePlanUi();
        },
      });
      billingMode = result?.mode === "store" ? "store" : "preview";
    }

    updatePreviewNote();
    updateStorePrices();
    updatePlanUi();
    if (message) message.textContent = "";
  }

  init();
})();
