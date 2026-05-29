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
  const testPanel = document.getElementById("test-panel");
  const btnTestLifetime = document.getElementById("btn-test-lifetime");
  const btnTestYearly = document.getElementById("btn-test-yearly");
  const btnTestRevoke = document.getElementById("btn-test-revoke");
  const planButtons = [...document.querySelectorAll(".plan")];

  const billing = () => window.HeavensClockBilling;

  function isBillingTestMode() {
    const params = new URLSearchParams(location.search);
    if (params.get("test") === "1" || params.get("dev") === "1") return true;
    try {
      return localStorage.getItem("heavens-clock-billing-test") === "1";
    } catch (_) {
      return false;
    }
  }

  function enableBillingTestMode() {
    try {
      localStorage.setItem("heavens-clock-billing-test", "1");
    } catch (_) {}
  }

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
    const loader = window.HeavensClockLocaleLoader;
    if (!loader?.loadLocale) return;
    const loaded = await loader.loadLocale(code);
    strings = loaded.strings;
    document.title = `${loader.t(strings, "premium.title")} - ${loader.t(strings, "appTitle")}`;
  }

  function t(key) {
    return window.HeavensClockLocaleLoader?.t(strings, key) ?? key;
  }

  function applyI18n() {
    const loader = window.HeavensClockLocaleLoader;
    if (!loader) return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.id === "preview-note") return;
      el.textContent = loader.t(strings, el.dataset.i18n);
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

  function updateTestPanelVisibility() {
    if (!testPanel) return;
    const show = billingMode === "preview" || isBillingTestMode();
    testPanel.classList.toggle("hidden", !show);
  }

  function applyTestPurchase(productId) {
    const api = billing();
    if (!api?.applyLocalPurchase) throw new Error("BILLING_UNAVAILABLE");
    return api.applyLocalPurchase(productId);
  }

  function applyTestRevoke() {
    const api = billing();
    if (api?.revokeLocalEntitlements) return api.revokeLocalEntitlements();
    localStorage.setItem(
      ENTITLEMENTS_KEY,
      JSON.stringify({ yearlyPremium: false, lifetimePremium: false, yearlyExpiresAt: null })
    );
    return "free";
  }

  function applyPlanPricesFromLocale() {
    const yearlyEl = document.querySelector("#plan-yearly .plan-price");
    const lifetimeEl = document.querySelector("#plan-lifetime .plan-price");
    if (yearlyEl) yearlyEl.textContent = t("premium.yearlyPrice");
    if (lifetimeEl) lifetimeEl.textContent = t("premium.lifetimePrice");
  }

  function updateStorePrices() {
    // UI price labels are fixed to locale strings (USD-based copy),
    // regardless of Play billing country currency returned by store APIs.
    applyPlanPricesFromLocale();
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
      const map = {
        PAYMENT_CANCELLED: "premium.purchaseCancelled",
        STORE_NOT_READY: "premium.billingUnavailable",
        BILLING_UNAVAILABLE: "premium.billingUnavailable",
        SUBSCRIPTIONS_NOT_AVAILABLE: "premium.billingUnavailable",
        PRODUCT_NOT_AVAILABLE: "premium.productNotAvailable",
        NETWORK_ERROR: "premium.networkError",
        PAYMENT_NOT_ALLOWED: "premium.paymentNotAllowed",
        VERIFICATION_FAILED: "premium.verificationFailed",
        ALREADY_OWNED: "premium.alreadyOwned",
      };
      setMessage(map[code] || "premium.purchaseFailed");
      if (code === "ALREADY_OWNED") updatePlanUi();
    } finally {
      setBusy(false);
    }
  });

  btnTestLifetime?.addEventListener("click", () => {
    setBusy(true);
    try {
      const plan = applyTestPurchase(PRODUCT_IDS.lifetimePremium);
      updatePlanUi();
      redirectAfterSuccess(plan);
    } catch (_) {
      setMessage("premium.purchaseFailed");
    } finally {
      setBusy(false);
    }
  });

  btnTestYearly?.addEventListener("click", () => {
    setBusy(true);
    try {
      const plan = applyTestPurchase(PRODUCT_IDS.yearlyPremium);
      updatePlanUi();
      redirectAfterSuccess(plan);
    } catch (_) {
      setMessage("premium.purchaseFailed");
    } finally {
      setBusy(false);
    }
  });

  btnTestRevoke?.addEventListener("click", () => {
    applyTestRevoke();
    updatePlanUi();
    setMessage("premium.freePlan");
    if (planStatus) planStatus.textContent = t("premium.freePlan");
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
    } catch (err) {
      const code = err?.message || "";
      if (code === "NETWORK_ERROR") setMessage("premium.networkError");
      else setMessage("premium.restoreFailed");
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
    updateTestPanelVisibility();
    updateStorePrices();
    updatePlanUi();
    if (message) message.textContent = "";

    window.HeavensClockDev = {
      enableTestMode: () => {
        enableBillingTestMode();
        updateTestPanelVisibility();
      },
      grantLifetime: () => {
        applyTestPurchase(PRODUCT_IDS.lifetimePremium);
        updatePlanUi();
      },
      grantYearly: () => {
        applyTestPurchase(PRODUCT_IDS.yearlyPremium);
        updatePlanUi();
      },
      revoke: () => {
        applyTestRevoke();
        updatePlanUi();
      },
      getPlan: () => getPlan(loadEntitlements()),
      isPremium: () => isPremium(loadEntitlements()),
      billingMode: () => billingMode,
    };
  }

  init();
})();
