import type { DiffLine, DiffLineStatus } from "@/types/diff";

const DIFF_STATUS_PRESENTATION: Record<
  DiffLineStatus,
  { label: string; symbol: string; className: string }
> = {
  removed: {
    label: "削除",
    symbol: "−",
    className:
      "border-change-removed-outline bg-change-removed-bg text-change-removed-content",
  },
  added: {
    label: "追加",
    symbol: "+",
    className:
      "border-change-added-outline bg-change-added-bg text-change-added-content",
  },
  unchanged: {
    label: "変更なし",
    symbol: "·",
    className: "border-outline bg-surface-muted text-content-secondary",
  },
};

const COLLAPSE_THRESHOLD = 8;
const CONTEXT_LINE_COUNT = 3;

type DiffSegment =
  | { type: "lines"; lines: DiffLine[]; startIndex: number }
  | { type: "collapsed"; lines: DiffLine[]; startIndex: number };

export function DiffView({ diff }: { diff: DiffLine[] }) {
  const segments = createDiffSegments(diff);

  return (
    <figure aria-label="変更前後の行単位の差分">
      <figcaption className="mb-3 flex flex-wrap gap-2 text-xs font-semibold text-content-secondary">
        <span className="rounded-full border border-change-removed-outline bg-change-removed-bg px-2.5 py-1 text-change-removed-content">
          − 削除
        </span>
        <span className="rounded-full border border-change-added-outline bg-change-added-bg px-2.5 py-1 text-change-added-content">
          + 追加
        </span>
        <span className="rounded-full border border-outline bg-surface-muted px-2.5 py-1">
          · 変更なし
        </span>
      </figcaption>
      <div className="overflow-hidden rounded-2xl border border-outline bg-surface">
        {segments.map((segment) =>
          segment.type === "lines" ? (
            segment.lines.map((line, index) => (
              <DiffLineRow
                key={createDiffLineKey(line, segment.startIndex + index)}
                line={line}
              />
            ))
          ) : (
            <details
              key={`collapsed-${segment.startIndex}`}
              className="group border-b border-outline bg-surface-muted last:border-b-0"
            >
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-content-secondary hover:bg-action-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true" className="group-open:hidden">
                  ⋯
                </span>
                <span aria-hidden="true" className="hidden group-open:inline">
                  −
                </span>
                変更なしの {segment.lines.length} 行を
                <span className="group-open:hidden">表示</span>
                <span className="hidden group-open:inline">非表示</span>
              </summary>
              <div className="border-t border-outline">
                {segment.lines.map((line, index) => (
                  <DiffLineRow
                    key={createDiffLineKey(line, segment.startIndex + index)}
                    line={line}
                  />
                ))}
              </div>
            </details>
          ),
        )}
      </div>
    </figure>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const presentation = DIFF_STATUS_PRESENTATION[line.status];

  return (
    <div
      aria-label={`${presentation.label}: ${line.content}`}
      className={`grid grid-cols-[2.75rem_2.75rem_2.25rem_minmax(0,1fr)] border-b px-2 py-3 font-mono text-sm last:border-b-0 sm:px-3 ${presentation.className}`}
    >
      <span
        aria-label="変更前の行番号"
        className="text-center text-xs opacity-65"
      >
        {line.beforeLineNumber ?? ""}
      </span>
      <span
        aria-label="変更後の行番号"
        className="text-center text-xs opacity-65"
      >
        {line.afterLineNumber ?? ""}
      </span>
      <span aria-hidden="true" className="text-center font-bold">
        {presentation.symbol}
      </span>
      <span className="min-w-0 break-words whitespace-pre-wrap">
        {line.content || " "}
      </span>
    </div>
  );
}

function createDiffSegments(diff: DiffLine[]): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let index = 0;

  while (index < diff.length) {
    if (diff[index].status !== "unchanged") {
      const startIndex = index;
      while (index < diff.length && diff[index].status !== "unchanged") {
        index += 1;
      }
      segments.push({
        type: "lines",
        lines: diff.slice(startIndex, index),
        startIndex,
      });
      continue;
    }

    const runStart = index;
    while (index < diff.length && diff[index].status === "unchanged") {
      index += 1;
    }
    const runEnd = index;
    const runLength = runEnd - runStart;

    if (runLength <= COLLAPSE_THRESHOLD) {
      segments.push({
        type: "lines",
        lines: diff.slice(runStart, runEnd),
        startIndex: runStart,
      });
      continue;
    }

    const isWholeDiff = runStart === 0 && runEnd === diff.length;
    const visibleAtStart = runStart > 0 || isWholeDiff ? CONTEXT_LINE_COUNT : 0;
    const visibleAtEnd =
      runEnd < diff.length || isWholeDiff ? CONTEXT_LINE_COUNT : 0;
    const collapsedStart = runStart + visibleAtStart;
    const collapsedEnd = runEnd - visibleAtEnd;

    if (visibleAtStart > 0) {
      segments.push({
        type: "lines",
        lines: diff.slice(runStart, collapsedStart),
        startIndex: runStart,
      });
    }
    segments.push({
      type: "collapsed",
      lines: diff.slice(collapsedStart, collapsedEnd),
      startIndex: collapsedStart,
    });
    if (visibleAtEnd > 0) {
      segments.push({
        type: "lines",
        lines: diff.slice(collapsedEnd, runEnd),
        startIndex: collapsedEnd,
      });
    }
  }

  return segments;
}

function createDiffLineKey(line: DiffLine, index: number) {
  return `${line.status}-${line.beforeLineNumber ?? "x"}-${line.afterLineNumber ?? "x"}-${index}`;
}
