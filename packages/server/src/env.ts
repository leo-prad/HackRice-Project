import { config } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Load the single repo-root `.env` (workspace scripts run from packages/server). */
const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}
