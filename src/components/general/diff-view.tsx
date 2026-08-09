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

export function DiffView({ diff }: { diff: DiffLine[] }) {
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
        {diff.map((line, index) => {
          const presentation = DIFF_STATUS_PRESENTATION[line.status];

          return (
            <div
              key={`${line.status}-${line.beforeLineNumber ?? "x"}-${line.afterLineNumber ?? "x"}-${index}`}
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
        })}
      </div>
    </figure>
  );
}
