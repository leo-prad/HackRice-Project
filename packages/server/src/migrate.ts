import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to the repo root as .env and set the Supabase pooler URI.");
  process.exit(1);
}

const migration = fileURLToPath(new URL("./migrations/001_init.sql", import.meta.url));
try {
  await pool.query(await readFile(migration, "utf8"));
  console.log("Questline database migration complete.");
} catch (error) {
  const err = error as { code?: string; message?: string };
  console.error("Migration failed:", err.message ?? error);
  if (err.code === "ENOTFOUND" || /getaddrinfo/i.test(String(err.message))) {
    console.error(
      "\nUse Supabase Transaction pooler (IPv4), not the direct db.*.supabase.co host.\n" +
        "Supabase → Project Settings → Database → Connection string → URI (pooler).\n" +
        "Username looks like postgres.<project-ref>, host like aws-0-<region>.pooler.supabase.com, port 6543.",
    );
  }
  process.exit(1);
} finally {
  await pool.end();
}
