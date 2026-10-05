import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED wajib tersedia saat menjalankan perintah migration.",
  );
}

const normalizedMigrationUrl = new URL(migrationUrl);
const sslMode = normalizedMigrationUrl.searchParams.get("sslmode");

if (["prefer", "require", "verify-ca"].includes(sslMode ?? "")) {
  normalizedMigrationUrl.searchParams.set("sslmode", "verify-full");
}

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: normalizedMigrationUrl.toString(),
  },
});
