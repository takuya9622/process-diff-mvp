import { describe, expect, it } from "vitest";

import { BUSINESS_ENTITY_TYPE_LABELS } from "@/constants/business-entity";
import {
  findDirectRelations,
  findImpactCandidates,
} from "@/lib/domain/impact-search";
import {
  CHANGE_TARGET_DEMO_ENTITY_KEY,
  DEMO_ENTITY_SEEDS,
  DEMO_RELATION_SEEDS,
} from "@/lib/server/database/seed-data";
import type { BusinessEntity } from "@/types/business-entity";
import type { BusinessRelation } from "@/types/relation";

const entities: BusinessEntity[] = DEMO_ENTITY_SEEDS.map((entity) => ({
  id: entity.key,
  type: entity.type,
  typeLabel: BUSINESS_ENTITY_TYPE_LABELS[entity.type],
  name: entity.name,
  description: entity.description,
  content: entity.content,
  currentVersionId: `${entity.key}-version-1`,
  currentVersionNumber: 1,
  updatedAt: "2026-08-09T00:00:00.000Z",
}));

const relations: BusinessRelation[] = DEMO_RELATION_SEEDS.map(
  (relation, index) => ({
    id: `relation-${index.toString().padStart(2, "0")}`,
    sourceEntityId: relation.sourceKey,
    targetEntityId: relation.targetKey,
    type: relation.type,
  }),
);

describe("findImpactCandidates", () => {
  it("基準シナリオで直接4件、2段階先6件を重複なく返す", () => {
    const candidates = findImpactCandidates(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
      entities,
      relations,
    );

    expect(
      candidates.filter((candidate) => candidate.distance === 1),
    ).toHaveLength(4);
    expect(
      candidates.filter((candidate) => candidate.distance === 2),
    ).toHaveLength(6);
    expect(
      new Set(candidates.map((candidate) => candidate.entity.id)),
    ).toHaveLength(10);
    expect(candidates.map((candidate) => candidate.entity.id)).not.toContain(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
    );
    expect(candidates.map((candidate) => candidate.entity.id)).not.toContain(
      "system-accounting",
    );
  });

  it("incomingとoutgoingを探索し、同距離の代表経路を固定規則で選ぶ", () => {
    const candidates = findImpactCandidates(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
      entities,
      relations,
    );
    const policy = candidates.find(
      (candidate) => candidate.entity.id === "document-expense-policy",
    );
    const submission = candidates.find(
      (candidate) => candidate.entity.id === "process-expense-submission",
    );
    const approvalRule = candidates.find(
      (candidate) => candidate.entity.id === "rule-approval-threshold",
    );

    expect(policy?.path[0].direction).toBe("forward");
    expect(submission?.path[0].direction).toBe("reverse");
    expect(approvalRule?.path.map((step) => step.toEntityId)).toEqual([
      "process-expense-submission",
      "rule-approval-threshold",
    ]);
  });

  it("入力順を変えても候補、順序、経路が変わらない", () => {
    const normal = findImpactCandidates(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
      entities,
      relations,
    );
    const reversed = findImpactCandidates(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
      [...entities].reverse(),
      [...relations].reverse(),
    );

    expect(reversed).toEqual(normal);
  });
});

describe("findDirectRelations", () => {
  it("変更前の詳細表示に必要な4件の直接関係を返す", () => {
    const directRelations = findDirectRelations(
      CHANGE_TARGET_DEMO_ENTITY_KEY,
      entities,
      relations,
    );

    expect(directRelations).toHaveLength(4);
    expect(
      directRelations.map((relation) => relation.relatedEntity.id),
    ).toEqual(
      expect.arrayContaining([
        "process-expense-submission",
        "process-receipt-review",
        "document-expense-policy",
        "document-expense-manual",
      ]),
    );
  });
});
