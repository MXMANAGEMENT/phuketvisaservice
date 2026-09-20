import { site, locales } from "../config/site.mjs";

const whatsappIcon = `<svg aria-hidden="true" class="btn-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.523 5.262l-.999 3.648 3.65-.948z"></path></svg>`;

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function pageLocale(relativePath) {
  return relativePath.startsWith("de/") ? "de" : relativePath.startsWith("ru/") ? "ru" : "en";
}

function languageLinks(html, activeLocale) {
  const links = new Map();
  for (const match of html.matchAll(/<link[^>]+hreflang=["'](en|de|ru)["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+hreflang=["'](en|de|ru)["'][^>]*>/gi)) {
    const locale = match[1] || match[4];
    const href = match[2] || match[3];
    if (!links.has(locale)) links.set(locale, href);
  }
  if (!links.size) links.set(activeLocale, locales[activeLocale].home);
  return [...links].map(([locale, href]) => `<a${locale === activeLocale ? ' aria-current="true"' : ""} data-lang-switch="${locale}" href="${escapeHtml(href)}" hreflang="${locale}" lang="${locale}">${locale.toUpperCase()}</a>`).join("\n");
}

export function renderHeader(html, relativePath) {
  const locale = pageLocale(relativePath);
  const copy = locales[locale];
  const nav = copy.nav.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("");
  return `<header class="site-header" data-shared-component="header">
<div class="header-inner">
<a aria-label="${site.brand}" class="brand" href="${copy.home}"><img src="${site.logo}" class="brand-logo" alt="${site.brand} Logo" width="52" height="52" style="border-radius: 8px;"><span>${site.brand}</span></a>
<div class="header-actions">
<a class="nav-services" data-event="cta_click" data-location="header_nav" href="${copy.home}#services">${copy.servicesLabel}</a>
<nav aria-label="${copy.languageLabel}" class="lang-switch">${languageLinks(html, locale)}</nav>
<a class="btn btn-whatsapp btn-sm header-cta" data-event="whatsapp_click" data-location="header" data-whatsapp href="#">${whatsappIcon} WhatsApp</a>
<button type="button" class="burger-btn" aria-expanded="false" aria-label="${copy.menuLabel}"><span class="burger-line"></span><span class="burger-line"></span><span class="burger-line"></span></button>
</div></div>
<nav class="mobile-nav" aria-label="Mobile Navigation" hidden><div class="mobile-nav-inner"><ul>${nav}</ul></div></nav>
</header>`;
}

export function renderFooter(relativePath) {
  const locale = pageLocale(relativePath);
  const copy = locales[locale];
  const services = copy.nav.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("");
  return `<footer class="site-footer" data-shared-component="footer"><div class="container"><div class="footer-grid">
<div><a aria-label="${site.brand}" class="brand" href="${copy.home}" style="color:#fff"><img src="${site.logo}" class="brand-logo" alt="${site.brand} Logo" width="52" height="52" style="border-radius:8px"><span style="color:#fff">${site.brand}</span></a><p class="legal-note">${copy.disclaimer}</p><p class="legal-note">Official website: <a href="${site.origin}">phuketvisaservice.com</a></p><div class="footer-social"><a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a> · <a href="${site.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a> · <a href="${site.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">LinkedIn</a></div></div>
<div class="footer-links footer-services"><h2>${copy.servicesLabel}</h2><ul>${services}</ul></div>
<div class="footer-contact"><h2>${copy.contact}</h2><ul><li>WhatsApp: <a data-event="whatsapp_click" data-location="footer" data-whatsapp href="#">${site.phoneDisplay}</a></li><li>Call: <a data-event="phone_click" data-location="footer" href="tel:${site.phoneE164}">${site.phoneDisplay}</a></li><li>Email: <a data-event="email_click" data-location="footer" href="mailto:${site.email}">${site.email}</a></li><li>${copy.office}</li><li>${copy.hours}</li></ul></div>
<div class="footer-links"><h2>${copy.more}</h2><ul><li><a href="${copy.home}about/">${copy.about}</a></li><li><a href="${copy.home}#services">${copy.allServices}</a></li><li><a href="${copy.home}tools/overstay-calculator/">Visa overstay fine calculator</a></li><li><a href="${copy.home}tools/90-day-report-calculator/">90-day report calculator</a></li><li><a href="${copy.home}privacy.html">${copy.privacy}</a></li><li><a href="${copy.home}terms.html">${copy.terms}</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 ${site.brand}</span><span>${copy.independent}</span></div></div></footer>`;
}

const globalSchemaTypes = new Set(["Organization", "LocalBusiness", "WebSite"]);

function normalizeEntityReferences(value) {
  if (Array.isArray(value)) return value.map(normalizeEntityReferences);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalizeEntityReferences(child)]));
  }
  return typeof value === "string" ? value.replace(`${site.origin}/#organization`, `${site.origin}/#business`) : value;
}

function stripDuplicatedGlobalSchemas(html) {
  return html.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (block, json) => {
    let data;
    try { data = normalizeEntityReferences(JSON.parse(json)); } catch { return block; }
    if (globalSchemaTypes.has(data?.["@type"])) return "";
    if (Array.isArray(data?.["@graph"])) {
      data["@graph"] = data["@graph"].filter(node => !globalSchemaTypes.has(node?.["@type"]));
      if (!data["@graph"].length) return "";
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    }
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });
}

function renderEntityGraph(relativePath) {
  const business = {
    "@type": "LocalBusiness",
    "@id": `${site.origin}/#business`,
    name: site.brand,
    url: `${site.origin}/`,
    logo: { "@type": "ImageObject", url: `${site.origin}${site.logo}` },
    image: `${site.origin}${site.image}`,
    telephone: site.phoneE164,
    email: site.email,
    address: { "@type": "PostalAddress", ...site.address },
    areaServed: { "@type": "AdministrativeArea", name: "Phuket, Thailand" },
    openingHoursSpecification: site.openingHours.map(hours => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.days,
      opens: hours.opens,
      closes: hours.closes
    })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: site.phoneE164,
      url: `https://wa.me/${site.whatsappNumber}`,
      availableLanguage: ["en", "de", "ru", "th"]
    },
    sameAs: [site.social.facebook, site.social.instagram, site.social.linkedin],
    priceRange: "$$"
  };
  const website = {
    "@type": "WebSite",
    "@id": `${site.origin}/#website`,
    url: `${site.origin}/`,
    name: site.brand,
    inLanguage: ["en", "de", "ru"],
    publisher: { "@id": `${site.origin}/#business` }
  };
  return `<script type="application/ld+json" data-shared-component="entity-graph">${JSON.stringify({ "@context": "https://schema.org", "@graph": [business, website] })}</script>`;
}

export function applySharedComponents(html, relativePath) {
  let output = stripDuplicatedGlobalSchemas(html);
  const headerPattern = /<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i;
  const footerPattern = /<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;
  if (headerPattern.test(output)) output = output.replace(headerPattern, renderHeader(output, relativePath));
  if (footerPattern.test(output)) output = output.replace(footerPattern, renderFooter(relativePath));
  const publicSiteConfig = JSON.stringify({ whatsappNumber: site.whatsappNumber, phoneE164: site.phoneE164, email: site.email });
  output = output.replace(/window\.VS_TRACK\s*=\s*\{[^}]*\}/g, `window.VS_SITE=${publicSiteConfig};window.VS_TRACK={GA4_ID:'${site.ga4MeasurementId}',ADS_CONVERSION:'${site.adsConversionId}',META_PIXEL_ID:'${site.metaPixelId}',CAPI_ENDPOINT:'${site.trackingEndpoint}'}`);
  output = output.replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/(?:wa\.me|www\.google-analytics\.com|www\.googletagmanager\.com|connect\.facebook\.net)[^"']*["'][^>]*>\s*/gi, "");
  output = output.replace(/<link\b[^>]*href=["']https:\/\/(?:wa\.me|www\.google-analytics\.com|www\.googletagmanager\.com|connect\.facebook\.net)[^"']*["'][^>]*rel=["']preconnect["'][^>]*>\s*/gi, "");
  if (!/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(output)) {
    output = output.replace(/<\/head>/i, `${renderEntityGraph(relativePath)}\n</head>`);
  }
  return output;
}
