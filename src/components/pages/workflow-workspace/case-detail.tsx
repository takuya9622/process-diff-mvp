import Link from "next/link";

import {
  createEntityPath,
  createWorkItemPath,
} from "@/constants/routes";
import {
  fieldsToExpenseDefaults,
  formatWorkflowDateTime,
} from "@/lib/workflow-display";
import type { CaseDetail as CaseDetailModel } from "@/types/workflow";
import { CancelCaseButton } from "./cancel-case-button";
import { CaseFieldList } from "./case-field-list";
import { ExpenseCaseForm } from "./expense-case-form";
import { WorkflowProgress } from "./workflow-progress";
import { WorkflowStatusBadge } from "./workflow-status-badge";

const approvalStatusLabels = {
  PENDING: "判断待ち",
  APPROVED: "承認",
  REJECTED: "却下",
  RETURNED: "差し戻し",
  CANCELLED: "取消",
} as const;

export function CaseDetail({
  organizationSlug,
  currentUserId,
  canMutate,
  caseDetail,
}: {
  organizationSlug: string;
  currentUserId: string;
  canMutate: boolean;
  caseDetail: CaseDetailModel;
}) {
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(
    caseDetail.status,
  );
  const canCancel =
    canMutate &&
    caseDetail.initiatedByUserId === currentUserId &&
    (caseDetail.status === "DRAFT" ||
      (caseDetail.status === "RUNNING" &&
        caseDetail.currentStepKey === "approval"));
  const canOpenWorkItem =
    canMutate &&
    caseDetail.activeWorkItem?.assignedUserId === currentUserId;

  return (
    <div className="space-y-7 p-5 sm:p-8">
      <header className="border-b border-outline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
                W-05 · 案件詳細
              </p>
              <WorkflowStatusBadge
                status={caseDetail.status}
                label={caseDetail.statusLabel}
              />
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
              {caseDetail.workflowName}
            </h1>
            <p className="mt-1 text-sm text-content-secondary">
              {caseDetail.displayNumber} · 申請者 {caseDetail.initiatedByName} ·
              workflow version {caseDetail.workflowVersionNumber}
            </p>
          </div>
          {canCancel ? (
            <CancelCaseButton
              organizationSlug={organizationSlug}
              caseId={caseDetail.id}
            />
          ) : null}
        </div>

        {isTerminal ? (
          <div className="mt-5 rounded-2xl border border-outline bg-surface-muted px-4 py-4">
            <p className="text-xs font-bold text-content-tertiary">案件結果</p>
            <p className="mt-1 text-lg font-bold text-content-primary">
              {caseDetail.statusLabel}として確定しました
            </p>
            {caseDetail.completedAt ? (
              <p className="mt-1 text-sm text-content-secondary">
                {formatWorkflowDateTime(caseDetail.completedAt)}
              </p>
            ) : null}
          </div>
        ) : caseDetail.activeWorkItem ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-action-primary/25 bg-action-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-action-primary">
                次の行動 · {caseDetail.activeWorkItem.assignedRole}
              </p>
              <p className="mt-1 font-bold text-content-primary">
                {caseDetail.activeWorkItem.title}
              </p>
              <p className="mt-1 text-xs text-content-secondary">
                {caseDetail.activeWorkItem.dueAt
                  ? `期限 ${formatWorkflowDateTime(caseDetail.activeWorkItem.dueAt)}`
                  : "期限設定なし"}
              </p>
            </div>
            {canOpenWorkItem ? (
              <Link
                href={createWorkItemPath(
                  organizationSlug,
                  caseDetail.id,
                  caseDetail.activeWorkItem.id,
                )}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-surface hover:bg-action-primary-hover"
              >
                この作業を開く
              </Link>
            ) : (
              <span className="text-sm font-semibold text-content-secondary">
                担当者の対応待ち
              </span>
            )}
          </div>
        ) : null}
      </header>

      <section aria-labelledby="case-progress-title">
        <h2
          id="case-progress-title"
          className="text-lg font-bold text-content-primary"
        >
          現在地
        </h2>
        <p className="mt-1 mb-4 text-sm text-content-secondary">
          現在は「{caseDetail.currentStepName}」です。
        </p>
        <WorkflowProgress
          steps={caseDetail.steps}
          currentStepKey={caseDetail.currentStepKey}
          isCompleted={caseDetail.status === "COMPLETED"}
        />
      </section>

      {caseDetail.status === "DRAFT" && canMutate ? (
        <section
          aria-labelledby="draft-edit-title"
          className="rounded-3xl border border-outline bg-surface-muted p-5"
        >
          <h2
            id="draft-edit-title"
            className="text-xl font-bold text-content-primary"
          >
            下書きを編集して申請
          </h2>
          <p className="mt-1 mb-5 text-sm text-content-secondary">
            保存済みの内容を確認し、承認者へ提出します。
          </p>
          <ExpenseCaseForm
            organizationSlug={organizationSlug}
            workflowDefinitionId={caseDetail.workflowDefinitionId}
            relatedProcessEntityId={caseDetail.relatedProcessEntityId}
            caseId={caseDetail.id}
            defaults={fieldsToExpenseDefaults(caseDetail.fields)}
          />
        </section>
      ) : (
        <section aria-labelledby="case-data-title">
          <div className="flex items-end justify-between gap-3">
            <h2
              id="case-data-title"
              className="text-lg font-bold text-content-primary"
            >
              申請内容
            </h2>
            <Link
              href={createEntityPath(
                organizationSlug,
                caseDetail.relatedProcessEntityId,
              )}
              className="text-sm font-semibold text-action-primary hover:underline"
            >
              関連する業務知識
            </Link>
          </div>
          <div className="mt-4 rounded-2xl border border-outline p-5">
            <CaseFieldList fields={caseDetail.fields} stepKey="request" />
          </div>
        </section>
      )}

      {caseDetail.fields.some(
        (field) => field.stepKey === "accounting" && field.value,
      ) ? (
        <section aria-labelledby="accounting-result-title">
          <h2
            id="accounting-result-title"
            className="text-lg font-bold text-content-primary"
          >
            経理処理結果と証跡
          </h2>
          <div className="mt-4 rounded-2xl border border-change-added-outline bg-change-added-bg p-5">
            <CaseFieldList fields={caseDetail.fields} stepKey="accounting" />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="approval-history-title">
        <h2
          id="approval-history-title"
          className="text-lg font-bold text-content-primary"
        >
          承認と判断
        </h2>
        {caseDetail.approvals.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {caseDetail.approvals.map((approval) => (
              <li
                key={approval.id}
                className="rounded-2xl border border-outline px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-content-primary">
                    承認 {approval.attempt}回目 · {approvalStatusLabels[approval.status]}
                  </p>
                  <p className="text-xs text-content-tertiary">
                    {approval.decidedAt
                      ? `${approval.decidedByName ?? "担当者"} · ${formatWorkflowDateTime(approval.decidedAt)}`
                      : "判断待ち"}
                  </p>
                </div>
                {approval.reason ? (
                  <p className="mt-2 text-sm leading-6 text-content-secondary">
                    {approval.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-content-tertiary">
            まだ判断は記録されていません。
          </p>
        )}
      </section>

      <section aria-labelledby="activity-title">
        <h2 id="activity-title" className="text-lg font-bold text-content-primary">
          Activity
        </h2>
        <ol className="mt-4 space-y-0">
          {caseDetail.activities.map((activity) => (
            <li
              key={activity.id}
              className="relative border-l-2 border-outline py-1 pb-5 pl-5 last:pb-1"
            >
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[0.42rem] size-3 rounded-full border-2 border-surface bg-action-primary"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-content-primary">
                  {activity.summary}
                </p>
                <time className="text-xs text-content-tertiary">
                  {formatWorkflowDateTime(activity.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 text-xs text-content-secondary">
                {activity.actorName ?? "システム"}
                {activity.actorRole ? ` · ${activity.actorRole}` : ""}
              </p>
              {activity.detail ? (
                <p className="mt-1 text-sm leading-6 text-content-secondary">
                  {activity.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
