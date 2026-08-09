import type { BusinessEntity } from "@/types/business-entity";
import type { RelationPathStep } from "@/types/relation";

export type ImpactCandidate = {
  entity: BusinessEntity;
  distance: 1 | 2;
  distanceLabel: string;
  path: RelationPathStep[];
  reason: string;
};
