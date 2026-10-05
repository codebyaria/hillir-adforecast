CREATE TABLE "calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_price" numeric(18, 2) NOT NULL,
	"ad_spend" numeric(18, 2) NOT NULL,
	"cost_per_result" numeric(18, 2) NOT NULL,
	"average_order_value" numeric(18, 2) NOT NULL,
	"result_count" numeric(20, 6) NOT NULL,
	"revenue" numeric(20, 2) NOT NULL,
	"profit_after_ads" numeric(20, 2) NOT NULL,
	"roi_percentage" numeric(12, 4) NOT NULL,
	"target_cpr" numeric(18, 2) NOT NULL,
	"revenue_per_result" numeric(18, 2) NOT NULL,
	"margin_per_result" numeric(18, 2) NOT NULL,
	"status" varchar(32) NOT NULL,
	"formula_version" varchar(16) DEFAULT 'v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calculations_product_price_nonnegative" CHECK ("calculations"."product_price" >= 0),
	CONSTRAINT "calculations_ad_spend_positive" CHECK ("calculations"."ad_spend" > 0),
	CONSTRAINT "calculations_cost_per_result_positive" CHECK ("calculations"."cost_per_result" > 0),
	CONSTRAINT "calculations_average_order_value_nonnegative" CHECK ("calculations"."average_order_value" >= 0),
	CONSTRAINT "calculations_status_valid" CHECK ("calculations"."status" in ('profitable', 'break_even', 'needs_optimization'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_not_blank" CHECK (length(trim("users"."name")) > 0),
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calculations_user_created_at_idx" ON "calculations" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");