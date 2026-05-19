/**
 * Premium web users: PWA install prompt for PC / mobile browser.
 * Skipped on native app and for non-premium users.
 */
(function () {
  const ENTITLEMENTS_KEY = "heavens-clock-entitlements";
  const DISMISS_KEY = "heavens-clock-install-dismissed";

  function isNativeApp() {
    try {
      if (window.HeavensClockBridge) return true;
      if (window.Capacitor?.isNativePlatform?.()) return true;
      const platform = window.Capacitor?.getPlatform?.();
      if (platform && platform !== "web") return true;
    } catch (_) {}
    return false;
  }

  function isPremium() {
    try {
      const raw = localStorage.getItem(ENTITLEMENTS_KEY);
      if (!raw) return false;
      const entitlements = JSON.parse(raw);
      if (entitlements.lifetimePremium) return true;
      if (entitlements.yearlyPremium) {
        if (!entitlements.yearlyExpiresAt) return true;
        return new Date(entitlements.yearlyExpiresAt) > new Date();
      }
      if (entitlements.premiumThemes || entitlements.premiumWidgets) return true;
    } catch (_) {}
    return false;
  }

  function isKo() {
    return (document.documentElement.lang || "").startsWith("ko");
  }

  function copy() {
    if (isKo()) {
      return {
        title: "PC에 설치하기",
        bodyChrome: "이 브라우저에 천국의 시계를 앱처럼 설치할 수 있습니다.",
        bodyManual:
          "Chrome 또는 Edge 주소창 오른쪽의 설치 아이콘을 누르거나, 메뉴에서 「앱 설치」를 선택하세요.",
        bodyIos: "Safari 공유 버튼 → 「홈 화면에 추가」로 설치할 수 있습니다.",
        install: "지금 설치",
        close: "닫기",
        installed: "이미 설치된 환경입니다.",
      };
    }
    return {
      title: "Install on this device",
      bodyChrome: "Install Heaven's Clock like an app in this browser.",
      bodyManual:
        "Use the install icon in the Chrome or Edge address bar, or choose Install app from the browser menu.",
      bodyIos: "In Safari: Share → Add to Home Screen.",
      install: "Install now",
      close: "Close",
      installed: "Already running as an installed app.",
    };
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function wasDismissed() {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function dismissTip() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (_) {}
    hideTip();
  }

  const tip = document.getElementById("install-tip");
  if (!tip || isNativeApp() || !isPremium() || isStandalone()) return;

  const titleEl = document.getElementById("install-title");
  const bodyEl = document.getElementById("install-body");
  const actionBtn = document.getElementById("install-action");
  const dismissBtn = document.getElementById("install-dismiss");
  const text = copy();

  let deferredPrompt = null;

  function hideTip() {
    tip.hidden = true;
  }

  function showTip(mode) {
    if (wasDismissed() && location.hash !== "#install") return;
    if (titleEl) titleEl.textContent = text.title;
    if (bodyEl) {
      bodyEl.textContent =
        mode === "ios" ? text.bodyIos : mode === "prompt" ? text.bodyChrome : text.bodyManual;
    }
    if (actionBtn) actionBtn.hidden = mode !== "prompt";
    if (dismissBtn) dismissBtn.textContent = text.close;
    tip.hidden = false;
  }

  if (titleEl) titleEl.textContent = text.title;
  if (dismissBtn) {
    dismissBtn.textContent = text.close;
    dismissBtn.addEventListener("click", dismissTip);
  }

  if (actionBtn) {
    actionBtn.textContent = text.install;
    actionBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch (_) {}
      deferredPrompt = null;
      dismissTip();
    });
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const forceShow = location.hash === "#install";

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showTip("prompt");
  });

  if (forceShow) {
    showTip(isIos ? "ios" : deferredPrompt ? "prompt" : "manual");
  } else if (isIos) {
    window.setTimeout(() => showTip("ios"), 1200);
  } else {
    window.setTimeout(() => {
      if (!deferredPrompt && !wasDismissed()) showTip("manual");
    }, 2000);
  }

  window.HeavensClockWebInstall = {
    show: () => showTip(deferredPrompt ? "prompt" : "manual"),
    dismiss: dismissTip,
    isStandalone,
  };
})();
