import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { applySharedComponents } from "./shared-components.mjs";

const root = process.cwd();
const output = path.join(root, "dist");
const ignored = new Set([
  ".git", ".github", ".gitignore", "dist", "functions", "node_modules",
  "config", "package-lock.json", "package.json", "scripts"
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
for (const file of await htmlFiles(output)) {
  const relative = path.relative(output, file).replaceAll(path.sep, "/");
  const source = await readFile(file, "utf8");
  const rendered = applySharedComponents(source, relative);
  if (rendered !== source) {
    await writeFile(file, rendered);
    transformed++;
  }
}

console.log(`Build complete: dist/ (${transformed} pages rendered with shared components)`);
