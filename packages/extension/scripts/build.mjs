import { spawnSync } from "node:child_process";

const runs = [
  { env: {} },
  { env: { QL_BUILD_TARGET: "content" } },
  { env: { QL_BUILD_TARGET: "content", QL_CONTENT_ENTRY: "dashboard-sync" } },
];

for (const { env } of runs) {
  const result = spawnSync("vite", ["build"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
