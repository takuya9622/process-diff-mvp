import { sql } from "drizzle-orm";
import {
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
