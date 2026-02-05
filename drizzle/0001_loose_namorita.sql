CREATE TABLE "api_call_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_call_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"called_at" timestamp with time zone DEFAULT now() NOT NULL,
	"endpoint" varchar(100) NOT NULL,
	"league_api_id" integer,
	"season" varchar(10),
	"params" varchar(500),
	"success" boolean NOT NULL,
	"http_status" integer,
	"response_time_ms" integer,
	"daily_remaining" integer,
	"error_message" varchar(500)
);
--> statement-breakpoint
CREATE INDEX "api_call_log_called_at" ON "api_call_log" USING btree ("called_at");