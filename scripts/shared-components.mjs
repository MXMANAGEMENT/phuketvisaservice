import { site, locales } from "../config/site.mjs";

const whatsappIcon = `<svg aria-hidden="true" class="btn-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.523 5.262l-.999 3.648 3.65-.948z"></path></svg>`;
const socialIcons = Object.freeze({
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07s-3.585-.015-4.85-.074c-1.17-.061-1.805-.256-2.227-.421-.562-.224-.96-.479-1.382-.899-.419-.419-.679-.824-.896-1.38-.164-.42-.36-1.065-.413-2.235-.057-1.274-.07-1.649-.07-4.859s.015-3.585.074-4.85c.061-1.17.256-1.805.421-2.227.224-.562.479-.96.899-1.382.419-.419.824-.679 1.38-.896.42-.164 1.065-.36 2.235-.413C8.415 2.175 8.79 2.16 12 2.16zm0 3.678c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44c-.795 0-1.44-.645-1.44-1.44s.645-1.44 1.44-1.44z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0H5C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z"/></svg>`
});

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
<button type="button" class="burger-btn" aria-expanded="false" aria-controls="mobile-navigation" aria-label="${copy.menuLabel}" data-label-open="${copy.menuLabel}" data-label-close="${copy.closeMenuLabel}"><span class="burger-line"></span><span class="burger-line"></span><span class="burger-line"></span></button>
</div></div>
<nav id="mobile-navigation" class="mobile-nav" aria-label="${copy.mobileNavigationLabel}" hidden><div class="mobile-nav-inner"><ul>${nav}</ul></div></nav>
</header>`;
}

export function renderFooter(relativePath) {
  const locale = pageLocale(relativePath);
  const copy = locales[locale];
  const services = copy.nav.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("");
  return `<footer class="site-footer" data-shared-component="footer"><div class="container"><div class="footer-grid">
<div><a aria-label="${site.brand}" class="brand" href="${copy.home}" style="color:#fff"><img src="${site.logo}" class="brand-logo" alt="${site.brand} Logo" width="52" height="52" style="border-radius:8px"><span style="color:#fff">${site.brand}</span></a><p class="legal-note">${copy.disclaimer}</p><p class="legal-note">Official website: <a href="${site.origin}">phuketvisaservice.com</a></p><div class="footer-social"><a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${socialIcons.facebook}</a><a href="${site.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${socialIcons.instagram}</a><a href="${site.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${socialIcons.linkedin}</a></div></div>
<div class="footer-links footer-services"><h2>${copy.servicesLabel}</h2><ul>${services}</ul></div>
<div class="footer-contact"><h2>${copy.contact}</h2><ul><li>WhatsApp: <a data-event="whatsapp_click" data-location="footer" data-whatsapp href="#">${site.phoneDisplay}</a></li><li>Call: <a data-event="phone_click" data-location="footer" href="tel:${site.phoneE164}">${site.phoneDisplay}</a></li><li>Email: <a data-event="email_click" data-location="footer" href="mailto:${site.email}">${site.email}</a></li><li>${copy.office}</li><li>${copy.hours}</li></ul></div>
<div class="footer-links"><h2>${copy.more}</h2><ul><li><a href="${copy.home}about/">${copy.about}</a></li><li><a href="${copy.home}#services">${copy.allServices}</a></li><li><a href="${copy.home}tools/overstay-calculator/">Visa overstay fine calculator</a></li><li><a href="${copy.home}tools/90-day-report-calculator/">90-day report calculator</a></li><li><a href="${copy.home}privacy.html">${copy.privacy}</a></li><li><a href="${copy.home}terms.html">${copy.terms}</a></li><li>Language: <a data-lang-switch="en" href="/" hreflang="en" lang="en">EN</a> · <a data-lang-switch="de" href="/de/" hreflang="de" lang="de">DE</a> · <a data-lang-switch="ru" href="/ru/" hreflang="ru" lang="ru">RU</a></li></ul></div>
</div><div class="footer-bottom"><span>© 2026 ${site.brand}</span><span>${copy.independent}</span></div><p class="footer-credit">Website &amp; Growth Strategy delivered in cooperation by <a href="https://seo-bavaria.com" target="_blank" rel="noopener">SEO Bavaria</a> and <a href="https://phuketleadlab.com" target="_blank" rel="noopener">Phuket Lead Lab</a></p></div></footer>`;
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
