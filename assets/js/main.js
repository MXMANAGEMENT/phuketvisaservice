/* =========================================================
   Visa Service Phuket — main.js
   Vanilla JS. No dependencies. Cloudflare Pages compatible.
   Single conversion focus: WhatsApp.
   Handles: tracking, WhatsApp links, scroll depth, FAQ,
            sticky CTA, service + language tracking.
   ========================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------
     CONFIG
     ------------------------------------------------------- */

  // Generated from config/site.mjs during the production build.
  var SITE_CFG = window.VS_SITE || {};
  var WHATSAPP_NUMBER = SITE_CFG.whatsappNumber || "";

  // Pre-filled WhatsApp messages per language.
  var WA_MESSAGES = {
    en:
      "Hello Visa Service Phuket, I need help with my visa/driving license in Phuket. " +
      "My nationality is: ___, current visa type: ___, visa expiry date: ___.",
    de:
      "Hallo Visa Service Phuket, ich brauche Hilfe mit meinem Visum/Führerschein in Phuket. " +
      "Meine Nationalität ist: ___, aktueller Visatyp: ___, Ablaufdatum meines Visums: ___.",
    ru:
      "Здравствуйте, Visa Service Phuket. Мне нужна помощь с визой/водительскими правами на Пхукете. " +
      "Моя национальность: ___, текущий тип визы: ___, дата окончания визы: ___."
  };

  var DOC_LANG = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

  function cleanValue(value) {
    return String(value || "").replace(/[^a-zA-Z0-9._~ -]/g, "").slice(0, 100);
  }

  function sessionValue(key, create) {
    try {
      var value = sessionStorage.getItem(key);
      if (!value && create) { value = create(); sessionStorage.setItem(key, value); }
      return value || "";
    } catch (e) { return create ? create() : ""; }
  }

  var LEAD_ID = sessionValue("vs_lead_id", function () {
    return (window.crypto && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)).toUpperCase();
  });

  function attribution() {
    var current = new URLSearchParams(window.location.search);
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem("vs_attribution") || "{}"); } catch (e) {}
    ATTR_KEYS.forEach(function (key) {
      var value = cleanValue(current.get(key));
      if (value && !stored[key]) stored[key] = value;
    });
    try { sessionStorage.setItem("vs_attribution", JSON.stringify(stored)); } catch (e) {}
    return stored;
  }

  var ATTRIBUTION = attribution();
  var PAGE_PATH = window.location.pathname;
  var SERVICE_SLUG = document.querySelector('[data-shared-component="service-pricing"]') ? PAGE_PATH.replace(/^\/(?:de\/|ru\/)?|\/$/g, "") : "";

  /* -------------------------------------------------------
     TRACKING — window.trackEvent(name, data)
     dataLayer push (GTM) + console log until analytics wired.
     ------------------------------------------------------- */

  window.dataLayer = window.dataLayer || [];

  window.trackEvent = function (eventName, eventData) {
    var payload = Object.assign(
      {
        event: eventName,
        page_language: DOC_LANG,
        page_location: window.location.href,
        page_path: PAGE_PATH,
        service_slug: SERVICE_SLUG || null,
        lead_id: LEAD_ID,
        timestamp: new Date().toISOString()
      },
      ATTRIBUTION,
      eventData || {}
    );

    try {
      window.dataLayer.push(payload);
    } catch (e) {
      /* no-op */
    }

    // forward to consent-gated tag layer (GA4 / Meta Pixel / CAPI)
    if (window.__vsForward) { try { window.__vsForward(eventName, payload); } catch (e) {} }

    if (window.console && typeof window.console.log === "function") {
      window.console.log("[trackEvent]", eventName, payload);
    }

    // Add direct pixel/CRM calls here when needed, e.g.:
    //   if (window.gtag) window.gtag('event', eventName, payload);
    //   if (window.fbq)  window.fbq('trackCustom', eventName, payload);
  };

  /* -------------------------------------------------------
     WHATSAPP LINK BUILDER
     ------------------------------------------------------- */

  function buildWhatsAppHref(message) {
    if (!WHATSAPP_NUMBER) return "#contact";
    var base = message || WA_MESSAGES[DOC_LANG] || WA_MESSAGES.en;
    var referenceLabel = DOC_LANG === "de" ? "Referenz" : DOC_LANG === "ru" ? "Код" : "Reference";
    var text = encodeURIComponent(base + "\n" + referenceLabel + ": " + LEAD_ID);
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text;
  }

  function initWhatsAppLinks() {
    var links = document.querySelectorAll("[data-whatsapp]");
    var href = buildWhatsAppHref();

    links.forEach(function (link) {
      var custom = link.getAttribute("data-wa-message");
      link.setAttribute("href", custom ? buildWhatsAppHref(custom) : href);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");

      link.addEventListener("click", function () {
        window.trackEvent("whatsapp_click", {
          location: link.getAttribute("data-location") || "unknown",
          service: link.getAttribute("data-service") || null
        });
        var intentEvent = link.getAttribute("data-intent-event");
        if (intentEvent) window.trackEvent(intentEvent, { location: link.getAttribute("data-location") || "unknown", service: link.getAttribute("data-service") || null });
      });
    });
  }

  /* -------------------------------------------------------
     GENERIC CTA / SERVICE / PHONE / EMAIL / LANG TRACKING
     ------------------------------------------------------- */

  function initEventBindings() {
    document.querySelectorAll("[data-event]").forEach(function (el) {
      if (el.hasAttribute("data-whatsapp")) return; // handled above

      el.addEventListener("click", function () {
        window.trackEvent(el.getAttribute("data-event"), {
          location: el.getAttribute("data-location") || null,
          service: el.getAttribute("data-service") || null,
          label: (el.textContent || "").trim().slice(0, 60)
        });
      });
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener("click", function () {
        window.trackEvent("phone_click", { location: el.getAttribute("data-location") || "footer" });
      });
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
      el.addEventListener("click", function () {
        window.trackEvent("email_click", { location: el.getAttribute("data-location") || "footer" });
      });
    });

    document.querySelectorAll("[data-lang-switch]").forEach(function (el) {
      el.addEventListener("click", function () {
        window.trackEvent("language_switch", {
          from: DOC_LANG,
          to: el.getAttribute("data-lang-switch")
        });
      });
    });
  }

  /* -------------------------------------------------------
     FAQ open tracking
     ------------------------------------------------------- */

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (item.open) {
          var q = item.querySelector("summary");
          window.trackEvent("faq_open", {
            question: q ? (q.textContent || "").trim().slice(0, 80) : null
          });
        }
      });
    });
  }

  function initFunnelViews() {
    window.trackEvent("service_view", { page_type: SERVICE_SLUG ? "service" : "content" });
    if (!("IntersectionObserver" in window)) return;
    var targets = [
      ["[data-shared-component='case-check']", "case_check_view"],
      ["[data-shared-component='service-scope']", "service_scope_view"],
      ["[data-shared-component='service-pricing']", "pricing_view"]
    ];
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var eventName = entry.target.getAttribute("data-view-event");
        if (eventName) window.trackEvent(eventName, {});
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    targets.forEach(function (item) {
      var element = document.querySelector(item[0]);
      if (element) { element.setAttribute("data-view-event", item[1]); observer.observe(element); }
    });
  }

  /* -------------------------------------------------------
     SCROLL PERFORMANCE — throttled unified listener
     ------------------------------------------------------- */

  var scrollListeners = [];
  var scrollTicking = false;

  function onScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        scrollListeners.forEach(function (fn) { fn(y); });
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  function addScrollListener(fn) {
    scrollListeners.push(fn);
    if (scrollListeners.length === 1) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* -------------------------------------------------------
     SCROLL DEPTH (fires events at 25, 50, 75, 90)
     ------------------------------------------------------- */

  function initScrollDepth() {
    var thresholds = [25, 50, 75, 90];
    var fired = {};
    var height = 0;
    var innerH = 0;
    var resizeTimeout = null;

    function updateMetrics() {
      height = document.documentElement.scrollHeight;
      innerH = window.innerHeight;
    }

    // Debounced resize handler to avoid excessive recalculations
    function handleResize() {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(updateMetrics, 150);
    }

    window.addEventListener("resize", handleResize, { passive: true });
    updateMetrics();

    addScrollListener(function (y) {
      if (height <= 0) return;
      var percentage = Math.round(((y + innerH) / height) * 100);

      thresholds.forEach(function (t) {
        if (!fired[t] && percentage >= t) {
          fired[t] = true;
          window.trackEvent("scroll_" + t, { scroll_percentage: t });
        }
      });
    });
  }

  /* -------------------------------------------------------
     STICKY WHATSAPP — reveal after slight delay
     ------------------------------------------------------- */

  function initStickyWhatsApp() {
    var sticky = document.querySelector(".wa-sticky");
    if (!sticky) return;
    sticky.style.opacity = "0";
    sticky.style.transition = "opacity 240ms ease";
    window.setTimeout(function () {
      sticky.style.opacity = "1";
    }, 1200);
  }

  /* -------------------------------------------------------
     SCROLL-TO-TOP — round button above the WhatsApp sticky
     ------------------------------------------------------- */

  var TOP_LABEL = { en: "Back to top", de: "Nach oben", ru: "Наверх" };

  function initScrollTop() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scroll-top";
    btn.setAttribute("aria-label", TOP_LABEL[DOC_LANG] || TOP_LABEL.en);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="18 15 12 9 6 15"></polyline></svg>';
    document.body.appendChild(btn);

    addScrollListener(function (y) {
      btn.classList.toggle("is-visible", y > 400);
    });

    btn.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      window.trackEvent("scroll_top", {});
    });
  }

  /* -------------------------------------------------------
     MOBILE MENU
     ------------------------------------------------------- */

  function initMobileMenu() {
    var btn = document.querySelector(".burger-btn");
    var nav = document.querySelector(".mobile-nav");
    if (!btn || !nav) return;
    var closeTimer = null;
    var openLabel = btn.getAttribute("data-label-open") || btn.getAttribute("aria-label") || "Open menu";
    var closeLabel = btn.getAttribute("data-label-close") || "Close menu";

    function setMenu(open, returnFocus) {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? closeLabel : openLabel);
      if (open) {
        nav.classList.add("is-open");
        nav.removeAttribute("hidden");
        document.body.style.overflow = "hidden";
      } else {
        nav.classList.remove("is-open");
        closeTimer = setTimeout(function () {
          nav.setAttribute("hidden", "");
          closeTimer = null;
        }, 350);
        document.body.style.overflow = "";
        if (returnFocus) btn.focus();
      }
    }

    btn.addEventListener("click", function () {
      setMenu(btn.getAttribute("aria-expanded") !== "true", false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setMenu(false, true);
      }
    });

    // Close on link click
    var links = nav.querySelectorAll("a");
    links.forEach(function(link) {
      link.addEventListener("click", function() {
        if (btn.getAttribute("aria-expanded") === "true") {
          setMenu(false, false);
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 960 && btn.getAttribute("aria-expanded") === "true") {
        setMenu(false, false);
      }
    }, { passive: true });
  }

  function init() {
    initWhatsAppLinks();
    initEventBindings();
    initFaq();
    initFunnelViews();
    initScrollDepth();
    initStickyWhatsApp();
    initScrollTop();
    initMobileMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
