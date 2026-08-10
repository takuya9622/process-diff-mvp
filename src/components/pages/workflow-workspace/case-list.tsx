import Link from "next/link";

import { createCasePath, createWorkflowCatalogPath } from "@/constants/routes";
import { formatWorkflowDateTime } from "@/lib/workflow-display";
import type { CaseSummary } from "@/types/workflow";
import { WorkflowStatusBadge } from "./workflow-status-badge";

export function CaseList({
  organizationSlug,
  cases,
}: {
  organizationSlug: string;
  cases: CaseSummary[];
}) {
  return (
    <div className="p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-outline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
            W-04 · 案件一覧
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
            自分の案件
          </h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            自分が開始した案件の現在地、次の担当、期限を確認します。
          </p>
        </div>
        <Link
          href={createWorkflowCatalogPath(organizationSlug)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-surface hover:bg-action-primary-hover"
        >
          新しい業務を開始
        </Link>
      </header>

      {cases.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-outline">
          <div className="hidden grid-cols-[8rem_minmax(0,1.4fr)_minmax(0,1fr)_9rem_10rem] gap-3 bg-surface-muted px-4 py-3 text-xs font-bold text-content-tertiary lg:grid">
            <span>案件番号</span>
            <span>業務・現在地</span>
            <span>次の担当</span>
            <span>状態</span>
            <span>最終更新</span>
          </div>
          <ul className="divide-y divide-outline">
            {cases.map((caseItem) => (
              <li key={caseItem.id}>
                <Link
                  href={createCasePath(organizationSlug, caseItem.id)}
                  className="grid gap-3 px-4 py-4 transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none lg:grid-cols-[8rem_minmax(0,1.4fr)_minmax(0,1fr)_9rem_10rem] lg:items-center"
                >
                  <span className="text-sm font-bold text-content-primary">
                    {caseItem.displayNumber}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-content-primary">
                      {caseItem.workflowName}
                    </span>
                    <span className="mt-0.5 block text-xs text-content-tertiary">
                      {caseItem.currentStepName}
                    </span>
                  </span>
                  <span className="text-sm text-content-secondary">
                    {caseItem.nextActor ?? "対応者なし"}
                    {caseItem.dueAt ? (
                      <span className="mt-0.5 block text-xs text-content-tertiary">
                        期限 {formatWorkflowDateTime(caseItem.dueAt)}
                      </span>
                    ) : null}
                  </span>
                  <span>
                    <WorkflowStatusBadge
                      status={caseItem.status}
                      label={caseItem.statusLabel}
                    />
                  </span>
                  <span className="text-xs text-content-tertiary">
                    {formatWorkflowDateTime(caseItem.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-outline-strong bg-surface-muted px-5 py-12 text-center">
          <h2 className="text-lg font-bold text-content-primary">
            まだ案件はありません
          </h2>
          <p className="mt-2 text-sm text-content-secondary">
            業務カタログから最初の経費申請を始めてください。
          </p>
        </div>
      )}
    </div>
  );
}
