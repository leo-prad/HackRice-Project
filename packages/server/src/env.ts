import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Workspace scripts run from packages/server, so resolve the monorepo root explicitly.
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
