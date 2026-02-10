CREATE TABLE "feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message" varchar(2000) NOT NULL,
	"page" varchar(500),
	"locale" varchar(10)
);
--> statement-breakpoint
CREATE INDEX "feedback_created_at" ON "feedback" USING btree ("created_at");