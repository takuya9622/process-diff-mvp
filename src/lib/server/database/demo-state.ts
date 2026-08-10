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
  workflowCases,
  workflowDefinitions,
  workflowFieldDefinitions,
  workflowStepDefinitions,
  workflowVersions,
  entityVersions,
} from "@/lib/server/database/schema";
import {
  EXPENSE_WORKFLOW_FIELD_SEEDS,
  EXPENSE_WORKFLOW_KEY,
  EXPENSE_WORKFLOW_STEP_SEEDS,
} from "@/lib/server/database/workflow-seed-data";

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

      await insertDemoWorkflowState(
        transaction,
        organizationId,
        initialEntity.id,
      );

      return { initialEntityId: initialEntity.id, created: false };
    }

    const initialEntityId = await insertDemoState(transaction, organizationId);
    return { initialEntityId, created: true };
  });
}

export async function ensureDemoWorkflowState(organizationId: string) {
  return database.transaction(async (transaction) => {
    await lockOrganizationDemoState(transaction, organizationId);
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
      throw new Error("The initial demo process is missing.");
    }

    return insertDemoWorkflowState(
      transaction,
      organizationId,
      initialEntity.id,
    );
  });
}

export async function resetDemoState(organizationId: string) {
  return database.transaction(async (transaction) => {
    await lockOrganizationDemoState(transaction, organizationId);
    await transaction
      .delete(workflowCases)
      .where(eq(workflowCases.organizationId, organizationId));
    await transaction
      .delete(workflowFieldDefinitions)
      .where(eq(workflowFieldDefinitions.organizationId, organizationId));
    await transaction
      .delete(workflowStepDefinitions)
      .where(eq(workflowStepDefinitions.organizationId, organizationId));
    await transaction
      .delete(workflowVersions)
      .where(eq(workflowVersions.organizationId, organizationId));
    await transaction
      .delete(workflowDefinitions)
      .where(eq(workflowDefinitions.organizationId, organizationId));
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

  const initialEntityId = requireSeedId(
    entityIdsBySeedKey,
    INITIAL_DEMO_ENTITY_KEY,
  );
  await insertDemoWorkflowState(transaction, organizationId, initialEntityId);
  return initialEntityId;
}

async function insertDemoWorkflowState(
  transaction: DatabaseTransaction,
  organizationId: string,
  relatedProcessEntityId: string,
) {
  const [existingDefinition] = await transaction
    .select({ id: workflowDefinitions.id })
    .from(workflowDefinitions)
    .where(
      and(
        eq(workflowDefinitions.organizationId, organizationId),
        eq(workflowDefinitions.definitionKey, EXPENSE_WORKFLOW_KEY),
      ),
    )
    .limit(1);

  if (existingDefinition) {
    return existingDefinition.id;
  }

  const now = new Date();
  const workflowDefinitionId = randomUUID();
  const workflowVersionId = randomUUID();

  await transaction.insert(workflowDefinitions).values({
    id: workflowDefinitionId,
    organizationId,
    definitionKey: EXPENSE_WORKFLOW_KEY,
    name: "経費申請",
    description:
      "業務上立て替えた経費を申請し、承認と経理処理を経て完了します。",
    relatedProcessEntityId,
    createdAt: now,
  });
  await transaction.insert(workflowVersions).values({
    id: workflowVersionId,
    organizationId,
    workflowDefinitionId,
    versionNumber: 1,
    status: "PUBLISHED",
    publishedAt: now,
    createdAt: now,
  });
  await transaction.insert(workflowFieldDefinitions).values(
    EXPENSE_WORKFLOW_FIELD_SEEDS.map((field) => ({
      id: randomUUID(),
      organizationId,
      workflowVersionId,
      fieldKey: field.key,
      label: field.label,
      fieldType: field.type,
      stepKey: field.stepKey,
      isRequired: field.required,
      position: field.position,
      description: field.description,
    })),
  );
  await transaction.insert(workflowStepDefinitions).values(
    EXPENSE_WORKFLOW_STEP_SEEDS.map((step) => ({
      id: randomUUID(),
      organizationId,
      workflowVersionId,
      stepKey: step.key,
      name: step.name,
      stepType: step.type,
      assignedRole: step.assignedRole,
      dueDays: step.dueDays,
      position: step.position,
    })),
  );

  return workflowDefinitionId;
}

function requireSeedId(idsBySeedKey: ReadonlyMap<string, string>, key: string) {
  const id = idsBySeedKey.get(key);

  if (!id) {
    throw new Error(`Seed entity ${key} is not defined.`);
  }

  return id;
}
