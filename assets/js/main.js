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

  // WhatsApp number — international format, digits only, no "+" or spaces.
  // Live number: +66 94 829 3074  (WhatsApp reachable 24/7).
  var WHATSAPP_NUMBER = "66948293074";

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
        timestamp: new Date().toISOString()
      },
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
    var text = encodeURIComponent(message || WA_MESSAGES[DOC_LANG] || WA_MESSAGES.en);
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

    function updateMetrics() {
      height = document.documentElement.scrollHeight;
      innerH = window.innerHeight;
    }
    window.addEventListener("resize", updateMetrics, { passive: true });
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

    function toggleMenu() {
      var isExpanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", !isExpanded);
      if (!isExpanded) {
        nav.classList.add("is-open");
        nav.removeAttribute("hidden");
        document.body.style.overflow = "hidden"; // Prevent scrolling
      } else {
        nav.classList.remove("is-open");
        setTimeout(function() { nav.setAttribute("hidden", "true"); }, 350);
        document.body.style.overflow = "";
      }
    }

    btn.addEventListener("click", toggleMenu);

    // Close on link click
    var links = nav.querySelectorAll("a");
    links.forEach(function(link) {
      link.addEventListener("click", function() {
        if (btn.getAttribute("aria-expanded") === "true") {
          toggleMenu();
        }
      });
    });
  }

  function init() {
    initWhatsAppLinks();
    initEventBindings();
    initFaq();
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
