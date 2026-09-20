import path from "node:path";
import { REPO_ROOT, loadConfig, verifySite } from "./site-lib.mjs";

const targetArg = process.argv[2] || ".";
const target = path.resolve(REPO_ROOT, targetArg);
const config = await loadConfig();

try {
  const report = await verifySite(target, config, { label: targetArg });
  for (const warning of report.warnings) console.warn("WARN:", warning);
  console.log("Verification passed:", report.htmlFiles, "HTML files checked in", targetArg);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
