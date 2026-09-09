import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tsc = spawnSync("npx", ["tsc", "--noEmit"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

if (tsc.status !== 0) {
  process.exit(tsc.status === null ? 1 : tsc.status);
}

const promo = spawnSync("npx", ["tsx", "scripts/verify-promo.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

if (promo.status !== 0) {
  process.exit(promo.status === null ? 1 : promo.status);
}

const analytics = spawnSync("npx", ["tsx", "scripts/verify-analytics.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

process.exit(analytics.status === null ? 1 : analytics.status);
