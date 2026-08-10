import Link from "next/link";

import { createCasePath, createEntityPath } from "@/constants/routes";
import {
  fieldsToExpenseDefaults,
  formatWorkflowDateTime,
} from "@/lib/workflow-display";
import type { WorkItemDetail } from "@/types/workflow";
import { AccountingForm } from "./accounting-form";
import { ApprovalForm } from "./approval-form";
import { CaseFieldList } from "./case-field-list";
import { ExpenseCaseForm } from "./expense-case-form";
import { WorkflowProgress } from "./workflow-progress";

export function WorkItemWorkspace({
  organizationSlug,
  currentUserId,
  canMutate,
  workItem,
}: {
  organizationSlug: string;
  currentUserId: string;
  canMutate: boolean;
  workItem: WorkItemDetail;
}) {
  const canAct =
    canMutate &&
    workItem.item.assignedUserId === currentUserId &&
    workItem.item.status === "READY";
  const latestReturn = workItem.caseDetail.approvals
    .filter((approval) => approval.status === "RETURNED")
    .at(-1);

  return (
    <div className="space-y-7 p-5 sm:p-8">
      <header className="border-b border-outline pb-6">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          W-06 · 作業実行
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-content-primary">
              {workItem.item.title}
            </h1>
            <p className="mt-1 text-sm text-content-secondary">
              {workItem.caseDetail.workflowName} · {workItem.item.displayNumber} ·
              {workItem.item.assignedRole}として対応
            </p>
          </div>
          <Link
            href={createCasePath(organizationSlug, workItem.item.caseId)}
            className="text-sm font-semibold text-action-primary hover:underline"
          >
            案件詳細へ戻る
          </Link>
        </div>
        {workItem.item.dueAt ? (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${
              workItem.item.isOverdue
                ? "bg-status-danger-bg text-status-danger-content"
                : "bg-status-warning-bg text-status-warning-content"
            }`}
          >
            {workItem.item.isOverdue ? "期限超過 · " : "期限 · "}
            {formatWorkflowDateTime(workItem.item.dueAt)}
          </p>
        ) : null}
      </header>

      <WorkflowProgress
        steps={workItem.caseDetail.steps}
        currentStepKey={workItem.caseDetail.currentStepKey}
        isCompleted={false}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          aria-labelledby="work-action-title"
          className="rounded-3xl border border-outline bg-surface-muted p-5 sm:p-6"
        >
          <h2 id="work-action-title" className="text-xl font-bold text-content-primary">
            {canAct ? "この作業を完了" : "作業内容"}
          </h2>
          {!canAct ? (
            <p className="mt-3 rounded-2xl bg-status-warning-bg px-4 py-3 text-sm font-semibold text-status-warning-content">
              この作業は担当者だけが更新できます。案件情報は読み取り専用です。
            </p>
          ) : workItem.item.stepType === "APPROVAL" ? (
            <div className="mt-5">
              <ApprovalForm
                organizationSlug={organizationSlug}
                caseId={workItem.item.caseId}
                workItemId={workItem.item.id}
              />
            </div>
          ) : workItem.item.stepType === "INPUT" ? (
            <div className="mt-5">
              <ExpenseCaseForm
                organizationSlug={organizationSlug}
                workflowDefinitionId={
                  workItem.caseDetail.workflowDefinitionId
                }
                relatedProcessEntityId={
                  workItem.caseDetail.relatedProcessEntityId
                }
                caseId={workItem.item.caseId}
                workItemId={workItem.item.id}
                defaults={fieldsToExpenseDefaults(workItem.caseDetail.fields)}
                returnReason={latestReturn?.reason}
              />
            </div>
          ) : workItem.item.stepKey === "accounting" ? (
            <div className="mt-5">
              <AccountingForm
                organizationSlug={organizationSlug}
                caseId={workItem.item.caseId}
                workItemId={workItem.item.id}
              />
            </div>
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-outline p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-content-primary">申請内容</h2>
              <Link
                href={createEntityPath(
                  organizationSlug,
                  workItem.caseDetail.relatedProcessEntityId,
                )}
                className="text-xs font-semibold text-action-primary hover:underline"
              >
                業務知識
              </Link>
            </div>
            <div className="mt-4">
              <CaseFieldList
                fields={workItem.caseDetail.fields}
                stepKey="request"
              />
            </div>
          </section>
          <section className="rounded-3xl border border-outline p-5">
            <h2 className="font-bold text-content-primary">判断の根拠</h2>
            <ul className="mt-3 space-y-2 text-sm text-content-secondary">
              <li>• 領収書提出ルール</li>
              <li>• 金額別承認ルール</li>
              <li>• 経費規程</li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-content-tertiary">
              申請者: {workItem.caseDetail.initiatedByName} · workflow version {workItem.caseDetail.workflowVersionNumber}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
