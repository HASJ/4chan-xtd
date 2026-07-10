import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

const host = process.env.SONAR_HOST_URL || "http://localhost:9000";
const token = process.env.SONAR_TOKEN;

if (!token) {
  console.error("Set SONAR_TOKEN first. Example: $env:SONAR_TOKEN=\"your_token\"");
  process.exit(1);
}

// Resolve npx from Node's own install directory instead of letting the shell
// search PATH, so a writable/untrusted PATH entry can't hijack the exec.
const npx = join(dirname(process.execPath), process.platform === "win32" ? "npx.cmd" : "npx");

const result = spawnSync(npx, [ // NOSONAR npx is resolved to an absolute path from process.execPath above, not looked up via PATH; no shell, no PATH-dependent execution here.
  "@sonar/scan",
  `-Dsonar.host.url=${host}`,
  `-Dsonar.token=${token}`,
], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
