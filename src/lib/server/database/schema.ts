import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  organizations,
  users,
} from "@/lib/server/database/auth-schema.generated";

export const businessEntities = pgTable(
  "business_entities",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    entityType: text("entity_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    currentContent: text("current_content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("business_entities_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    check(
      "business_entities_entity_type_check",
      sql`${table.entityType} in ('PROCESS', 'RULE', 'DOCUMENT', 'ROLE', 'SYSTEM')`,
    ),
    index("business_entities_organization_id_idx").on(table.organizationId),
    index("business_entities_entity_type_idx").on(table.entityType),
  ],
);

export const businessRelations = pgTable(
  "relations",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    sourceEntityId: uuid("source_entity_id").notNull(),
    targetEntityId: uuid("target_entity_id").notNull(),
    relationType: text("relation_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("relations_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("relations_organization_source_target_type_unique").on(
      table.organizationId,
      table.sourceEntityId,
      table.targetEntityId,
      table.relationType,
    ),
    foreignKey({
      name: "relations_organization_source_entity_fk",
      columns: [table.organizationId, table.sourceEntityId],
      foreignColumns: [businessEntities.organizationId, businessEntities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "relations_organization_target_entity_fk",
      columns: [table.organizationId, table.targetEntityId],
      foreignColumns: [businessEntities.organizationId, businessEntities.id],
    }).onDelete("restrict"),
    check(
      "relations_relation_type_check",
      sql`${table.relationType} in ('REQUIRES', 'REFERENCES', 'GOVERNED_BY', 'USES', 'OWNED_BY', 'APPROVED_BY', 'PRODUCES')`,
    ),
    index("relations_organization_id_idx").on(table.organizationId),
    check(
      "relations_distinct_entities_check",
      sql`${table.sourceEntityId} <> ${table.targetEntityId}`,
    ),
    index("relations_source_entity_idx").on(table.sourceEntityId),
    index("relations_target_entity_idx").on(table.targetEntityId),
  ],
);

export const entityVersions = pgTable(
  "entity_versions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    businessEntityId: uuid("business_entity_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("entity_versions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("entity_versions_organization_entity_id_unique").on(
      table.organizationId,
      table.businessEntityId,
      table.id,
    ),
    unique("entity_versions_organization_entity_number_unique").on(
      table.organizationId,
      table.businessEntityId,
      table.versionNumber,
    ),
    foreignKey({
      name: "entity_versions_organization_entity_fk",
      columns: [table.organizationId, table.businessEntityId],
      foreignColumns: [businessEntities.organizationId, businessEntities.id],
    }).onDelete("restrict"),
    check(
      "entity_versions_positive_number_check",
      sql`${table.versionNumber} >= 1`,
    ),
    index("entity_versions_organization_id_idx").on(table.organizationId),
    index("entity_versions_entity_number_idx").on(
      table.businessEntityId,
      table.versionNumber,
    ),
  ],
);

export const changeSets = pgTable(
  "change_sets",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    changedByUserId: uuid("changed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    businessEntityId: uuid("business_entity_id").notNull(),
    beforeVersionId: uuid("before_version_id").notNull(),
    afterVersionId: uuid("after_version_id").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("change_sets_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "change_sets_organization_entity_fk",
      columns: [table.organizationId, table.businessEntityId],
      foreignColumns: [businessEntities.organizationId, businessEntities.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "change_sets_organization_before_version_fk",
      columns: [
        table.organizationId,
        table.businessEntityId,
        table.beforeVersionId,
      ],
      foreignColumns: [
        entityVersions.organizationId,
        entityVersions.businessEntityId,
        entityVersions.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "change_sets_organization_after_version_fk",
      columns: [
        table.organizationId,
        table.businessEntityId,
        table.afterVersionId,
      ],
      foreignColumns: [
        entityVersions.organizationId,
        entityVersions.businessEntityId,
        entityVersions.id,
      ],
    }).onDelete("restrict"),
    check(
      "change_sets_distinct_versions_check",
      sql`${table.beforeVersionId} <> ${table.afterVersionId}`,
    ),
    index("change_sets_organization_id_idx").on(table.organizationId),
    index("change_sets_changed_by_user_id_idx").on(table.changedByUserId),
    index("change_sets_entity_created_at_idx").on(
      table.businessEntityId,
      table.createdAt,
    ),
  ],
);

export const workflowDefinitions = pgTable(
  "workflow_definitions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    definitionKey: text("definition_key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    relatedProcessEntityId: uuid("related_process_entity_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("workflow_definitions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("workflow_definitions_organization_key_unique").on(
      table.organizationId,
      table.definitionKey,
    ),
    foreignKey({
      name: "workflow_definitions_organization_process_fk",
      columns: [table.organizationId, table.relatedProcessEntityId],
      foreignColumns: [businessEntities.organizationId, businessEntities.id],
    }).onDelete("restrict"),
    index("workflow_definitions_organization_id_idx").on(table.organizationId),
  ],
);

export const workflowVersions = pgTable(
  "workflow_versions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    workflowDefinitionId: uuid("workflow_definition_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    status: text("status").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("workflow_versions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("workflow_versions_organization_definition_number_unique").on(
      table.organizationId,
      table.workflowDefinitionId,
      table.versionNumber,
    ),
    foreignKey({
      name: "workflow_versions_organization_definition_fk",
      columns: [table.organizationId, table.workflowDefinitionId],
      foreignColumns: [
        workflowDefinitions.organizationId,
        workflowDefinitions.id,
      ],
    }).onDelete("restrict"),
    check(
      "workflow_versions_status_check",
      sql`${table.status} in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'RETIRED')`,
    ),
    check(
      "workflow_versions_positive_number_check",
      sql`${table.versionNumber} >= 1`,
    ),
    index("workflow_versions_organization_id_idx").on(table.organizationId),
  ],
);

export const workflowFieldDefinitions = pgTable(
  "workflow_field_definitions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    workflowVersionId: uuid("workflow_version_id").notNull(),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
    fieldType: text("field_type").notNull(),
    stepKey: text("step_key").notNull(),
    isRequired: boolean("is_required").notNull(),
    position: integer("position").notNull(),
    description: text("description"),
  },
  (table) => [
    unique("workflow_field_definitions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("workflow_field_definitions_version_key_unique").on(
      table.organizationId,
      table.workflowVersionId,
      table.fieldKey,
    ),
    foreignKey({
      name: "workflow_field_definitions_organization_version_fk",
      columns: [table.organizationId, table.workflowVersionId],
      foreignColumns: [workflowVersions.organizationId, workflowVersions.id],
    }).onDelete("restrict"),
    check(
      "workflow_field_definitions_type_check",
      sql`${table.fieldType} in ('TEXT', 'INTEGER', 'DATE')`,
    ),
    check(
      "workflow_field_definitions_position_check",
      sql`${table.position} >= 1`,
    ),
    index("workflow_field_definitions_version_idx").on(table.workflowVersionId),
  ],
);

export const workflowStepDefinitions = pgTable(
  "workflow_step_definitions",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    workflowVersionId: uuid("workflow_version_id").notNull(),
    stepKey: text("step_key").notNull(),
    name: text("name").notNull(),
    stepType: text("step_type").notNull(),
    assignedRole: text("assigned_role"),
    dueDays: integer("due_days"),
    position: integer("position").notNull(),
  },
  (table) => [
    unique("workflow_step_definitions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("workflow_step_definitions_version_key_unique").on(
      table.organizationId,
      table.workflowVersionId,
      table.stepKey,
    ),
    foreignKey({
      name: "workflow_step_definitions_organization_version_fk",
      columns: [table.organizationId, table.workflowVersionId],
      foreignColumns: [workflowVersions.organizationId, workflowVersions.id],
    }).onDelete("restrict"),
    check(
      "workflow_step_definitions_type_check",
      sql`${table.stepType} in ('INPUT', 'TASK', 'APPROVAL', 'END')`,
    ),
    check(
      "workflow_step_definitions_position_check",
      sql`${table.position} >= 1`,
    ),
    check(
      "workflow_step_definitions_due_days_check",
      sql`${table.dueDays} is null or ${table.dueDays} >= 0`,
    ),
    index("workflow_step_definitions_version_idx").on(table.workflowVersionId),
  ],
);

export const workflowCases = pgTable(
  "workflow_cases",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    workflowVersionId: uuid("workflow_version_id").notNull(),
    caseNumber: integer("case_number").notNull(),
    status: text("status").notNull(),
    currentStepKey: text("current_step_key").notNull(),
    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("workflow_cases_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("workflow_cases_organization_number_unique").on(
      table.organizationId,
      table.caseNumber,
    ),
    foreignKey({
      name: "workflow_cases_organization_version_fk",
      columns: [table.organizationId, table.workflowVersionId],
      foreignColumns: [workflowVersions.organizationId, workflowVersions.id],
    }).onDelete("restrict"),
    check(
      "workflow_cases_status_check",
      sql`${table.status} in ('DRAFT', 'RUNNING', 'WAITING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED')`,
    ),
    check(
      "workflow_cases_positive_number_check",
      sql`${table.caseNumber} >= 1`,
    ),
    index("workflow_cases_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("workflow_cases_initiated_by_user_id_idx").on(
      table.initiatedByUserId,
    ),
  ],
);

export const caseFieldValues = pgTable(
  "case_field_values",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    caseId: uuid("case_id").notNull(),
    fieldDefinitionId: uuid("field_definition_id").notNull(),
    value: text("value").notNull(),
    updatedByUserId: uuid("updated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("case_field_values_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("case_field_values_case_field_unique").on(
      table.organizationId,
      table.caseId,
      table.fieldDefinitionId,
    ),
    foreignKey({
      name: "case_field_values_organization_case_fk",
      columns: [table.organizationId, table.caseId],
      foreignColumns: [workflowCases.organizationId, workflowCases.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "case_field_values_organization_field_fk",
      columns: [table.organizationId, table.fieldDefinitionId],
      foreignColumns: [
        workflowFieldDefinitions.organizationId,
        workflowFieldDefinitions.id,
      ],
    }).onDelete("restrict"),
    index("case_field_values_case_id_idx").on(table.caseId),
  ],
);

export const workItems = pgTable(
  "work_items",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    caseId: uuid("case_id").notNull(),
    stepDefinitionId: uuid("step_definition_id").notNull(),
    title: text("title").notNull(),
    assignedUserId: uuid("assigned_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedRole: text("assigned_role").notNull(),
    status: text("status").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("work_items_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "work_items_organization_case_fk",
      columns: [table.organizationId, table.caseId],
      foreignColumns: [workflowCases.organizationId, workflowCases.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "work_items_organization_step_fk",
      columns: [table.organizationId, table.stepDefinitionId],
      foreignColumns: [
        workflowStepDefinitions.organizationId,
        workflowStepDefinitions.id,
      ],
    }).onDelete("restrict"),
    check(
      "work_items_status_check",
      sql`${table.status} in ('READY', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'CANCELLED', 'SKIPPED')`,
    ),
    index("work_items_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("work_items_assigned_user_id_idx").on(table.assignedUserId),
    index("work_items_case_id_idx").on(table.caseId),
  ],
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    caseId: uuid("case_id").notNull(),
    workItemId: uuid("work_item_id").notNull(),
    attempt: integer("attempt").notNull(),
    status: text("status").notNull(),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => [
    unique("approvals_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("approvals_organization_work_item_unique").on(
      table.organizationId,
      table.workItemId,
    ),
    foreignKey({
      name: "approvals_organization_case_fk",
      columns: [table.organizationId, table.caseId],
      foreignColumns: [workflowCases.organizationId, workflowCases.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "approvals_organization_work_item_fk",
      columns: [table.organizationId, table.workItemId],
      foreignColumns: [workItems.organizationId, workItems.id],
    }).onDelete("cascade"),
    check("approvals_attempt_check", sql`${table.attempt} >= 1`),
    check(
      "approvals_status_check",
      sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED')`,
    ),
    index("approvals_case_id_idx").on(table.caseId),
  ],
);

export const workflowActivities = pgTable(
  "workflow_activities",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    caseId: uuid("case_id").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    actorRole: text("actor_role"),
    activityType: text("activity_type").notNull(),
    summary: text("summary").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("workflow_activities_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "workflow_activities_organization_case_fk",
      columns: [table.organizationId, table.caseId],
      foreignColumns: [workflowCases.organizationId, workflowCases.id],
    }).onDelete("cascade"),
    index("workflow_activities_case_created_at_idx").on(
      table.caseId,
      table.createdAt,
    ),
  ],
);

export const communicationChannels = pgTable(
  "communication_channels",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    channelKey: text("channel_key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("communication_channels_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("communication_channels_organization_key_unique").on(
      table.organizationId,
      table.channelKey,
    ),
    index("communication_channels_organization_name_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const communicationMessages = pgTable(
  "communication_messages",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    channelId: uuid("channel_id").notNull(),
    authorUserId: uuid("author_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    authorDisplayName: text("author_display_name").notNull(),
    messageType: text("message_type").notNull(),
    body: text("body").notNull(),
    relatedCaseId: uuid("related_case_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
  },
  (table) => [
    unique("communication_messages_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "communication_messages_organization_channel_fk",
      columns: [table.organizationId, table.channelId],
      foreignColumns: [
        communicationChannels.organizationId,
        communicationChannels.id,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_messages_organization_case_fk",
      columns: [table.organizationId, table.relatedCaseId],
      foreignColumns: [workflowCases.organizationId, workflowCases.id],
    }).onDelete("restrict"),
    check(
      "communication_messages_type_check",
      sql`${table.messageType} in ('TEXT', 'CASE_SHARE', 'SYSTEM')`,
    ),
    index("communication_messages_channel_created_at_idx").on(
      table.channelId,
      table.createdAt,
    ),
    index("communication_messages_related_case_id_idx").on(table.relatedCaseId),
  ],
);
