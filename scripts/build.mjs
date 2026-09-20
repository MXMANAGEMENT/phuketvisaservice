import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  REPO_ROOT,
  alternateLinks,
  canonicalFrom,
  isNoindex,
  loadConfig,
  transformHtml,
  verifySite,
  walkFiles,
  xmlEscape
} from "./site-lib.mjs";

const outDir = path.join(REPO_ROOT, "dist");
const config = await loadConfig();

const sourceReport = await verifySite(REPO_ROOT, config, { label: "source" });

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const files = await walkFiles(REPO_ROOT, "", { publishOnly: true });
for (const rel of files) {
  const src = path.join(REPO_ROOT, rel);
  const dest = path.join(outDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });

  if (rel.endsWith(".html")) {
    const html = transformHtml(await readFile(src, "utf8"), config);
    await writeFile(dest, html, "utf8");
  } else {
    await cp(src, dest);
  }
}

const builtHtml = (await walkFiles(outDir)).filter((rel) => rel.endsWith(".html"));
const sitemapEntries = [];
for (const rel of builtHtml) {
  const html = await readFile(path.join(outDir, rel), "utf8");
  if (isNoindex(html)) continue;
  const canonical = canonicalFrom(html);
  if (canonical.count !== 1 || !canonical.href.startsWith(config.domain)) continue;

  const alternates = alternateLinks(html)
    .filter((item) => item.href.startsWith(config.domain))
    .filter((item, index, arr) =>
      arr.findIndex((x) => x.hreflang === item.hreflang && x.href === item.href) === index
    );

  sitemapEntries.push({
    loc: canonical.href,
    alternates
  });
}

sitemapEntries.sort((a, b) => a.loc.localeCompare(b.loc));
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemapEntries.flatMap((entry) => [
    "  <url>",
    "    <loc>" + xmlEscape(entry.loc) + "</loc>",
    "    <lastmod>" + xmlEscape(config.contentLastReviewed) + "</lastmod>",
    ...entry.alternates.map((alt) =>
      '    <xhtml:link rel="alternate" hreflang="' +
      xmlEscape(alt.hreflang) +
      '" href="' +
      xmlEscape(alt.href) +
      '" />'
    ),
    "  </url>"
  ]),
  "</urlset>",
  ""
].join("\n");

await writeFile(path.join(outDir, "sitemap.xml"), sitemap, "utf8");

const distReport = await verifySite(outDir, config, { label: "dist" });

for (const warning of [...sourceReport.warnings, ...distReport.warnings]) {
  console.warn("WARN:", warning);
}

console.log(
  "Build complete:",
  builtHtml.length,
  "HTML files,",
  sitemapEntries.length,
  "indexable sitemap URLs -> dist/"
);
