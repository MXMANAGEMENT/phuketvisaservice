import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] || "dist");
const limits = { ".html": 220_000, ".css": 100_000, ".js": 90_000, ".png": 250_000, ".jpg": 250_000, ".jpeg": 250_000, ".webp": 250_000, ".avif": 250_000 };
const failures = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else {
      const extension = path.extname(entry.name).toLowerCase();
      if (!limits[extension]) continue;
      const bytes = (await stat(file)).size;
      if (bytes > limits[extension]) failures.push(`${path.relative(root, file)}: ${bytes} bytes exceeds ${limits[extension]}`);
    }
  }
}

await walk(root);
const htmlFiles = [];
async function collectHtml(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) await collectHtml(file); else if (entry.name.endsWith(".html")) htmlFiles.push(file); } }
await collectHtml(root);
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/\/(assets\/(?:css|js)\/[^"'?#]+\.(?:css|js))/g)) {
    if (!/\.[a-f0-9]{10}\.(?:css|js)$/.test(match[1])) failures.push(`${path.relative(root, file)}: unfingerprinted build asset ${match[0]}`);
  }
}
if (failures.length) { console.error(`Performance budget failed (${failures.length}):\n${failures.join("\n")}`); process.exit(1); }
console.log(`Performance budget passed: ${htmlFiles.length} pages, hashed CSS/JS, file limits respected.`);
