/* =========================================================
   Visa Service Phuket — consent.js
   GDPR cookie consent (v2) + Google Consent Mode v2 +
   GA4 + Meta Pixel + server-side forwarding (CAPI / GA4 MP).
   Vanilla JS, no dependencies. Cloudflare Pages compatible.
   A11y: banner = non-modal region; preferences = modal dialog
   with focus trap, Esc, focus-return, aria-live announcement.
   ========================================================= */

(function () {
  "use strict";

  var CFG = window.VS_TRACK || {};
  var GA4_ID = CFG.GA4_ID || "";                 // "G-XXXXXXX" — TODO
  var ADS_CONVERSION = CFG.ADS_CONVERSION || ""; // "AW-XXX/label" — TODO (optional)
  var META_PIXEL_ID = CFG.META_PIXEL_ID || "";   // "1234567890" — TODO
  var CAPI_ENDPOINT = CFG.CAPI_ENDPOINT || "/api/track";

  var STORE_KEY = "vs_consent";
  var LANG = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
  if (["en", "de", "ru"].indexOf(LANG) < 0) LANG = "en";

  /* ---------------- localized strings ---------------- */
  var I18N = {
    en: {
      title: "We value your privacy",
      desc: "We use cookies for analytics and to measure marketing, so we can improve the site. You decide what to allow.",
      privacy: "Privacy Policy", privacyUrl: "/privacy.html",
      accept: "Accept all", reject: "Reject all", settings: "Settings",
      prefsTitle: "Cookie settings",
      necLeg: "Necessary", necTxt: "Always active — required for the site to work.", always: "Always active",
      anaLeg: "Analytics", anaTxt: "Google Analytics 4 — anonymous usage statistics.",
      mktLeg: "Marketing", mktTxt: "Meta Pixel and conversion measurement for ads.",
      save: "Save preferences", close: "Close",
      cookieLink: "Cookie settings", shown: "Cookie consent banner. Choose whether to allow analytics and marketing cookies."
    },
    de: {
      title: "Ihre Privatsphäre ist uns wichtig",
      desc: "Wir verwenden Cookies für Statistik und zur Messung von Marketing, um die Seite zu verbessern. Sie entscheiden, was erlaubt ist.",
      privacy: "Datenschutz", privacyUrl: "/de/privacy.html",
      accept: "Alle akzeptieren", reject: "Alle ablehnen", settings: "Einstellungen",
      prefsTitle: "Cookie-Einstellungen",
      necLeg: "Notwendig", necTxt: "Immer aktiv — für die Funktion der Seite erforderlich.", always: "Immer aktiv",
      anaLeg: "Statistik", anaTxt: "Google Analytics 4 — anonyme Nutzungsstatistik.",
      mktLeg: "Marketing", mktTxt: "Meta Pixel und Conversion-Messung für Anzeigen.",
      save: "Auswahl speichern", close: "Schließen",
      cookieLink: "Cookie-Einstellungen", shown: "Cookie-Hinweis. Wählen Sie, ob Statistik- und Marketing-Cookies erlaubt sind."
    },
    ru: {
      title: "Мы ценим вашу конфиденциальность",
      desc: "Мы используем cookie для статистики и измерения маркетинга, чтобы улучшать сайт. Вы решаете, что разрешить.",
      privacy: "Конфиденциальность", privacyUrl: "/ru/privacy.html",
      accept: "Принять все", reject: "Отклонить все", settings: "Настройки",
      prefsTitle: "Настройки cookie",
      necLeg: "Необходимые", necTxt: "Всегда активны — нужны для работы сайта.", always: "Всегда активны",
      anaLeg: "Аналитика", anaTxt: "Google Analytics 4 — анонимная статистика использования.",
      mktLeg: "Маркетинг", mktTxt: "Meta Pixel и измерение конверсий для рекламы.",
      save: "Сохранить", close: "Закрыть",
      cookieLink: "Настройки cookie", shown: "Баннер согласия на cookie. Выберите, разрешить ли аналитику и маркетинг."
    }
  };
  var t = I18N[LANG];

  /* ---------------- consent storage ---------------- */
  function readConsent() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function saveConsent(c) {
    c.ts = Date.now(); c.v = 2;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }

  function applyConsentMode(c) {
    gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied"
    });
  }

  /* ---------------- tag loaders (only after consent) ---------------- */
  var gaLoaded = false, pxLoaded = false;
  function loadGA() {
    if (gaLoaded || !GA4_ID || GA4_ID.indexOf("TODO") === 0) return;
    gaLoaded = true;
    var s = document.createElement("script"); s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID, { anonymize_ip: true });
  }
  function loadPixel() {
    if (pxLoaded || !META_PIXEL_ID || META_PIXEL_ID.indexOf("TODO") === 0) return;
    pxLoaded = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function activate(c) {
    applyConsentMode(c);
    if (c.analytics) loadGA();
    if (c.marketing) loadPixel();
  }

  /* ---------------- event forwarding (called by main.js trackEvent) ----------------
     Standard event mapping. Each event gets a shared event_id so the Meta Pixel
     (browser) and the Conversions API (server) can be de-duplicated. */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxxxxxx4xxx".replace(/x/g, function () { return ((Math.random() * 16) | 0).toString(16); });
  }
  function cookie(name) {
    var m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  }
  var META_STD = { whatsapp_click: "Lead", phone_click: "Contact", email_click: "Contact" };

  window.__vsForward = function (name, data) {
    var c = readConsent();
    if (!c) return; // no consent yet → nothing fires
    var eid = uuid();
    var params = Object.assign({}, data || {}, { event_id: eid });

    // Google Analytics 4 (analytics consent)
    if (c.analytics && gaLoaded && window.gtag !== undefined) {
      try { window.gtag("event", name, params); } catch (e) {}
      if (name === "whatsapp_click") {
        try { window.gtag("event", "generate_lead", params); } catch (e) {}
        if (ADS_CONVERSION && ADS_CONVERSION.indexOf("TODO") !== 0) {
          try { window.gtag("event", "conversion", { send_to: ADS_CONVERSION, event_id: eid }); } catch (e) {}
        }
      }
    }

    // Meta Pixel (marketing consent)
    if (c.marketing && pxLoaded && window.fbq) {
      var std = META_STD[name];
      try {
        if (std) window.fbq("track", std, params, { eventID: eid });
        else window.fbq("trackCustom", name, params, { eventID: eid });
      } catch (e) {}
    }

    // Server-side (CAPI + GA4 Measurement Protocol) — only with marketing consent.
    // The Cloudflare Pages Function de-dups via event_id and adds IP/UA hashing.
    if (c.marketing) {
      try {
        var body = {
          event_name: name, event_id: eid,
          event_source_url: location.href,
          referrer: document.referrer || "",
          fbp: cookie("_fbp"), fbc: cookie("_fbc"),
          ga_cookie: cookie("_ga"),
          consent: { analytics: !!c.analytics, marketing: !!c.marketing },
          data: data || {}
        };
        if (navigator.sendBeacon) {
          navigator.sendBeacon(CAPI_ENDPOINT, new Blob([JSON.stringify(body)], { type: "application/json" }));
        } else {
          fetch(CAPI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
        }
      } catch (e) {}
    }
  };

  /* ---------------- UI: banner (region) + preferences (modal) ---------------- */
  var lastInvoker = null;

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  // visually-hidden live region for announcement
  var live = el("div", { class: "sr-only", "aria-live": "polite", role: "status" });

  var banner, modal, backdrop;

  function buildBanner() {
    banner = el("section", {
      class: "cc-banner", role: "region", tabindex: "-1",
      "aria-labelledby": "cc-title", "aria-describedby": "cc-desc"
    });
    banner.innerHTML =
      '<div class="cc-inner">' +
      '<div class="cc-text"><h2 id="cc-title">' + t.title + "</h2>" +
      '<p id="cc-desc">' + t.desc + ' <a href="' + t.privacyUrl + '">' + t.privacy + "</a></p></div>" +
      '<div class="cc-actions">' +
      '<button type="button" class="btn btn-primary" data-cc="accept">' + t.accept + "</button>" +
      '<button type="button" class="btn btn-ghost" data-cc="reject">' + t.reject + "</button>" +
      '<button type="button" class="btn btn-accent-outline" data-cc="settings">' + t.settings + "</button>" +
      "</div></div>";
    document.body.appendChild(banner);
  }

  function checkbox(name, checked, disabled) {
    return '<input type="checkbox" name="' + name + '"' + (checked ? " checked" : "") +
      (disabled ? ' disabled aria-disabled="true"' : "") + " />";
  }

  function buildModal() {
    backdrop = el("div", { class: "cc-backdrop", "aria-hidden": "true" });
    modal = el("div", {
      class: "cc-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "cc-prefs-title"
    });
    var c = readConsent() || { analytics: false, marketing: false };
    modal.innerHTML =
      '<div class="cc-modal-card">' +
      '<h2 id="cc-prefs-title">' + t.prefsTitle + "</h2>" +
      '<fieldset class="cc-cat"><legend>' + t.necLeg + ' <span class="cc-badge">' + t.always + "</span></legend>" +
      "<label>" + checkbox("necessary", true, true) + " <span>" + t.necTxt + "</span></label></fieldset>" +
      '<fieldset class="cc-cat"><legend>' + t.anaLeg + "</legend>" +
      "<label>" + checkbox("analytics", c.analytics, false) + " <span>" + t.anaTxt + "</span></label></fieldset>" +
      '<fieldset class="cc-cat"><legend>' + t.mktLeg + "</legend>" +
      "<label>" + checkbox("marketing", c.marketing, false) + " <span>" + t.mktTxt + "</span></label></fieldset>" +
      '<div class="cc-actions">' +
      '<button type="button" class="btn btn-primary" data-cc="save">' + t.save + "</button>" +
      '<button type="button" class="btn btn-ghost" data-cc="close">' + t.close + "</button>" +
      "</div></div>";
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  }

  function pageChrome() {
    // direct body children to make inert while modal open (exclude cc nodes + live)
    return Array.prototype.filter.call(document.body.children, function (n) {
      return n !== modal && n !== backdrop && n !== banner && n !== live;
    });
  }
  function setInert(on) {
    pageChrome().forEach(function (n) { if (on) n.setAttribute("inert", ""); else n.removeAttribute("inert"); });
  }

  function trapTab(e) {
    if (e.key !== "Tab") return;
    var f = modal.querySelectorAll('button, [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openPrefs(invoker) {
    lastInvoker = invoker || lastInvoker;
    if (!modal) buildModal();
    // reset toggles to stored state on open (discard previous unsaved)
    var c = readConsent() || { analytics: false, marketing: false };
    modal.querySelector('[name="analytics"]').checked = !!c.analytics;
    modal.querySelector('[name="marketing"]').checked = !!c.marketing;
    backdrop.classList.add("is-open");
    modal.classList.add("is-open");
    setInert(true);
    document.addEventListener("keydown", onModalKey, true);
    var firstCtl = modal.querySelector('[name="analytics"]');
    if (firstCtl) firstCtl.focus();
  }
  function closePrefs() {
    if (!modal) return;
    modal.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    setInert(false);
    document.removeEventListener("keydown", onModalKey, true);
    if (lastInvoker && document.contains(lastInvoker)) lastInvoker.focus();
  }
  function onModalKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closePrefs(); }
    else trapTab(e);
  }

  function hideBanner() { if (banner) { banner.classList.remove("is-open"); banner.setAttribute("hidden", ""); } }
  function showBanner() {
    if (!banner) buildBanner();
    banner.removeAttribute("hidden");
    requestAnimationFrame(function () { banner.classList.add("is-open"); });
    live.textContent = t.shown; // announce politely (no focus hijack)
  }

  function finalize(c, fromBanner) {
    saveConsent(c);
    activate(c);
    hideBanner();
  }

  /* ---------------- click wiring ---------------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cc]");
    if (b) {
      var act = b.getAttribute("data-cc");
      if (act === "accept") finalize({ analytics: true, marketing: true }, true);
      else if (act === "reject") finalize({ analytics: false, marketing: false }, true);
      else if (act === "settings") openPrefs(b);
      else if (act === "save") {
        finalize({
          analytics: modal.querySelector('[name="analytics"]').checked,
          marketing: modal.querySelector('[name="marketing"]').checked
        });
        closePrefs();
      } else if (act === "close") closePrefs();
      return;
    }
    var open = e.target.closest("[data-cc-open]");
    if (open) { e.preventDefault(); openPrefs(open); }
    var bd = e.target.closest(".cc-backdrop");
    if (bd) closePrefs();
  });

  /* ---------------- init ---------------- */
  function init() {
    document.body.appendChild(live);
    var c = readConsent();
    if (c) { activate(c); }      // returning visitor → apply stored choice
    else { showBanner(); }       // first visit → ask
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
