import assert from "node:assert/strict";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;

if (!migrationUrl) {
  throw new Error("DATABASE_URL_UNPOOLED wajib tersedia untuk verifikasi schema.");
}

const normalizedMigrationUrl = new URL(migrationUrl);
const sslMode = normalizedMigrationUrl.searchParams.get("sslmode");

if (["prefer", "require", "verify-ca"].includes(sslMode ?? "")) {
  normalizedMigrationUrl.searchParams.set("sslmode", "verify-full");
}

const client = new Client({ connectionString: normalizedMigrationUrl.toString() });

try {
  await client.connect();

  const tables = await client.query<{ table_name: string }>(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name in ('users', 'calculations')
      order by table_name`,
  );

  assert.deepEqual(
    tables.rows.map((row) => row.table_name),
    ["calculations", "users"],
    "Tabel users dan calculations harus tersedia.",
  );

  const columns = await client.query<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: "YES" | "NO";
  }>(
    `select table_name, column_name, data_type, is_nullable
       from information_schema.columns
      where table_schema = 'public'
        and table_name in ('users', 'calculations')`,
  );

  const requiredColumns = [
    "users.id",
    "users.name",
    "users.email",
    "users.password_hash",
    "calculations.id",
    "calculations.user_id",
    "calculations.product_price",
    "calculations.ad_spend",
    "calculations.cost_per_result",
    "calculations.average_order_value",
    "calculations.result_count",
    "calculations.revenue",
    "calculations.profit_after_ads",
    "calculations.roi_percentage",
    "calculations.target_cpr",
    "calculations.revenue_per_result",
    "calculations.margin_per_result",
    "calculations.status",
    "calculations.formula_version",
    "calculations.created_at",
  ];

  const existingColumns = new Set(
    columns.rows.map((row) => `${row.table_name}.${row.column_name}`),
  );

  for (const column of requiredColumns) {
    assert(existingColumns.has(column), `Kolom ${column} harus tersedia.`);
  }

  const nullableRequiredColumn = columns.rows.find(
    (column) =>
      requiredColumns.includes(`${column.table_name}.${column.column_name}`) &&
      column.is_nullable !== "NO",
  );

  assert.equal(
    nullableRequiredColumn,
    undefined,
    `Kolom ${nullableRequiredColumn?.table_name}.${nullableRequiredColumn?.column_name} seharusnya NOT NULL.`,
  );

  const foreignKeys = await client.query<{ constraint_name: string }>(
    `select tc.constraint_name
       from information_schema.table_constraints tc
       join information_schema.referential_constraints rc
         on rc.constraint_name = tc.constraint_name
        and rc.constraint_schema = tc.constraint_schema
      where tc.table_schema = 'public'
        and tc.table_name = 'calculations'
        and tc.constraint_type = 'FOREIGN KEY'
        and rc.delete_rule = 'CASCADE'`,
  );

  assert.equal(
    foreignKeys.rowCount,
    1,
    "calculations harus memiliki satu foreign key ON DELETE CASCADE.",
  );

  const indexes = await client.query<{ indexname: string; indexdef: string }>(
    `select indexname, indexdef
       from pg_indexes
      where schemaname = 'public'
        and indexname in (
          'users_email_unique',
          'calculations_user_created_at_idx'
        )
      order by indexname`,
  );

  assert.deepEqual(
    indexes.rows.map((row) => row.indexname),
    ["calculations_user_created_at_idx", "users_email_unique"],
    "Unique email index dan history index harus tersedia.",
  );
  assert(
    indexes.rows
      .find((row) => row.indexname === "calculations_user_created_at_idx")
      ?.indexdef.includes("created_at DESC"),
    "History index harus mengurutkan created_at secara descending.",
  );

  const checks = await client.query<{ constraint_name: string }>(
    `select constraint_name
       from information_schema.table_constraints
      where table_schema = 'public'
        and constraint_type = 'CHECK'
        and constraint_name in (
          'users_name_not_blank',
          'users_email_lowercase',
          'calculations_product_price_nonnegative',
          'calculations_ad_spend_positive',
          'calculations_cost_per_result_positive',
          'calculations_average_order_value_nonnegative',
          'calculations_status_valid'
        )`,
  );

  assert.equal(checks.rowCount, 7, "Seluruh check constraint harus tersedia.");

  console.log("Schema database terverifikasi:");
  console.log("- tabel users dan calculations tersedia");
  console.log("- seluruh kolom wajib bersifat NOT NULL");
  console.log("- foreign key user menggunakan ON DELETE CASCADE");
  console.log("- unique email dan history index tersedia");
  console.log("- tujuh check constraint tersedia");
} finally {
  await client.end();
}
