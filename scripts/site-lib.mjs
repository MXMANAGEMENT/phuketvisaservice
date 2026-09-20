import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([".git", ".github", "node_modules", "dist", "scripts", "functions", "config", ".wrangler"]);
const PUBLISH_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".json", ".xml", ".txt",
  ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff2"
]);
const SPECIAL_FILES = new Set(["_headers", "_redirects"]);

export async function loadConfig(root = REPO_ROOT) {
  return JSON.parse(await readFile(path.join(root, "config", "site.json"), "utf8"));
}

export async function walkFiles(root, rel = "", { publishOnly = false } = {}) {
  const dir = path.join(root, rel);
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const childRel = path.posix.join(rel.replaceAll(path.sep, "/"), entry.name);
    if (entry.isDirectory()) {
      if (!rel && SKIP_DIRS.has(entry.name)) continue;
      files.push(...await walkFiles(root, childRel, { publishOnly }));
      continue;
    }
    if (!entry.isFile()) continue;
    if (publishOnly) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!PUBLISH_EXTENSIONS.has(ext) && !SPECIAL_FILES.has(entry.name)) continue;
      if (childRel === "sitemap.xml") continue;
    }
    files.push(childRel);
  }
  return files.sort();
}

export function expectedLanguage(rel) {
  if (rel.startsWith("de/")) return "de";
  if (rel.startsWith("ru/")) return "ru";
  return "en";
}

export function routeFor(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  if (rel.endsWith(".html")) return "/" + rel;
  return null;
}

export function getAttr(tag, name) {
  const re = new RegExp("\\b" + name + "\\s*=\\s*([\"'])((?:(?!\\1).)*)\\1", "i");
  const m = tag.match(re);
  return m ? m[2] : "";
}

export function canonicalFrom(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const canonicals = tags.filter((tag) => (getAttr(tag, "rel") || "").toLowerCase().split(/\s+/).includes("canonical"));
  return {
    count: canonicals.length,
    href: canonicals[0] ? getAttr(canonicals[0], "href") : ""
  };
}

export function isNoindex(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.some((tag) =>
    (getAttr(tag, "name") || "").toLowerCase() === "robots" &&
    (getAttr(tag, "content") || "").toLowerCase().split(/[\s,]+/).includes("noindex")
  );
}

export function alternateLinks(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const found = [];
  for (const tag of tags) {
    const rel = (getAttr(tag, "rel") || "").toLowerCase().split(/\s+/);
    if (!rel.includes("alternate")) continue;
    const hreflang = getAttr(tag, "hreflang");
    const href = getAttr(tag, "href");
    if (hreflang && href) found.push({ hreflang, href });
  }
  return found;
}

function normalizePathname(value) {
  if (!value) return "";
  const trimmed = value.length > 1 ? value.replace(/\/+$/, "") : value;
  return trimmed || "/";
}

function countTag(html, tag, closing = false) {
  const re = closing
    ? new RegExp("</" + tag + "\\s*>", "gi")
    : new RegExp("<" + tag + "\\b", "gi");
  return (html.match(re) || []).length;
}

function jsonLdErrors(html) {
  const errors = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let index = 0;
  while ((m = re.exec(html))) {
    index += 1;
    try {
      JSON.parse(m[1].trim());
    } catch (error) {
      errors.push("invalid JSON-LD block #" + index + ": " + error.message);
    }
  }
  return errors;
}

async function localAssetErrors(root, html) {
  const errors = [];
  const tags = html.match(/<(?:img|script|link)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attr = /^<link/i.test(tag) ? "href" : "src";
    const value = getAttr(tag, attr);
    if (!value || !value.startsWith("/") || value.startsWith("//")) continue;
    const clean = value.split(/[?#]/)[0];
    if (!/\.(?:css|js|png|jpe?g|webp|svg|ico|woff2)$/i.test(clean)) continue;
    try {
      await access(path.join(root, clean.slice(1)));
    } catch {
      errors.push("missing local asset " + clean);
    }
  }
  return errors;
}

export async function verifySite(root, config, { label = "site" } = {}) {
  const htmlFiles = (await walkFiles(root)).filter((rel) => rel.endsWith(".html") && !rel.startsWith("dist/"));
  const failures = [];
  const warnings = [];

  const forbidden = [
    ["legacy brand", /Phuket Visa Helper/i],
    ["legacy domain", /phuketvisahelper\.com/i],
    ["placeholder domain", /your-domain\.com/i],
    ["placeholder image", /via\.placeholder\.com/i],
    ["invalid dofollow rel", /rel\s*=\s*["']dofollow["']/i],
    ["placeholder phone", /\+66-XX-XXX-XXXX/i],
    ["known bad phone", /(?:\+66123456789|wa\.me\/66123456789)/i],
    ["escaped closing nav", /\\<\/nav>/i],
    ["missing logo.webp reference", /assets\/img\/logo\.webp/i],
    ["TODO placeholder", /\bTODO_/i]
  ];

  for (const rel of htmlFiles) {
    const abs = path.join(root, rel);
    const html = await readFile(abs, "utf8");
    const pageErrors = [];
    const noindex = isNoindex(html);
    const expectedLang = expectedLanguage(rel);
    const actualLang = (html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i) || [])[1] || "";
    const canonical = canonicalFrom(html);
    const route = routeFor(rel);

    for (const [name, re] of forbidden) {
      if (re.test(html)) pageErrors.push(name);
    }

    if (!actualLang) pageErrors.push("missing html lang");
    else if (actualLang.split("-")[0].toLowerCase() !== expectedLang) {
      pageErrors.push("html lang " + actualLang + " does not match " + expectedLang);
    }

    const titles = html.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
    if (titles.length !== 1) pageErrors.push("expected exactly one title, found " + titles.length);

    const h1Count = countTag(html, "h1");
    if (!noindex && h1Count !== 1) pageErrors.push("expected exactly one H1, found " + h1Count);

    if (!noindex) {
      if (canonical.count !== 1) {
        pageErrors.push("expected exactly one canonical, found " + canonical.count);
      } else {
        try {
          const u = new URL(canonical.href);
          const primary = new URL(config.domain);
          if (u.origin !== primary.origin) pageErrors.push("canonical uses non-primary origin " + u.origin);
          if (route && normalizePathname(u.pathname) !== normalizePathname(route)) {
            pageErrors.push("canonical path " + u.pathname + " does not match route " + route);
          }
        } catch {
          pageErrors.push("invalid canonical URL " + canonical.href);
        }
      }
    }

    const footerOpen = countTag(html, "footer");
    const footerClose = countTag(html, "footer", true);
    if (footerOpen !== footerClose) pageErrors.push("unbalanced footer tags " + footerOpen + "/" + footerClose);

    const navOpen = countTag(html, "nav");
    const navClose = countTag(html, "nav", true);
    if (navOpen !== navClose) pageErrors.push("unbalanced nav tags " + navOpen + "/" + navClose);

    if (html.includes("cookie-consent-banner") && /assets\/js\/consent\.js/.test(html)) {
      pageErrors.push("duplicate consent implementation");
    }

    for (const match of html.matchAll(/GA4_ID\s*:\s*["']([^"']*)["']/g)) {
      if (match[1] !== config.tracking.ga4) pageErrors.push("GA4_ID differs from central config");
    }

    pageErrors.push(...jsonLdErrors(html));
    pageErrors.push(...await localAssetErrors(root, html));

    const titleText = (titles[0] || "").replace(/<[^>]+>/g, "").trim();
    if (titleText.length > 70) warnings.push(rel + ": long title (" + titleText.length + " chars)");

    if (pageErrors.length) failures.push({ file: rel, errors: [...new Set(pageErrors)] });
  }

  if (failures.length) {
    const lines = failures.flatMap((item) => [item.file, ...item.errors.map((e) => "  - " + e)]);
    throw new Error(label + " verification failed:\n" + lines.join("\n"));
  }

  return { htmlFiles: htmlFiles.length, warnings };
}

export function transformHtml(html, config) {
  const domain = config.domain.replace(/\/$/, "");
  const tracking = "window.VS_TRACK={GA4_ID:'" +
    config.tracking.ga4 +
    "',ADS_CONVERSION:'" +
    config.tracking.googleAdsConversion +
    "',META_PIXEL_ID:'" +
    config.tracking.metaPixelId +
    "',CAPI_ENDPOINT:'" +
    config.tracking.capiEndpoint +
    "'};";

  return html
    .replaceAll("https://phuketvisaservice.com", domain)
    .replaceAll("+66 94 829 3074", config.phone.display)
    .replaceAll("+66948293074", config.phone.e164)
    .replaceAll("wa.me/66948293074", "wa.me/" + config.phone.whatsapp)
    .replace(/window\.VS_TRACK\s*=\s*\{[^}]*\};/g, tracking);
}

export function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
