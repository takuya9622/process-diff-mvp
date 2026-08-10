CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"work_item_id" uuid NOT NULL,
	"attempt" integer NOT NULL,
	"status" text NOT NULL,
	"decided_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "approvals_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "approvals_organization_work_item_unique" UNIQUE("organization_id","work_item_id"),
	CONSTRAINT "approvals_attempt_check" CHECK ("approvals"."attempt" >= 1),
	CONSTRAINT "approvals_status_check" CHECK ("approvals"."status" in ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED'))
);
--> statement-breakpoint
CREATE TABLE "case_field_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"value" text NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "case_field_values_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "case_field_values_case_field_unique" UNIQUE("organization_id","case_id","field_definition_id")
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"step_definition_id" uuid NOT NULL,
	"title" text NOT NULL,
	"assigned_user_id" uuid NOT NULL,
	"assigned_role" text NOT NULL,
	"status" text NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "work_items_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "work_items_status_check" CHECK ("work_items"."status" in ('READY', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'CANCELLED', 'SKIPPED'))
);
--> statement-breakpoint
CREATE TABLE "workflow_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"actor_role" text,
	"activity_type" text NOT NULL,
	"summary" text NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_activities_organization_id_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "workflow_cases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_version_id" uuid NOT NULL,
	"case_number" integer NOT NULL,
	"status" text NOT NULL,
	"current_step_key" text NOT NULL,
	"initiated_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "workflow_cases_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workflow_cases_organization_number_unique" UNIQUE("organization_id","case_number"),
	CONSTRAINT "workflow_cases_status_check" CHECK ("workflow_cases"."status" in ('DRAFT', 'RUNNING', 'WAITING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED')),
	CONSTRAINT "workflow_cases_positive_number_check" CHECK ("workflow_cases"."case_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "workflow_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"definition_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"related_process_entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_definitions_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workflow_definitions_organization_key_unique" UNIQUE("organization_id","definition_key")
);
--> statement-breakpoint
CREATE TABLE "workflow_field_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_version_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"step_key" text NOT NULL,
	"is_required" boolean NOT NULL,
	"position" integer NOT NULL,
	"description" text,
	CONSTRAINT "workflow_field_definitions_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workflow_field_definitions_version_key_unique" UNIQUE("organization_id","workflow_version_id","field_key"),
	CONSTRAINT "workflow_field_definitions_type_check" CHECK ("workflow_field_definitions"."field_type" in ('TEXT', 'INTEGER', 'DATE')),
	CONSTRAINT "workflow_field_definitions_position_check" CHECK ("workflow_field_definitions"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "workflow_step_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_version_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"name" text NOT NULL,
	"step_type" text NOT NULL,
	"assigned_role" text,
	"due_days" integer,
	"position" integer NOT NULL,
	CONSTRAINT "workflow_step_definitions_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workflow_step_definitions_version_key_unique" UNIQUE("organization_id","workflow_version_id","step_key"),
	CONSTRAINT "workflow_step_definitions_type_check" CHECK ("workflow_step_definitions"."step_type" in ('INPUT', 'TASK', 'APPROVAL', 'END')),
	CONSTRAINT "workflow_step_definitions_position_check" CHECK ("workflow_step_definitions"."position" >= 1),
	CONSTRAINT "workflow_step_definitions_due_days_check" CHECK ("workflow_step_definitions"."due_days" is null or "workflow_step_definitions"."due_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workflow_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_definition_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "workflow_versions_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workflow_versions_organization_definition_number_unique" UNIQUE("organization_id","workflow_definition_id","version_number"),
	CONSTRAINT "workflow_versions_status_check" CHECK ("workflow_versions"."status" in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'RETIRED')),
	CONSTRAINT "workflow_versions_positive_number_check" CHECK ("workflow_versions"."version_number" >= 1)
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organization_case_fk" FOREIGN KEY ("organization_id","case_id") REFERENCES "public"."workflow_cases"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organization_work_item_fk" FOREIGN KEY ("organization_id","work_item_id") REFERENCES "public"."work_items"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_field_values" ADD CONSTRAINT "case_field_values_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_field_values" ADD CONSTRAINT "case_field_values_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_field_values" ADD CONSTRAINT "case_field_values_organization_case_fk" FOREIGN KEY ("organization_id","case_id") REFERENCES "public"."workflow_cases"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_field_values" ADD CONSTRAINT "case_field_values_organization_field_fk" FOREIGN KEY ("organization_id","field_definition_id") REFERENCES "public"."workflow_field_definitions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_organization_case_fk" FOREIGN KEY ("organization_id","case_id") REFERENCES "public"."workflow_cases"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_organization_step_fk" FOREIGN KEY ("organization_id","step_definition_id") REFERENCES "public"."workflow_step_definitions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_activities" ADD CONSTRAINT "workflow_activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_activities" ADD CONSTRAINT "workflow_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_activities" ADD CONSTRAINT "workflow_activities_organization_case_fk" FOREIGN KEY ("organization_id","case_id") REFERENCES "public"."workflow_cases"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_cases" ADD CONSTRAINT "workflow_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_cases" ADD CONSTRAINT "workflow_cases_initiated_by_user_id_users_id_fk" FOREIGN KEY ("initiated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_cases" ADD CONSTRAINT "workflow_cases_organization_version_fk" FOREIGN KEY ("organization_id","workflow_version_id") REFERENCES "public"."workflow_versions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_organization_process_fk" FOREIGN KEY ("organization_id","related_process_entity_id") REFERENCES "public"."business_entities"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_field_definitions" ADD CONSTRAINT "workflow_field_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_field_definitions" ADD CONSTRAINT "workflow_field_definitions_organization_version_fk" FOREIGN KEY ("organization_id","workflow_version_id") REFERENCES "public"."workflow_versions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_step_definitions" ADD CONSTRAINT "workflow_step_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_step_definitions" ADD CONSTRAINT "workflow_step_definitions_organization_version_fk" FOREIGN KEY ("organization_id","workflow_version_id") REFERENCES "public"."workflow_versions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_organization_definition_fk" FOREIGN KEY ("organization_id","workflow_definition_id") REFERENCES "public"."workflow_definitions"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approvals_case_id_idx" ON "approvals" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_field_values_case_id_idx" ON "case_field_values" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "work_items_organization_status_idx" ON "work_items" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "work_items_assigned_user_id_idx" ON "work_items" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "work_items_case_id_idx" ON "work_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "workflow_activities_case_created_at_idx" ON "workflow_activities" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_cases_organization_status_idx" ON "workflow_cases" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "workflow_cases_initiated_by_user_id_idx" ON "workflow_cases" USING btree ("initiated_by_user_id");--> statement-breakpoint
CREATE INDEX "workflow_definitions_organization_id_idx" ON "workflow_definitions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workflow_field_definitions_version_idx" ON "workflow_field_definitions" USING btree ("workflow_version_id");--> statement-breakpoint
CREATE INDEX "workflow_step_definitions_version_idx" ON "workflow_step_definitions" USING btree ("workflow_version_id");--> statement-breakpoint
CREATE INDEX "workflow_versions_organization_id_idx" ON "workflow_versions" USING btree ("organization_id");