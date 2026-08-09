import { randomUUID } from "node:crypto";

import { count, eq, sql } from "drizzle-orm";

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

export async function seedDemoState() {
  return database.transaction(async (transaction) => {
    await lockDemoTables(transaction);
    const [{ entityCount }] = await transaction
      .select({ entityCount: count() })
      .from(businessEntities);

    if (entityCount > 0) {
      const [initialEntity] = await transaction
        .select({ id: businessEntities.id })
        .from(businessEntities)
        .where(eq(businessEntities.name, INITIAL_DEMO_ENTITY_NAME))
        .limit(1);

      if (!initialEntity) {
        throw new Error(
          "The database contains data but the initial demo entity is missing.",
        );
      }

      return { initialEntityId: initialEntity.id, created: false };
    }

    const initialEntityId = await insertDemoState(transaction);
    return { initialEntityId, created: true };
  });
}

export async function resetDemoState() {
  return database.transaction(async (transaction) => {
    await lockDemoTables(transaction);
    await transaction.delete(changeSets);
    await transaction.delete(entityVersions);
    await transaction.delete(businessRelations);
    await transaction.delete(businessEntities);

    return {
      initialEntityId: await insertDemoState(transaction),
    };
  });
}

async function lockDemoTables(transaction: DatabaseTransaction) {
  await transaction.execute(
    sql`lock table change_sets, entity_versions, relations, business_entities in access exclusive mode`,
  );
}

async function insertDemoState(transaction: DatabaseTransaction) {
  const now = new Date();
  const entityIdsBySeedKey = new Map(
    DEMO_ENTITY_SEEDS.map((entity) => [entity.key, randomUUID()]),
  );

  await transaction.insert(businessEntities).values(
    DEMO_ENTITY_SEEDS.map((entity) => ({
      id: requireSeedId(entityIdsBySeedKey, entity.key),
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
      businessEntityId: requireSeedId(entityIdsBySeedKey, entity.key),
      versionNumber: 1,
      content: entity.content,
      createdAt: now,
    })),
  );

  await transaction.insert(businessRelations).values(
    DEMO_RELATION_SEEDS.map((relation) => ({
      id: randomUUID(),
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
