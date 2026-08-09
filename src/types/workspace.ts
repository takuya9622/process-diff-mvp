import type { BusinessEntity } from "@/types/business-entity";
import type { ChangeResult } from "@/types/change-set";
import type { RelationPathStep } from "@/types/relation";

export type DirectRelation = {
  relatedEntity: BusinessEntity;
  step: RelationPathStep;
};

export type WorkspaceData = {
  entities: BusinessEntity[];
  selectedEntity: BusinessEntity;
  directRelations: DirectRelation[];
  changeResult: ChangeResult | null;
  notice: string | null;
};
