import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiffView } from "@/components/general/diff-view";

describe("DiffView", () => {
  it("色に依存せず追加、削除、変更なしを読み取れる", () => {
    render(
      <DiffView
        diff={[
          {
            status: "removed",
            content: "変更前の内容",
            beforeLineNumber: 1,
            afterLineNumber: null,
          },
          {
            status: "added",
            content: "変更後の内容",
            beforeLineNumber: null,
            afterLineNumber: 1,
          },
          {
            status: "unchanged",
            content: "同じ内容",
            beforeLineNumber: 2,
            afterLineNumber: 2,
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("削除: 変更前の内容")).toBeInTheDocument();
    expect(screen.getByLabelText("追加: 変更後の内容")).toBeInTheDocument();
    expect(screen.getByLabelText("変更なし: 同じ内容")).toBeInTheDocument();
  });
});
