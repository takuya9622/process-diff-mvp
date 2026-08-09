import { Button } from "@/components/general/button";
import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import { SectionHeading } from "@/components/general/section-heading";
import {
  CHANGE_REASON_MAX_LENGTH,
  CONTENT_MAX_LENGTH,
  CONTENT_MAX_LINES,
  DEMO_NOTICE,
} from "@/constants/demo";
import { countUnicodeCodePoints } from "@/lib/domain/text";
import type { BusinessEntity } from "@/types/business-entity";

export function ChangeEditor({
  entity,
  content,
  reason,
  fieldError,
  onContentChange,
  onReasonChange,
  onCancel,
  onReview,
}: {
  entity: BusinessEntity;
  content: string;
  reason: string;
  fieldError: { field: "content" | "reason"; message: string } | null;
  onContentChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onReview: () => void;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="変更案 · ステップ 1 / 2"
        title="変更案を作成"
        description={`${entity.name}の現在内容から変更案を作ります。確認画面で差分をレビューし、確定するまで公開中の業務知識は変わりません。`}
        focusTarget
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-outline bg-surface-muted px-4 py-3 text-xs text-content-secondary">
        <span className="rounded-full border border-status-warning-content/25 bg-status-warning-bg px-2.5 py-1 font-bold text-status-warning-content">
          下書き
        </span>
        <EntityTypeBadge type={entity.type} label={entity.typeLabel} />
        <span className="font-semibold text-content-primary">
          {entity.name}
        </span>
        <span className="text-content-tertiary">現在版から分岐</span>
      </div>

      <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="document-editor-title" className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-outline-strong bg-surface">
            <div className="flex flex-col gap-2 border-b border-outline bg-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="document-editor-title"
                  className="text-sm font-semibold text-content-primary"
                >
                  業務知識の本文
                </h2>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  見出しとリストを含むページ全体を編集
                </p>
              </div>
              <span className="text-xs text-content-tertiary tabular-nums">
                {countUnicodeCodePoints(content).toLocaleString("ja-JP")} /{" "}
                {CONTENT_MAX_LENGTH.toLocaleString("ja-JP")}文字 ·{" "}
                {content.split("\n").length} / {CONTENT_MAX_LINES}行
              </span>
            </div>
            <label htmlFor="change-content" className="sr-only">
              業務知識の本文 必須
            </label>
            <textarea
              id="change-content"
              value={content}
              rows={24}
              maxLength={CONTENT_MAX_LENGTH * 2}
              spellCheck={false}
              aria-invalid={fieldError?.field === "content" || undefined}
              aria-describedby={
                fieldError?.field === "content"
                  ? "content-error"
                  : "content-format-help"
              }
              onChange={(event) => onContentChange(event.target.value)}
              className="block w-full resize-y border-0 bg-surface px-5 py-5 font-mono text-sm leading-7 text-content-primary focus:ring-2 focus:ring-focus-ring/35 focus:outline-none focus:ring-inset"
            />
          </div>
          <p
            id="content-format-help"
            className="mt-2 text-xs leading-5 text-content-tertiary"
          >
            <code>## 見出し</code>、<code>### 小見出し</code>、
            <code>- リスト</code>、<code>&gt; 注記</code>を表示に反映します。
          </p>
          {fieldError?.field === "content" ? (
            <p
              id="content-error"
              role="alert"
              className="mt-2 text-sm font-semibold text-status-danger-content"
            >
              {fieldError.message}
            </p>
          ) : null}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <section className="rounded-2xl border border-outline bg-surface p-4">
            <div className="flex items-end justify-between gap-3">
              <label
                htmlFor="change-reason"
                className="text-sm font-semibold text-content-primary"
              >
                変更案の概要
              </label>
              <span className="text-[0.7rem] text-content-tertiary tabular-nums">
                {countUnicodeCodePoints(reason)} / {CHANGE_REASON_MAX_LENGTH}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-content-tertiary">
              レビューする人が、目的と判断理由を理解できるように記載します。
            </p>
            <textarea
              id="change-reason"
              value={reason}
              rows={7}
              maxLength={CHANGE_REASON_MAX_LENGTH * 2}
              placeholder="例: 少額経費を含めて証憑の確認方法を統一するため"
              aria-label="変更案の概要 任意"
              aria-invalid={fieldError?.field === "reason" || undefined}
              aria-describedby={
                fieldError?.field === "reason" ? "reason-error" : undefined
              }
              onChange={(event) => onReasonChange(event.target.value)}
              className="mt-3 w-full resize-y rounded-xl border border-outline-strong bg-surface px-3 py-3 text-sm leading-6 text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
            />
            {fieldError?.field === "reason" ? (
              <p
                id="reason-error"
                role="alert"
                className="mt-2 text-sm font-semibold text-status-danger-content"
              >
                {fieldError.message}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-status-warning-content/20 bg-status-warning-bg p-4 text-xs leading-5 text-status-warning-content">
            <h2 className="font-bold">共有範囲</h2>
            <p className="mt-1">{DEMO_NOTICE}</p>
          </section>
        </aside>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline pt-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          変更案を破棄
        </Button>
        <Button onClick={onReview}>差分を確認</Button>
      </div>
    </div>
  );
}
