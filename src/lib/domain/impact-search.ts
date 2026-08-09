import { BUSINESS_ENTITY_TYPE_ORDER } from "@/constants/business-entity";
import { IMPACT_SEARCH_MAX_DEPTH } from "@/constants/demo";
import { RELATION_TYPE_ORDER } from "@/constants/relation";
import type { BusinessEntity } from "@/types/business-entity";
import type { ImpactCandidate } from "@/types/impact";
import type {
  BusinessRelation,
  RelationPathStep,
  RelationTraversalDirection,
} from "@/types/relation";

type TraversalEdge = {
  relation: BusinessRelation;
  direction: RelationTraversalDirection;
  fromEntityId: string;
  toEntityId: string;
};

type QueueEntry = {
  entityId: string;
  distance: number;
  path: TraversalEdge[];
};

const japaneseCollator = new Intl.Collator("ja", {
  numeric: true,
  sensitivity: "variant",
});

export function describeRelation(
  relation: BusinessRelation,
  entitiesById: ReadonlyMap<string, BusinessEntity>,
) {
  const source = entitiesById.get(relation.sourceEntityId);
  const target = entitiesById.get(relation.targetEntityId);

  if (!source || !target) {
    throw new Error(`Relation ${relation.id} references an unknown entity.`);
  }

  switch (relation.type) {
    case "REQUIRES":
      return `${source.name}は${target.name}を前提とする`;
    case "REFERENCES":
      return `${source.name}は${target.name}を参照する`;
    case "GOVERNED_BY":
      return `${source.name}は${target.name}に従う`;
    case "USES":
      return `${source.name}は${target.name}を使用する`;
    case "OWNED_BY":
      return `${source.name}は${target.name}が担当する`;
    case "APPROVED_BY":
      return `${source.name}は${target.name}が承認する`;
    case "PRODUCES":
      return `${source.name}は${target.name}を生成する`;
  }
}

export function findImpactCandidates(
  originEntityId: string,
  entities: BusinessEntity[],
  relations: BusinessRelation[],
): ImpactCandidate[] {
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const origin = entitiesById.get(originEntityId);

  if (!origin) {
    throw new Error(`Impact origin ${originEntityId} was not found.`);
  }

  const adjacency = createAdjacencyList(relations, entitiesById);
  const visited = new Set([originEntityId]);
  const queue: QueueEntry[] = [
    { entityId: originEntityId, distance: 0, path: [] },
  ];
  const candidates: ImpactCandidate[] = [];

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const current = queue[queueIndex];

    if (current.distance >= IMPACT_SEARCH_MAX_DEPTH) {
      continue;
    }

    for (const edge of adjacency.get(current.entityId) ?? []) {
      if (visited.has(edge.toEntityId)) {
        continue;
      }

      visited.add(edge.toEntityId);
      const distance = current.distance + 1;
      const path = [...current.path, edge];
      const entity = entitiesById.get(edge.toEntityId);

      if (!entity) {
        continue;
      }

      const displayPath = path.map((pathEdge) =>
        toPathStep(pathEdge, entitiesById),
      );

      candidates.push({
        entity,
        distance: distance as 1 | 2,
        distanceLabel: distance === 1 ? "直接関係" : "2段階先の関連項目",
        path: displayPath,
        reason: displayPath.map((step) => step.description).join(" → "),
      });
      queue.push({ entityId: entity.id, distance, path });
    }
  }

  return candidates.sort(compareImpactCandidates);
}

export function findDirectRelations(
  originEntityId: string,
  entities: BusinessEntity[],
  relations: BusinessRelation[],
) {
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const adjacency = createAdjacencyList(relations, entitiesById);

  return (adjacency.get(originEntityId) ?? []).map((edge) => {
    const relatedEntity = entitiesById.get(edge.toEntityId);

    if (!relatedEntity) {
      throw new Error(
        `Relation ${edge.relation.id} references an unknown entity.`,
      );
    }

    return {
      relatedEntity,
      step: toPathStep(edge, entitiesById),
    };
  });
}

function createAdjacencyList(
  relations: BusinessRelation[],
  entitiesById: ReadonlyMap<string, BusinessEntity>,
) {
  const adjacency = new Map<string, TraversalEdge[]>();

  for (const relation of relations) {
    addEdge(adjacency, {
      relation,
      direction: "forward",
      fromEntityId: relation.sourceEntityId,
      toEntityId: relation.targetEntityId,
    });
    addEdge(adjacency, {
      relation,
      direction: "reverse",
      fromEntityId: relation.targetEntityId,
      toEntityId: relation.sourceEntityId,
    });
  }

  for (const edges of adjacency.values()) {
    edges.sort((left, right) =>
      compareTraversalEdges(left, right, entitiesById),
    );
  }

  return adjacency;
}

function addEdge(adjacency: Map<string, TraversalEdge[]>, edge: TraversalEdge) {
  const edges = adjacency.get(edge.fromEntityId) ?? [];
  edges.push(edge);
  adjacency.set(edge.fromEntityId, edges);
}

function compareTraversalEdges(
  left: TraversalEdge,
  right: TraversalEdge,
  entitiesById: ReadonlyMap<string, BusinessEntity>,
) {
  const relationOrder =
    RELATION_TYPE_ORDER[left.relation.type] -
    RELATION_TYPE_ORDER[right.relation.type];

  if (relationOrder !== 0) {
    return relationOrder;
  }

  const directionOrder =
    Number(left.direction === "reverse") -
    Number(right.direction === "reverse");

  if (directionOrder !== 0) {
    return directionOrder;
  }

  const leftEntity = entitiesById.get(left.toEntityId);
  const rightEntity = entitiesById.get(right.toEntityId);

  if (!leftEntity || !rightEntity) {
    return left.toEntityId.localeCompare(right.toEntityId);
  }

  return (
    BUSINESS_ENTITY_TYPE_ORDER[leftEntity.type] -
      BUSINESS_ENTITY_TYPE_ORDER[rightEntity.type] ||
    compareNames(leftEntity.name, rightEntity.name) ||
    leftEntity.id.localeCompare(rightEntity.id) ||
    left.relation.id.localeCompare(right.relation.id)
  );
}

function compareImpactCandidates(
  left: ImpactCandidate,
  right: ImpactCandidate,
) {
  return (
    left.distance - right.distance ||
    BUSINESS_ENTITY_TYPE_ORDER[left.entity.type] -
      BUSINESS_ENTITY_TYPE_ORDER[right.entity.type] ||
    compareNames(left.entity.name, right.entity.name) ||
    left.entity.id.localeCompare(right.entity.id)
  );
}

function compareNames(left: string, right: string) {
  return japaneseCollator.compare(
    left.normalize("NFC"),
    right.normalize("NFC"),
  );
}

function toPathStep(
  edge: TraversalEdge,
  entitiesById: ReadonlyMap<string, BusinessEntity>,
): RelationPathStep {
  const fromEntity = entitiesById.get(edge.fromEntityId);
  const toEntity = entitiesById.get(edge.toEntityId);

  if (!fromEntity || !toEntity) {
    throw new Error(
      `Relation ${edge.relation.id} references an unknown entity.`,
    );
  }

  return {
    relationId: edge.relation.id,
    relationType: edge.relation.type,
    direction: edge.direction,
    fromEntityId: edge.fromEntityId,
    toEntityId: edge.toEntityId,
    sourceEntityId: edge.relation.sourceEntityId,
    targetEntityId: edge.relation.targetEntityId,
    fromEntityName: fromEntity.name,
    toEntityName: toEntity.name,
    toEntityType: toEntity.type,
    toEntityTypeLabel: toEntity.typeLabel,
    description: describeRelation(edge.relation, entitiesById),
  };
}
