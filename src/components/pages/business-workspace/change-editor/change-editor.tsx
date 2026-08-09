import { Button } from "@/components/general/button";
import { SectionHeading } from "@/components/general/section-heading";
import {
  CHANGE_REASON_MAX_LENGTH,
  CONTENT_MAX_LENGTH,
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
        eyebrow="Step 1 of 2"
        title={`${entity.name}を変更`}
        description="現在内容を編集してから、保存前の差分確認へ進みます。"
        focusTarget
      />

      <div className="mt-6 rounded-2xl border border-status-warning-content/20 bg-status-warning-bg px-4 py-3 text-sm leading-6 text-status-warning-content">
        <strong className="font-bold">組織ワークスペース:</strong> {DEMO_NOTICE}
      </div>

      <div className="mt-7 space-y-6">
        <div>
          <div className="flex items-end justify-between gap-3">
            <label
              htmlFor="change-content"
              className="text-sm font-semibold text-content-primary"
            >
              変更後の内容{" "}
              <span className="text-status-danger-content">必須</span>
            </label>
            <span className="text-xs text-content-tertiary">
              {countUnicodeCodePoints(content).toLocaleString("ja-JP")} /{" "}
              {CONTENT_MAX_LENGTH.toLocaleString("ja-JP")}
            </span>
          </div>
          <textarea
            id="change-content"
            value={content}
            rows={10}
            maxLength={CONTENT_MAX_LENGTH * 2}
            aria-invalid={fieldError?.field === "content" || undefined}
            aria-describedby={
              fieldError?.field === "content" ? "content-error" : undefined
            }
            onChange={(event) => onContentChange(event.target.value)}
            className="mt-2 w-full resize-y rounded-2xl border border-outline-strong bg-surface px-4 py-4 text-sm leading-7 text-content-primary shadow-inner focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
          />
          {fieldError?.field === "content" ? (
            <p
              id="content-error"
              role="alert"
              className="mt-2 text-sm font-semibold text-status-danger-content"
            >
              {fieldError.message}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <label
              htmlFor="change-reason"
              className="text-sm font-semibold text-content-primary"
            >
              変更理由{" "}
              <span className="font-normal text-content-tertiary">任意</span>
            </label>
            <span className="text-xs text-content-tertiary">
              {countUnicodeCodePoints(reason)} / {CHANGE_REASON_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="change-reason"
            value={reason}
            rows={3}
            maxLength={CHANGE_REASON_MAX_LENGTH * 2}
            placeholder="例: 少額経費を含めて証憑の確認方法を統一するため"
            aria-invalid={fieldError?.field === "reason" || undefined}
            aria-describedby={
              fieldError?.field === "reason" ? "reason-error" : undefined
            }
            onChange={(event) => onReasonChange(event.target.value)}
            className="mt-2 w-full resize-y rounded-2xl border border-outline-strong bg-surface px-4 py-3 text-sm leading-6 text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
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
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline pt-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          変更を取り消す
        </Button>
        <Button onClick={onReview}>変更前後を確認する</Button>
      </div>
    </div>
  );
}
