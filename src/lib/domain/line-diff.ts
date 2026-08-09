import type { DiffLine, DiffSummary } from "@/types/diff";

export function createLineDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const longestCommonSubsequence = Array.from(
    { length: beforeLines.length + 1 },
    () => Array<number>(afterLines.length + 1).fill(0),
  );

  for (
    let beforeIndex = beforeLines.length - 1;
    beforeIndex >= 0;
    beforeIndex -= 1
  ) {
    for (
      let afterIndex = afterLines.length - 1;
      afterIndex >= 0;
      afterIndex -= 1
    ) {
      longestCommonSubsequence[beforeIndex][afterIndex] =
        beforeLines[beforeIndex] === afterLines[afterIndex]
          ? longestCommonSubsequence[beforeIndex + 1][afterIndex + 1] + 1
          : Math.max(
              longestCommonSubsequence[beforeIndex + 1][afterIndex],
              longestCommonSubsequence[beforeIndex][afterIndex + 1],
            );
    }
  }

  const diff: DiffLine[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < beforeLines.length || afterIndex < afterLines.length) {
    if (
      beforeIndex < beforeLines.length &&
      afterIndex < afterLines.length &&
      beforeLines[beforeIndex] === afterLines[afterIndex]
    ) {
      diff.push({
        status: "unchanged",
        content: beforeLines[beforeIndex],
        beforeLineNumber: beforeIndex + 1,
        afterLineNumber: afterIndex + 1,
      });
      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }

    const shouldRemove =
      beforeIndex < beforeLines.length &&
      (afterIndex >= afterLines.length ||
        longestCommonSubsequence[beforeIndex + 1][afterIndex] >=
          longestCommonSubsequence[beforeIndex][afterIndex + 1]);

    if (shouldRemove) {
      diff.push({
        status: "removed",
        content: beforeLines[beforeIndex],
        beforeLineNumber: beforeIndex + 1,
        afterLineNumber: null,
      });
      beforeIndex += 1;
      continue;
    }

    diff.push({
      status: "added",
      content: afterLines[afterIndex],
      beforeLineNumber: null,
      afterLineNumber: afterIndex + 1,
    });
    afterIndex += 1;
  }

  return diff;
}

export function summarizeLineDiff(diff: DiffLine[]): DiffSummary {
  return diff.reduce<DiffSummary>(
    (summary, line) => ({
      ...summary,
      [line.status]: summary[line.status] + 1,
    }),
    { added: 0, removed: 0, unchanged: 0 },
  );
}
