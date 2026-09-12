import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add the Tiger Cloud connection string to the repo-root .env file.");
  process.exit(1);
}

const directory = fileURLToPath(new URL("./migrations/", import.meta.url));

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(directory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  const applied = await pool.query<{ name: string }>("SELECT name FROM schema_migrations");
  const appliedNames = new Set(applied.rows.map((row) => row.name));

  for (const file of files) {
    if (appliedNames.has(file)) continue;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(await readFile(new URL(`./migrations/${file}`, import.meta.url), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  console.log("GitQuest Tiger Cloud migrations complete.");
} catch (error) {
  const err = error as { code?: string; message?: string };
  console.error("Migration failed:", err.message ?? error);
  if (err.code === "ENOTFOUND" || /getaddrinfo/i.test(String(err.message))) {
    console.error("\nCheck the hostname and port in DATABASE_URL, then confirm the Tiger Cloud service is running.");
  }
  process.exit(1);
} finally {
  await pool.end();
}
