import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const migration = fileURLToPath(new URL("./migrations/001_init.sql", import.meta.url));
await pool.query(await readFile(migration, "utf8"));
await pool.end();
console.log("Questline database migration complete.");
