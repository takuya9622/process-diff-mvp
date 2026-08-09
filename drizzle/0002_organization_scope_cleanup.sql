ALTER TABLE "relations" DROP CONSTRAINT "relations_source_target_type_unique";--> statement-breakpoint
ALTER TABLE "entity_versions" DROP CONSTRAINT "entity_versions_entity_number_unique";--> statement-breakpoint
ALTER TABLE "relations" DROP CONSTRAINT "relations_source_entity_id_business_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "relations" DROP CONSTRAINT "relations_target_entity_id_business_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "change_sets" DROP CONSTRAINT "change_sets_business_entity_id_business_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "change_sets" DROP CONSTRAINT "change_sets_before_version_id_entity_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "change_sets" DROP CONSTRAINT "change_sets_after_version_id_entity_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "entity_versions" DROP CONSTRAINT "entity_versions_business_entity_id_business_entities_id_fk";
--> statement-breakpoint
DELETE FROM "change_sets" WHERE "organization_id" IS NULL;--> statement-breakpoint
DELETE FROM "entity_versions" WHERE "organization_id" IS NULL;--> statement-breakpoint
DELETE FROM "relations" WHERE "organization_id" IS NULL;--> statement-breakpoint
DELETE FROM "business_entities" WHERE "organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "business_entities" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "relations" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "change_sets" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "change_sets" ALTER COLUMN "changed_by_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "entity_versions" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_entities" ADD CONSTRAINT "business_entities_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_organization_source_target_type_unique" UNIQUE("organization_id","source_entity_id","target_entity_id","relation_type");--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_organization_entity_id_unique" UNIQUE("organization_id","business_entity_id","id");--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_organization_entity_number_unique" UNIQUE("organization_id","business_entity_id","version_number");--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_organization_source_entity_fk" FOREIGN KEY ("organization_id","source_entity_id") REFERENCES "public"."business_entities"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_organization_target_entity_fk" FOREIGN KEY ("organization_id","target_entity_id") REFERENCES "public"."business_entities"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_organization_entity_fk" FOREIGN KEY ("organization_id","business_entity_id") REFERENCES "public"."business_entities"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_organization_before_version_fk" FOREIGN KEY ("organization_id","business_entity_id","before_version_id") REFERENCES "public"."entity_versions"("organization_id","business_entity_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_organization_after_version_fk" FOREIGN KEY ("organization_id","business_entity_id","after_version_id") REFERENCES "public"."entity_versions"("organization_id","business_entity_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_versions" ADD CONSTRAINT "entity_versions_organization_entity_fk" FOREIGN KEY ("organization_id","business_entity_id") REFERENCES "public"."business_entities"("organization_id","id") ON DELETE restrict ON UPDATE no action;
