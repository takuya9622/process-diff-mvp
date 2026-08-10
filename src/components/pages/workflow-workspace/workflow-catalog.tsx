import Link from "next/link";

import { createWorkflowStartPath } from "@/constants/routes";
import type { WorkflowCatalogItem } from "@/types/workflow";

export function WorkflowCatalog({
  organizationSlug,
  workflows,
}: {
  organizationSlug: string;
  workflows: WorkflowCatalogItem[];
}) {
  return (
    <div className="p-5 sm:p-8">
      <header className="border-b border-outline pb-6">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          W-02 · 業務カタログ
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
          業務を開始
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-secondary">
          公開済みの業務から、必要な入力と担当の流れを確認して新しい案件を始めます。
          外部サービスの接続は必要ありません。
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <article
            key={workflow.id}
            className="flex flex-col rounded-3xl border border-outline bg-surface-muted p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-action-primary">
                  公開version {workflow.versionNumber}
                </p>
                <h2 className="mt-1 text-xl font-bold text-content-primary">
                  {workflow.name}
                </h2>
              </div>
              <span className="rounded-full bg-status-info-bg px-2.5 py-1 text-xs font-bold text-status-info-content">
                約3ステップ
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              {workflow.description}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-content-tertiary">主な入力</p>
                <p className="mt-1 text-sm text-content-primary">
                  経費発生日、金額、用途、支払先、領収書情報
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-content-tertiary">担当の流れ</p>
                <p className="mt-1 text-sm text-content-primary">
                  申請者 → 承認者 → 経理担当
                </p>
              </div>
            </div>
            <Link
              href={createWorkflowStartPath(organizationSlug, workflow.id)}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-action-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              この業務を始める
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
