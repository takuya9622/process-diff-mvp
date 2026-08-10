import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EntityDetail } from "@/components/pages/business-workspace/entity-detail/entity-detail";
import type { BusinessEntity } from "@/types/business-entity";

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
});
