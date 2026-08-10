import { cache } from "react";
import { and, desc, eq } from "drizzle-orm";

import {
  BUSINESS_ENTITY_TYPE_LABELS,
  BUSINESS_ENTITY_TYPE_ORDER,
  isBusinessEntityType,
} from "@/constants/business-entity";
import { INITIAL_DEMO_ENTITY_NAME } from "@/constants/demo";
import { isRelationType } from "@/constants/relation";
import { isUuid } from "@/lib/domain/identifier";
import {
  findDirectRelations,
  findImpactCandidates,
} from "@/lib/domain/impact-search";
import { createLineDiff, summarizeLineDiff } from "@/lib/domain/line-diff";
import { database } from "@/lib/server/database/client";
import { users } from "@/lib/server/database/auth-schema.generated";
import {
  businessEntities,
  businessRelations,
  changeSets,
  entityVersions,
} from "@/lib/server/database/schema";
import type { BusinessEntity } from "@/types/business-entity";
import type { ChangeResult } from "@/types/change-set";
import type { BusinessRelation } from "@/types/relation";
import type { WorkspaceData } from "@/types/workspace";

const japaneseCollator = new Intl.Collator("ja", {
  numeric: true,
  sensitivity: "variant",
});

type WorkspaceModel = {
  entities: BusinessEntity[];
  relations: BusinessRelation[];
  entitiesById: ReadonlyMap<string, BusinessEntity>;
  versionsById: ReadonlyMap<string, typeof entityVersions.$inferSelect>;
};

export async function getWorkspaceNavigationEntities(organizationId: string) {
  return (await loadWorkspaceModel(organizationId)).entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    typeLabel: entity.typeLabel,
    name: entity.name,
    description: entity.description,
  }));
}

export async function getInitialWorkspaceEntityId(organizationId: string) {
  const { entities } = await loadWorkspaceModel(organizationId);
  return findInitialEntity(entities).id;
}

export async function getEntityWorkspaceData(
  organizationId: string,
  businessEntityId: string,
): Promise<WorkspaceData | null> {
  if (!isUuid(businessEntityId)) {
    return null;
  }

  const model = await loadWorkspaceModel(organizationId);
  const selectedEntity = model.entitiesById.get(businessEntityId);

  if (!selectedEntity) {
    return null;
  }

  return createWorkspaceData(model, selectedEntity, null);
}

export async function getChangeWorkspaceData(
  organizationId: string,
  changeSetId: string,
): Promise<WorkspaceData | null> {
  if (!isUuid(changeSetId)) {
    return null;
  }

  const model = await loadWorkspaceModel(organizationId);
  const changeResult = await getChangeResult(
    organizationId,
    changeSetId,
    model,
  );

  if (!changeResult) {
    return null;
  }

  const selectedEntity = model.entitiesById.get(changeResult.businessEntityId);

  if (!selectedEntity) {
    return null;
  }

  return createWorkspaceData(model, selectedEntity, changeResult);
}

const loadWorkspaceModel = cache(
  async (organizationId: string): Promise<WorkspaceModel> => {
    const [entityRows, relationRows, versionRows] = await Promise.all([
      database
        .select()
        .from(businessEntities)
        .where(eq(businessEntities.organizationId, organizationId)),
      database
        .select()
        .from(businessRelations)
        .where(eq(businessRelations.organizationId, organizationId)),
      database
        .select()
        .from(entityVersions)
        .where(eq(entityVersions.organizationId, organizationId))
        .orderBy(desc(entityVersions.versionNumber)),
    ]);

    const versionsById = new Map(
      versionRows.map((version) => [version.id, version]),
    );
    const currentVersionsByEntityId = new Map<
      string,
      (typeof versionRows)[number]
    >();

    for (const version of versionRows) {
      if (!currentVersionsByEntityId.has(version.businessEntityId)) {
        currentVersionsByEntityId.set(version.businessEntityId, version);
      }
    }

    const entities = entityRows.map((entity): BusinessEntity => {
      if (!isBusinessEntityType(entity.entityType)) {
        throw new Error(`Unknown business entity type: ${entity.entityType}`);
      }

      const currentVersion = currentVersionsByEntityId.get(entity.id);

      if (!currentVersion) {
        throw new Error(
          `Business entity ${entity.id} does not have a version.`,
        );
      }

      return {
        id: entity.id,
        type: entity.entityType,
        typeLabel: BUSINESS_ENTITY_TYPE_LABELS[entity.entityType],
        name: entity.name,
        description: entity.description,
        content: entity.currentContent,
        currentVersionId: currentVersion.id,
        currentVersionNumber: currentVersion.versionNumber,
        updatedAt: entity.updatedAt.toISOString(),
      };
    });

    entities.sort(compareEntities);

    if (entities.length === 0) {
      throw new Error(
        "Demo data is empty. Run the database seed before opening the app.",
      );
    }

    const relations = relationRows.map((relation): BusinessRelation => {
      if (!isRelationType(relation.relationType)) {
        throw new Error(`Unknown relation type: ${relation.relationType}`);
      }

      return {
        id: relation.id,
        sourceEntityId: relation.sourceEntityId,
        targetEntityId: relation.targetEntityId,
        type: relation.relationType,
      };
    });

    return {
      entities,
      relations,
      entitiesById: new Map(entities.map((entity) => [entity.id, entity])),
      versionsById,
    };
  },
);

function createWorkspaceData(
  model: WorkspaceModel,
  selectedEntity: BusinessEntity,
  changeResult: ChangeResult | null,
): WorkspaceData {
  return {
    selectedEntity,
    directRelations: findDirectRelations(
      selectedEntity.id,
      model.entities,
      model.relations,
    ),
    changeResult,
  };
}

async function getChangeResult(
  organizationId: string,
  changeSetId: string,
  model: WorkspaceModel,
): Promise<ChangeResult | null> {
  const [row] = await database
    .select({ changeSet: changeSets, changedByName: users.name })
    .from(changeSets)
    .innerJoin(users, eq(changeSets.changedByUserId, users.id))
    .where(
      and(
        eq(changeSets.organizationId, organizationId),
        eq(changeSets.id, changeSetId),
      ),
    )
    .limit(1);

  if (!row || !model.entitiesById.has(row.changeSet.businessEntityId)) {
    return null;
  }

  const { changeSet, changedByName } = row;

  const beforeVersion = model.versionsById.get(changeSet.beforeVersionId);
  const afterVersion = model.versionsById.get(changeSet.afterVersionId);

  if (!beforeVersion || !afterVersion) {
    throw new Error(`Change set ${changeSet.id} references a missing version.`);
  }

  const diff = createLineDiff(beforeVersion.content, afterVersion.content);

  return {
    id: changeSet.id,
    businessEntityId: changeSet.businessEntityId,
    beforeVersionId: changeSet.beforeVersionId,
    afterVersionId: changeSet.afterVersionId,
    beforeContent: beforeVersion.content,
    afterContent: afterVersion.content,
    reason: changeSet.reason,
    changedByName,
    createdAt: changeSet.createdAt.toISOString(),
    diff,
    diffSummary: summarizeLineDiff(diff),
    impactCandidates: findImpactCandidates(
      changeSet.businessEntityId,
      model.entities,
      model.relations,
    ),
  };
}

function findInitialEntity(entities: BusinessEntity[]) {
  return (
    entities.find((entity) => entity.name === INITIAL_DEMO_ENTITY_NAME) ??
    entities[0]
  );
}

function compareEntities(left: BusinessEntity, right: BusinessEntity) {
  return (
    BUSINESS_ENTITY_TYPE_ORDER[left.type] -
      BUSINESS_ENTITY_TYPE_ORDER[right.type] ||
    japaneseCollator.compare(
      left.name.normalize("NFC"),
      right.name.normalize("NFC"),
    ) ||
    left.id.localeCompare(right.id)
  );
}
