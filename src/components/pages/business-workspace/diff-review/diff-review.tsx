import { Button } from "@/components/general/button";
import { DiffView } from "@/components/general/diff-view";
import { EntityTypeBadge } from "@/components/general/entity-type-badge";
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
        eyebrow="変更案 · ステップ 2 / 2"
        title="変更案をレビュー"
        description={`${entity.name}の変更前後を確認します。差分と変更理由が意図どおりなら、現在の業務知識へ反映します。`}
        focusTarget
      />

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-outline bg-surface-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-full bg-action-primary px-3 py-1 text-xs font-bold text-surface">
            レビュー
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content-primary">
              {entity.name}の変更案
            </p>
            <p className="mt-0.5 text-xs text-content-tertiary">
              現在の v{entity.currentVersionNumber} へ反映予定
            </p>
          </div>
        </div>
        <EntityTypeBadge type={entity.type} label={entity.typeLabel} />
      </div>

      <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="files-changed-title" className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 border-b border-outline pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
                変更内容
              </p>
              <h2
                id="files-changed-title"
                className="mt-1 text-lg font-semibold text-content-primary"
              >
                業務知識の本文
              </h2>
            </div>
            <div className="flex gap-2 text-xs font-bold tabular-nums">
              <span className="rounded-full border border-change-added-outline bg-change-added-bg px-2.5 py-1 text-change-added-content">
                +{summary.added}
              </span>
              <span className="rounded-full border border-change-removed-outline bg-change-removed-bg px-2.5 py-1 text-change-removed-content">
                −{summary.removed}
              </span>
            </div>
          </div>
          <DiffView diff={diff} />
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <section className="rounded-2xl border border-outline bg-surface p-4">
            <h2 className="text-sm font-semibold text-content-primary">
              変更案の概要
            </h2>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-content-secondary">
              {reason || "概要は入力されていません。"}
            </p>
          </section>

          <section className="rounded-2xl border border-outline bg-surface p-4">
            <h2 className="text-sm font-semibold text-content-primary">
              レビュー状況
            </h2>
            <dl className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-content-tertiary">変更行</dt>
                <dd className="font-bold text-content-primary tabular-nums">
                  {summary.added + summary.removed}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-content-tertiary">変更なし</dt>
                <dd className="font-bold text-content-primary tabular-nums">
                  {summary.unchanged}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-content-tertiary">公開状態</dt>
                <dd className="font-bold text-status-warning-content">
                  未反映
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

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
          {isPending ? "変更を反映しています…" : "変更を反映"}
        </Button>
      </div>
    </div>
  );
}
