import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EntityDetail } from "@/components/pages/business-workspace/entity-detail/entity-detail";
import type { RelationType } from "@/constants/relation";
import type { BusinessEntity } from "@/types/business-entity";
import type { DirectRelation } from "@/types/workspace";

const ENTITY: BusinessEntity = {
  id: "entity-1",
  type: "RULE",
  typeLabel: "ルール",
  name: "領収書提出ルール",
  description: "経費申請時の証憑提出ルール",
  content:
    "## 目的\n経費申請の証憑基準を統一する。\n\n## 提出基準\n- 領収書を添付する\n- 金額を確認する",
  currentVersionId: "version-7",
  currentVersionNumber: 7,
  updatedAt: "2026-08-09T00:00:00.000Z",
};

const PROCESS_ENTITY: BusinessEntity = {
  ...ENTITY,
  id: "process-expense-submission",
  type: "PROCESS",
  typeLabel: "業務",
  name: "経費申請",
  description: "従業員が経費を入力し、承認を依頼する業務",
};

afterEach(cleanup);

describe("EntityDetail", () => {
  it("通常利用では長文ページを主表示し、変更管理の情報を出さない", () => {
    const onEdit = vi.fn();

    render(
      <EntityDetail
        organizationSlug="example"
        entity={ENTITY}
        directRelations={[]}
        onEdit={onEdit}
        onNavigate={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "目的", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "提出基準", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("領収書を添付する")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "このページ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("v7")).not.toBeInTheDocument();
    expect(screen.queryByText("変更履歴")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "変更前後を確認" }),
    ).not.toBeInTheDocument();

    const editButton = screen.getByRole("button", {
      name: "変更案を作成",
    });
    expect(editButton).toHaveClass("bg-surface");
    expect(editButton).not.toHaveClass("bg-action-primary");

    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("業務では直接関係を意味ごとに分類して表示する", () => {
    const relations = [
      createDirectRelation("RULE", "領収書提出ルール", "GOVERNED_BY"),
      createDirectRelation("RULE", "金額別承認ルール", "GOVERNED_BY"),
      createDirectRelation("SYSTEM", "経費申請システム", "USES"),
      createDirectRelation("ROLE", "申請者", "OWNED_BY"),
      createDirectRelation("ROLE", "承認者", "APPROVED_BY"),
      createDirectRelation("DOCUMENT", "経費申請マニュアル", "REFERENCES"),
      createDirectRelation("PROCESS", "証憑確認", "REQUIRES", "reverse"),
    ];

    render(
      <EntityDetail
        organizationSlug="example"
        entity={PROCESS_ENTITY}
        directRelations={relations}
        onNavigate={() => undefined}
      />,
    );

    const relationRegion = screen.getByRole("region", { name: "業務の構成" });
    expect(
      within(relationRegion)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["ルール", "使用システム", "担当・承認", "関連文書", "後工程"]);
    expect(
      within(relationRegion).getByRole("link", { name: /領収書提出ルール/ }),
    ).toBeInTheDocument();
    expect(
      within(relationRegion).getByRole("link", { name: /証憑確認/ }),
    ).toBeInTheDocument();
  });

  it("業務以外の要素では関係する業務を先に表示する", () => {
    const relations = [
      createDirectRelation(
        "DOCUMENT",
        "経費規程",
        "GOVERNED_BY",
        "forward",
        ENTITY,
      ),
      createDirectRelation(
        "PROCESS",
        "経費申請",
        "GOVERNED_BY",
        "reverse",
        ENTITY,
      ),
    ];

    render(
      <EntityDetail
        organizationSlug="example"
        entity={ENTITY}
        directRelations={relations}
        onNavigate={() => undefined}
      />,
    );

    const relationRegion = screen.getByRole("region", { name: "関連項目" });
    expect(
      within(relationRegion)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["関係する業務", "関連文書"]);
  });
});

function createDirectRelation(
  type: BusinessEntity["type"],
  name: string,
  relationType: RelationType,
  direction: DirectRelation["step"]["direction"] = "forward",
  originEntity: BusinessEntity = PROCESS_ENTITY,
): DirectRelation {
  const relatedEntity = {
    ...ENTITY,
    id: `related-${name}`,
    type,
    typeLabel: type,
    name,
  };
  const sourceEntity = direction === "forward" ? originEntity : relatedEntity;
  const targetEntity = direction === "forward" ? relatedEntity : originEntity;

  return {
    relatedEntity,
    step: {
      relationId: `relation-${name}`,
      relationType,
      direction,
      fromEntityId: originEntity.id,
      toEntityId: relatedEntity.id,
      sourceEntityId: sourceEntity.id,
      targetEntityId: targetEntity.id,
      fromEntityName: originEntity.name,
      toEntityName: relatedEntity.name,
      toEntityType: relatedEntity.type,
      toEntityTypeLabel: relatedEntity.typeLabel,
      description: `${originEntity.name}と${relatedEntity.name}の関係`,
    },
  };
}
