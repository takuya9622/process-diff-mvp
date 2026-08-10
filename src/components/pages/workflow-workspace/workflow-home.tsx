import Link from "next/link";

import {
  createCasePath,
  createCasesPath,
  createWorkflowCatalogPath,
  createWorkflowStartPath,
  createWorkItemPath,
} from "@/constants/routes";
import { formatWorkflowDateTime } from "@/lib/workflow-display";
import type { WorkflowHomeData } from "@/types/workflow";
import { WorkflowStatusBadge } from "./workflow-status-badge";

export function WorkflowHome({
  organizationSlug,
  userName,
  canMutate,
  data,
}: {
  organizationSlug: string;
  userName: string;
  canMutate: boolean;
  data: WorkflowHomeData;
}) {
  const primaryWorkflow = data.startableWorkflows[0];

  return (
    <div className="space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-outline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
            W-01 · ホーム
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
            {userName}さんの業務
          </h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            次に行う作業と、進行中の案件をここから確認できます。
          </p>
        </div>
        {primaryWorkflow && canMutate ? (
          <Link
            href={createWorkflowStartPath(organizationSlug, primaryWorkflow.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-action-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            新しい経費申請を始める
          </Link>
        ) : null}
      </header>

      <section aria-labelledby="pending-work-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-content-tertiary">MY WORK</p>
            <h2
              id="pending-work-title"
              className="mt-1 text-xl font-bold text-content-primary"
            >
              自分の対応待ち
            </h2>
          </div>
          <span className="rounded-full bg-action-muted px-3 py-1 text-sm font-bold text-action-primary">
            {data.pendingWorkItems.length}件
          </span>
        </div>

        {data.pendingWorkItems.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.pendingWorkItems.map((item) => (
              <Link
                key={item.id}
                href={createWorkItemPath(
                  organizationSlug,
                  item.caseId,
                  item.id,
                )}
                className={`group rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none ${
                  item.isOverdue
                    ? "border-status-danger-content/30 bg-status-danger-bg"
                    : "border-outline bg-surface-muted hover:border-action-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-action-primary">
                      {item.assignedRole}として対応
                    </p>
                    <h3 className="mt-1 font-bold text-content-primary group-hover:text-action-primary">
                      {item.title}
                    </h3>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-content-tertiary">
                    {item.displayNumber}
                  </span>
                </div>
                <p className="mt-3 text-sm text-content-secondary">
                  {item.workflowName} · 申請者 {item.initiatedByName}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    item.isOverdue
                      ? "text-status-danger-content"
                      : "text-content-tertiary"
                  }`}
                >
                  {item.dueAt
                    ? `${item.isOverdue ? "期限超過 · " : "期限 · "}${formatWorkflowDateTime(item.dueAt)}`
                    : "期限設定なし"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-outline-strong bg-surface-muted px-5 py-8 text-center">
            <p className="font-semibold text-content-primary">
              現在対応が必要な業務はありません
            </p>
            <Link
              href={createWorkflowCatalogPath(organizationSlug)}
              className="mt-2 inline-flex text-sm font-semibold text-action-primary hover:underline"
            >
              開始できる業務を見る
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="recent-cases-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-content-tertiary">CASES</p>
            <h2
              id="recent-cases-title"
              className="mt-1 text-xl font-bold text-content-primary"
            >
              最近の案件
            </h2>
          </div>
          <Link
            href={createCasesPath(organizationSlug)}
            className="text-sm font-semibold text-action-primary hover:underline"
          >
            すべての案件
          </Link>
        </div>
        {data.recentCases.length > 0 ? (
          <ul className="mt-4 divide-y divide-outline rounded-2xl border border-outline">
            {data.recentCases.map((caseItem) => (
              <li key={caseItem.id}>
                <Link
                  href={createCasePath(organizationSlug, caseItem.id)}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-content-tertiary">
                      {caseItem.displayNumber}
                    </p>
                    <p className="mt-1 font-semibold text-content-primary">
                      {caseItem.workflowName} · {caseItem.currentStepName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <WorkflowStatusBadge
                      status={caseItem.status}
                      label={caseItem.statusLabel}
                    />
                    <span className="text-xs text-content-tertiary">
                      {formatWorkflowDateTime(caseItem.updatedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl bg-surface-muted px-5 py-8 text-center text-sm text-content-secondary">
            まだ案件はありません。経費申請を始めるとここへ表示されます。
          </p>
        )}
      </section>
    </div>
  );
}
