import { client } from "./index";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), "src/db/migrations");
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await client.execute(statement);
      } catch (err: any) {
        // Ignore duplicate tables/columns
        const msg = err?.message || "";
        if (
          !msg.includes("already exists") &&
          !msg.includes("duplicate column")
        ) {
          console.warn(`Migration statement warning in ${file}:`, msg);
        }
      }
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => console.log("Migrations applied successfully."))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
