import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiffView } from "@/components/general/diff-view";
import type { DiffLine } from "@/types/diff";

describe("DiffView", () => {
  it("長い変更なし区間を折りたたみ、変更行の前後だけを最初に表示する", () => {
    const unchangedBefore = createUnchangedLines(1, 12);
    const unchangedAfter = createUnchangedLines(14, 12);
    const diff: DiffLine[] = [
      ...unchangedBefore,
      {
        status: "removed",
        content: "変更前",
        beforeLineNumber: 13,
        afterLineNumber: null,
      },
      {
        status: "added",
        content: "変更後",
        beforeLineNumber: null,
        afterLineNumber: 13,
      },
      ...unchangedAfter,
    ];

    render(<DiffView diff={diff} />);

    expect(screen.getByLabelText("削除: 変更前")).toBeVisible();
    expect(screen.getByLabelText("追加: 変更後")).toBeVisible();
    expect(screen.getAllByText(/変更なしの 9 行を/)).toHaveLength(2);
    expect(screen.getByLabelText("変更なし: 変更なし 1")).not.toBeVisible();

    fireEvent.click(screen.getAllByText(/変更なしの 9 行を/)[0]);
    expect(screen.getByLabelText("変更なし: 変更なし 1")).toBeVisible();
  });
});

function createUnchangedLines(start: number, count: number): DiffLine[] {
  return Array.from({ length: count }, (_, index) => {
    const lineNumber = start + index;

    return {
      status: "unchanged" as const,
      content: `変更なし ${lineNumber}`,
      beforeLineNumber: lineNumber,
      afterLineNumber: lineNumber,
    };
  });
}
