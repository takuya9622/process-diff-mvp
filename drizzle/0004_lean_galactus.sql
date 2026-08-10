CREATE TABLE "communication_channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"channel_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_channels_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "communication_channels_organization_key_unique" UNIQUE("organization_id","channel_key")
);
--> statement-breakpoint
CREATE TABLE "communication_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"author_user_id" uuid,
	"author_display_name" text NOT NULL,
	"message_type" text NOT NULL,
	"body" text NOT NULL,
	"related_case_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"edited_at" timestamp with time zone,
	CONSTRAINT "communication_messages_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "communication_messages_type_check" CHECK ("communication_messages"."message_type" in ('TEXT', 'CASE_SHARE', 'SYSTEM'))
);
--> statement-breakpoint
ALTER TABLE "communication_channels" ADD CONSTRAINT "communication_channels_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_organization_channel_fk" FOREIGN KEY ("organization_id","channel_id") REFERENCES "public"."communication_channels"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_organization_case_fk" FOREIGN KEY ("organization_id","related_case_id") REFERENCES "public"."workflow_cases"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communication_channels_organization_name_idx" ON "communication_channels" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "communication_messages_channel_created_at_idx" ON "communication_messages" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "communication_messages_related_case_id_idx" ON "communication_messages" USING btree ("related_case_id");