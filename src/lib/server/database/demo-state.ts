import { randomUUID } from "node:crypto";

import { and, count, eq, sql } from "drizzle-orm";

import { INITIAL_DEMO_ENTITY_NAME } from "@/constants/demo";
import { database } from "@/lib/server/database/client";
import {
  DEMO_ENTITY_SEEDS,
  DEMO_RELATION_SEEDS,
  INITIAL_DEMO_ENTITY_KEY,
} from "@/lib/server/database/seed-data";
import {
  businessEntities,
  businessRelations,
  changeSets,
  entityVersions,
} from "@/lib/server/database/schema";

type DatabaseTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0];

export async function seedDemoState(organizationId: string) {
  return database.transaction(async (transaction) => {
    await lockOrganizationDemoState(transaction, organizationId);
    const [{ entityCount }] = await transaction
      .select({ entityCount: count() })
      .from(businessEntities)
      .where(eq(businessEntities.organizationId, organizationId));

    if (entityCount > 0) {
      const [initialEntity] = await transaction
        .select({ id: businessEntities.id })
        .from(businessEntities)
        .where(
          and(
            eq(businessEntities.organizationId, organizationId),
            eq(businessEntities.name, INITIAL_DEMO_ENTITY_NAME),
          ),
        )
        .limit(1);

      if (!initialEntity) {
        throw new Error(
          "The database contains data but the initial demo entity is missing.",
        );
      }

      return { initialEntityId: initialEntity.id, created: false };
    }

    const initialEntityId = await insertDemoState(transaction, organizationId);
    return { initialEntityId, created: true };
  });
}

export async function resetDemoState(organizationId: string) {
  return database.transaction(async (transaction) => {
    await lockOrganizationDemoState(transaction, organizationId);
    await transaction
      .delete(changeSets)
      .where(eq(changeSets.organizationId, organizationId));
    await transaction
      .delete(entityVersions)
      .where(eq(entityVersions.organizationId, organizationId));
    await transaction
      .delete(businessRelations)
      .where(eq(businessRelations.organizationId, organizationId));
    await transaction
      .delete(businessEntities)
      .where(eq(businessEntities.organizationId, organizationId));

    return {
      initialEntityId: await insertDemoState(transaction, organizationId),
    };
  });
}

async function lockOrganizationDemoState(
  transaction: DatabaseTransaction,
  organizationId: string,
) {
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`,
  );
}

async function insertDemoState(
  transaction: DatabaseTransaction,
  organizationId: string,
) {
  const now = new Date();
  const entityIdsBySeedKey = new Map(
    DEMO_ENTITY_SEEDS.map((entity) => [entity.key, randomUUID()]),
  );

  await transaction.insert(businessEntities).values(
    DEMO_ENTITY_SEEDS.map((entity) => ({
      id: requireSeedId(entityIdsBySeedKey, entity.key),
      organizationId,
      entityType: entity.type,
      name: entity.name,
      description: entity.description,
      currentContent: entity.content,
      createdAt: now,
      updatedAt: now,
    })),
  );

  await transaction.insert(entityVersions).values(
    DEMO_ENTITY_SEEDS.map((entity) => ({
      id: randomUUID(),
      organizationId,
      businessEntityId: requireSeedId(entityIdsBySeedKey, entity.key),
      versionNumber: 1,
      content: entity.content,
      createdAt: now,
    })),
  );

  await transaction.insert(businessRelations).values(
    DEMO_RELATION_SEEDS.map((relation) => ({
      id: randomUUID(),
      organizationId,
      sourceEntityId: requireSeedId(entityIdsBySeedKey, relation.sourceKey),
      targetEntityId: requireSeedId(entityIdsBySeedKey, relation.targetKey),
      relationType: relation.type,
      createdAt: now,
    })),
  );

  return requireSeedId(entityIdsBySeedKey, INITIAL_DEMO_ENTITY_KEY);
}

function requireSeedId(idsBySeedKey: ReadonlyMap<string, string>, key: string) {
  const id = idsBySeedKey.get(key);

  if (!id) {
    throw new Error(`Seed entity ${key} is not defined.`);
  }

  return id;
}
