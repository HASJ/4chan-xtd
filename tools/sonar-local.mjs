import { spawnSync } from "node:child_process";

const host = process.env.SONAR_HOST_URL || "http://localhost:9000";
const token = process.env.SONAR_TOKEN;

if (!token) {
  console.error("Set SONAR_TOKEN first. Example: $env:SONAR_TOKEN=\"your_token\"");
  process.exit(1);
}

const result = spawnSync("npx", [
  "@sonar/scan",
  `-Dsonar.host.url=${host}`,
  `-Dsonar.token=${token}`,
], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
