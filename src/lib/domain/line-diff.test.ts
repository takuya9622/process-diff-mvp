import { describe, expect, it } from "vitest";

import { createLineDiff, summarizeLineDiff } from "@/lib/domain/line-diff";

describe("createLineDiff", () => {
  it("基準シナリオの変更行を削除と追加、同じ行を変更なしとして返す", () => {
    const before =
      "経費が3,000円以上の場合、領収書を添付する。\n紙の領収書は申請後30日間保管する。";
    const after =
      "金額にかかわらず、すべての経費申請に領収書を添付する。\n紙の領収書は申請後30日間保管する。";

    const diff = createLineDiff(before, after);

    expect(diff).toEqual([
      {
        status: "removed",
        content: "経費が3,000円以上の場合、領収書を添付する。",
        beforeLineNumber: 1,
        afterLineNumber: null,
      },
      {
        status: "added",
        content: "金額にかかわらず、すべての経費申請に領収書を添付する。",
        beforeLineNumber: null,
        afterLineNumber: 1,
      },
      {
        status: "unchanged",
        content: "紙の領収書は申請後30日間保管する。",
        beforeLineNumber: 2,
        afterLineNumber: 2,
      },
    ]);
    expect(summarizeLineDiff(diff)).toEqual({
      added: 1,
      removed: 1,
      unchanged: 1,
    });
  });

  it("途中に追加された行の前後の行番号を維持する", () => {
    expect(createLineDiff("一行目\n三行目", "一行目\n二行目\n三行目")).toEqual([
      {
        status: "unchanged",
        content: "一行目",
        beforeLineNumber: 1,
        afterLineNumber: 1,
      },
      {
        status: "added",
        content: "二行目",
        beforeLineNumber: null,
        afterLineNumber: 2,
      },
      {
        status: "unchanged",
        content: "三行目",
        beforeLineNumber: 2,
        afterLineNumber: 3,
      },
    ]);
  });
});
