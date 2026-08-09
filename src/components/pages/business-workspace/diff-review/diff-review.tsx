import { Button } from "@/components/general/button";
import { DiffView } from "@/components/general/diff-view";
import { SectionHeading } from "@/components/general/section-heading";
import type { BusinessEntity } from "@/types/business-entity";
import type { DiffLine, DiffSummary } from "@/types/diff";

export function DiffReview({
  entity,
  reason,
  diff,
  summary,
  actionError,
  isPending,
  onBack,
  onConfirm,
}: {
  entity: BusinessEntity;
  reason: string;
  diff: DiffLine[];
  summary: DiffSummary;
  actionError: string | null;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Step 2 of 2"
        title="変更前後を確認"
        description={`${entity.name}の変更箇所を行単位で表示しています。確定するまで現在状態は更新されません。`}
        focusTarget
      />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <SummaryCard label="追加" value={summary.added} tone="added" />
        <SummaryCard label="削除" value={summary.removed} tone="removed" />
        <SummaryCard
          label="変更なし"
          value={summary.unchanged}
          tone="neutral"
        />
      </div>

      <div className="mt-6">
        <DiffView diff={diff} />
      </div>

      <section className="mt-6 rounded-2xl border border-outline bg-surface-muted p-4">
        <h2 className="text-sm font-semibold text-content-primary">変更理由</h2>
        <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-content-secondary">
          {reason || "入力なし"}
        </p>
      </section>

      {actionError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-status-danger-content/20 bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
        >
          {actionError}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline pt-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" disabled={isPending} onClick={onBack}>
          編集へ戻る
        </Button>
        <Button disabled={isPending} onClick={onConfirm}>
          {isPending ? "変更を確定しています…" : "この内容で変更を確定する"}
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "added" | "removed" | "neutral";
}) {
  const toneClasses = {
    added:
      "border-change-added-outline bg-change-added-bg text-change-added-content",
    removed:
      "border-change-removed-outline bg-change-removed-bg text-change-removed-content",
    neutral: "border-outline bg-surface-muted text-content-secondary",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
