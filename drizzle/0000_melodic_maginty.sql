CREATE TABLE "business_entities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"current_content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "business_entities_entity_type_check" CHECK ("business_entities"."entity_type" in ('PROCESS', 'RULE', 'DOCUMENT', 'ROLE', 'SYSTEM'))
);
--> statement-breakpoint
CREATE TABLE "relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"relation_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "relations_source_target_type_unique" UNIQUE("source_entity_id","target_entity_id","relation_type"),
	CONSTRAINT "relations_relation_type_check" CHECK ("relations"."relation_type" in ('REQUIRES', 'REFERENCES', 'GOVERNED_BY', 'USES', 'OWNED_BY', 'APPROVED_BY', 'PRODUCES')),
	CONSTRAINT "relations_distinct_entities_check" CHECK ("relations"."source_entity_id" <> "relations"."target_entity_id")
);
--> statement-breakpoint
CREATE TABLE "change_sets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_entity_id" uuid NOT NULL,
	"before_version_id" uuid NOT NULL,
	"after_version_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "change_sets_distinct_versions_check" CHECK ("change_sets"."before_version_id" <> "change_sets"."after_version_id")
);
--> statement-breakpoint
CREATE TABLE "entity_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_entity_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "entity_versions_entity_number_unique" UNIQUE("business_entity_id","version_number"),
	CONSTRAINT "entity_versions_positive_number_check" CHECK ("entity_versions"."version_number" >= 1)
);
--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_source_entity_id_business_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."business_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_target_entity_id_business_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."business_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_business_entity_id_business_entities_id_fk" FOREIGN KEY ("business_entity_id") REFERENCES "public"."business_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_before_version_id_entity_versions_id_fk" FOREIGN KEY ("before_version_id") REFERENCES "public"."entity_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_after_version_id_entity_versions_id_fk" FOREIGN KEY ("after_version_id") REFERENCES "public"."entity_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_business_entity_id_business_entities_id_fk" FOREIGN KEY ("business_entity_id") REFERENCES "public"."business_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_entities_entity_type_idx" ON "business_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "relations_source_entity_idx" ON "relations" USING btree ("source_entity_id");--> statement-breakpoint
CREATE INDEX "relations_target_entity_idx" ON "relations" USING btree ("target_entity_id");--> statement-breakpoint
CREATE INDEX "change_sets_entity_created_at_idx" ON "change_sets" USING btree ("business_entity_id","created_at");--> statement-breakpoint
CREATE INDEX "entity_versions_entity_number_idx" ON "entity_versions" USING btree ("business_entity_id","version_number");