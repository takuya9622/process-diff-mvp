import type { DiffLine, DiffSummary } from "@/types/diff";
import type { ImpactCandidate } from "@/types/impact";

export type ChangeResult = {
  id: string;
  businessEntityId: string;
  beforeVersionId: string;
  afterVersionId: string;
  beforeContent: string;
  afterContent: string;
  reason: string | null;
  changedByName: string;
  createdAt: string;
  diff: DiffLine[];
  diffSummary: DiffSummary;
  impactCandidates: ImpactCandidate[];
};
