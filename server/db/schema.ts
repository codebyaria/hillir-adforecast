import { sql } from "drizzle-orm";
import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check("users_name_not_blank", sql`length(trim(${table.name})) > 0`),
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
  ],
);

export const calculations = pgTable(
  "calculations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productPrice: numeric("product_price", {
      precision: 18,
      scale: 2,
    }).notNull(),
    adSpend: numeric("ad_spend", { precision: 18, scale: 2 }).notNull(),
    costPerResult: numeric("cost_per_result", {
      precision: 18,
      scale: 2,
    }).notNull(),
    averageOrderValue: numeric("average_order_value", {
      precision: 18,
      scale: 2,
    }).notNull(),
    resultCount: numeric("result_count", {
      precision: 20,
      scale: 6,
    }).notNull(),
    revenue: numeric("revenue", { precision: 20, scale: 2 }).notNull(),
    profitAfterAds: numeric("profit_after_ads", {
      precision: 20,
      scale: 2,
    }).notNull(),
    roiPercentage: numeric("roi_percentage", {
      precision: 12,
      scale: 4,
    }).notNull(),
    targetCpr: numeric("target_cpr", { precision: 18, scale: 2 }).notNull(),
    revenuePerResult: numeric("revenue_per_result", {
      precision: 18,
      scale: 2,
    }).notNull(),
    marginPerResult: numeric("margin_per_result", {
      precision: 18,
      scale: 2,
    }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    formulaVersion: varchar("formula_version", { length: 16 })
      .default("v1")
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("calculations_user_created_at_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    check("calculations_product_price_nonnegative", sql`${table.productPrice} >= 0`),
    check("calculations_ad_spend_positive", sql`${table.adSpend} > 0`),
    check("calculations_cost_per_result_positive", sql`${table.costPerResult} > 0`),
    check(
      "calculations_average_order_value_nonnegative",
      sql`${table.averageOrderValue} >= 0`,
    ),
    check(
      "calculations_status_valid",
      sql`${table.status} in ('profitable', 'break_even', 'needs_optimization')`,
    ),
  ],
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type CalculationRecord = typeof calculations.$inferSelect;
export type NewCalculationRecord = typeof calculations.$inferInsert;
