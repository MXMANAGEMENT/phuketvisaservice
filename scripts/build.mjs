import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const output = path.join(root, "dist");
const ignored = new Set([
  ".git", ".github", ".gitignore", "dist", "functions", "node_modules",
  "package-lock.json", "package.json", "scripts"
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

console.log("Build complete: dist/");
