import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const businessEntities = pgTable(
  "business_entities",
  {
    id: uuid("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    currentContent: text("current_content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "business_entities_entity_type_check",
      sql`${table.entityType} in ('PROCESS', 'RULE', 'DOCUMENT', 'ROLE', 'SYSTEM')`,
    ),
    index("business_entities_entity_type_idx").on(table.entityType),
  ],
);

export const businessRelations = pgTable(
  "relations",
  {
    id: uuid("id").primaryKey(),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    targetEntityId: uuid("target_entity_id")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    relationType: text("relation_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("relations_source_target_type_unique").on(
      table.sourceEntityId,
      table.targetEntityId,
      table.relationType,
    ),
    check(
      "relations_relation_type_check",
      sql`${table.relationType} in ('REQUIRES', 'REFERENCES', 'GOVERNED_BY', 'USES', 'OWNED_BY', 'APPROVED_BY', 'PRODUCES')`,
    ),
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
    businessEntityId: uuid("business_entity_id")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("entity_versions_entity_number_unique").on(
      table.businessEntityId,
      table.versionNumber,
    ),
    check(
      "entity_versions_positive_number_check",
      sql`${table.versionNumber} >= 1`,
    ),
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
    businessEntityId: uuid("business_entity_id")
      .notNull()
      .references(() => businessEntities.id, { onDelete: "restrict" }),
    beforeVersionId: uuid("before_version_id")
      .notNull()
      .references(() => entityVersions.id, { onDelete: "restrict" }),
    afterVersionId: uuid("after_version_id")
      .notNull()
      .references(() => entityVersions.id, { onDelete: "restrict" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "change_sets_distinct_versions_check",
      sql`${table.beforeVersionId} <> ${table.afterVersionId}`,
    ),
    index("change_sets_entity_created_at_idx").on(
      table.businessEntityId,
      table.createdAt,
    ),
  ],
);
