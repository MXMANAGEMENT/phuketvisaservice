import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { applySharedComponents } from "./shared-components.mjs";

const root = process.cwd();
const output = path.join(root, "dist");
const ignored = new Set([
  ".git", ".github", ".gitignore", "dist", "functions", "node_modules",
  "config", "docs", "package-lock.json", "package.json", "scripts"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (ignored.has(entry.name)) continue;
  await cp(path.join(root, entry.name), path.join(output, entry.name), {
    recursive: true,
    force: true,
    filter: source => !source.endsWith(".py")
  });
}

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await htmlFiles(file));
    else if (entry.name.endsWith(".html")) found.push(file);
  }
  return found;
}

let transformed = 0;
const renderedHtml = await htmlFiles(output);
for (const file of renderedHtml) {
  const relative = path.relative(output, file).replaceAll(path.sep, "/");
  const source = await readFile(file, "utf8");
  const rendered = applySharedComponents(source, relative);
  if (rendered !== source) {
    await writeFile(file, rendered);
    transformed++;
  }
}

async function fingerprintAssets(directory) {
  const manifest = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [key, value] of await fingerprintAssets(file)) manifest.set(key, value);
      continue;
    }
    if (!/\.(?:css|js)$/.test(entry.name)) continue;
    const content = await readFile(file);
    const hash = createHash("sha256").update(content).digest("hex").slice(0, 10);
    const extension = path.extname(entry.name);
    const fingerprinted = `${path.basename(entry.name, extension)}.${hash}${extension}`;
    const target = path.join(directory, fingerprinted);
    await rename(file, target);
    const oldUrl = `/${path.relative(output, file).replaceAll(path.sep, "/")}`;
    const newUrl = `/${path.relative(output, target).replaceAll(path.sep, "/")}`;
    manifest.set(oldUrl, newUrl);
  }
  return manifest;
}

const assetManifest = new Map([
  ...await fingerprintAssets(path.join(output, "assets", "css")),
  ...await fingerprintAssets(path.join(output, "assets", "js"))
]);

for (const file of renderedHtml) {
  let html = await readFile(file, "utf8");
  for (const [oldUrl, newUrl] of assetManifest) {
    const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`${escaped}(?:\\?[^"'\\s>]*)?`, "g"), newUrl);
  }
  await writeFile(file, html);
}

console.log(`Build complete: dist/ (${transformed} pages rendered, ${assetManifest.size} assets fingerprinted)`);
