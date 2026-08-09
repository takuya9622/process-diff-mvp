import { desc, eq } from "drizzle-orm";

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

export async function getWorkspaceData(input: {
  entityId?: string;
  changeSetId?: string;
}): Promise<WorkspaceData> {
  const [entityRows, relationRows, versionRows] = await Promise.all([
    database.select().from(businessEntities),
    database.select().from(businessRelations),
    database
      .select()
      .from(entityVersions)
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
      throw new Error(`Business entity ${entity.id} does not have a version.`);
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
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const initialEntity =
    entities.find((entity) => entity.name === INITIAL_DEMO_ENTITY_NAME) ??
    entities[0];
  const changeResult = await getChangeResult(
    input.changeSetId,
    entities,
    relations,
    entitiesById,
    versionsById,
  );
  const selectedEntity =
    (changeResult && entitiesById.get(changeResult.businessEntityId)) ||
    (isUuid(input.entityId) && entitiesById.get(input.entityId)) ||
    initialEntity;
  const notice = createLookupNotice(input, changeResult, entitiesById);

  return {
    entities,
    selectedEntity,
    directRelations: findDirectRelations(
      selectedEntity.id,
      entities,
      relations,
    ),
    changeResult,
    notice,
  };
}

async function getChangeResult(
  changeSetId: string | undefined,
  entities: BusinessEntity[],
  relations: BusinessRelation[],
  entitiesById: ReadonlyMap<string, BusinessEntity>,
  versionsById: ReadonlyMap<string, typeof entityVersions.$inferSelect>,
): Promise<ChangeResult | null> {
  if (!isUuid(changeSetId)) {
    return null;
  }

  const [changeSet] = await database
    .select()
    .from(changeSets)
    .where(eq(changeSets.id, changeSetId))
    .limit(1);

  if (!changeSet || !entitiesById.has(changeSet.businessEntityId)) {
    return null;
  }

  const beforeVersion = versionsById.get(changeSet.beforeVersionId);
  const afterVersion = versionsById.get(changeSet.afterVersionId);

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
    createdAt: changeSet.createdAt.toISOString(),
    diff,
    diffSummary: summarizeLineDiff(diff),
    impactCandidates: findImpactCandidates(
      changeSet.businessEntityId,
      entities,
      relations,
    ),
  };
}

function createLookupNotice(
  input: { entityId?: string; changeSetId?: string },
  changeResult: ChangeResult | null,
  entitiesById: ReadonlyMap<string, BusinessEntity>,
) {
  if (input.changeSetId && !changeResult) {
    return "指定された変更結果は見つかりませんでした。サンプルがリセットされた可能性があります。";
  }

  if (
    input.entityId &&
    (!isUuid(input.entityId) || !entitiesById.has(input.entityId))
  ) {
    return "指定された業務要素は見つかりませんでした。デモの初期項目を表示しています。";
  }

  return null;
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
