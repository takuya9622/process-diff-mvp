import type { RelationType } from "@/constants/relation";
import type { BusinessEntityType } from "@/constants/business-entity";

export type BusinessRelation = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationType;
};

export type RelationTraversalDirection = "forward" | "reverse";

export type RelationPathStep = {
  relationId: string;
  relationType: RelationType;
  direction: RelationTraversalDirection;
  fromEntityId: string;
  toEntityId: string;
  sourceEntityId: string;
  targetEntityId: string;
  fromEntityName: string;
  toEntityName: string;
  toEntityType: BusinessEntityType;
  toEntityTypeLabel: string;
  description: string;
};
