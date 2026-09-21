import { client } from "./index";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  const migrationPath = path.join(
    process.cwd(),
    "src/db/migrations/0000_jazzy_millenium_guard.sql"
  );
  if (!fs.existsSync(migrationPath)) {
    return;
  }
  const sql = fs.readFileSync(migrationPath, "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err: any) {
      // Ignore if table/index already exists
      if (!err?.message?.includes("already exists")) {
        console.error("Migration statement error:", err);
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
