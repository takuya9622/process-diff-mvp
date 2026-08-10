import type { BusinessEntity } from "@/types/business-entity";
import type { ChangeResult } from "@/types/change-set";
import type { RelationPathStep } from "@/types/relation";

export type DirectRelation = {
  relatedEntity: BusinessEntity;
  step: RelationPathStep;
};

export type WorkspaceNavigationEntity = Pick<
  BusinessEntity,
  "id" | "type" | "typeLabel" | "name" | "description"
>;

export type WorkspaceData = {
  selectedEntity: BusinessEntity;
  directRelations: DirectRelation[];
  changeResult: ChangeResult | null;
};
