import { notFound } from "next/navigation";

import { ExpenseCaseForm } from "@/components/pages/workflow-workspace/expense-case-form";
import {
  hasWorkspacePermission,
  requireOrganizationContext,
} from "@/lib/server/auth/session";
import { getWorkflowStartData } from "@/lib/server/workflow-service";

type WorkflowStartPageProps = {
  params: Promise<{
    organizationSlug: string;
    workflowDefinitionId: string;
  }>;
};

export default async function WorkflowStartPage({
  params,
}: WorkflowStartPageProps) {
  const { organizationSlug, workflowDefinitionId } = await params;
  const context = await requireOrganizationContext(organizationSlug);
  const workflow = await getWorkflowStartData(
    context.organizationId,
    workflowDefinitionId,
  );

  if (!workflow) {
    notFound();
  }

  const canMutate = hasWorkspacePermission(context.role, "change");

  return (
    <div className="p-5 sm:p-8">
      <header className="border-b border-outline pb-6">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          W-03 · 業務開始
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
          {workflow.name}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-secondary">
          申請に必要な情報を入力します。下書き保存または承認者への申請ができます。
        </p>
      </header>

      <div className="mt-6">
        {canMutate ? (
          <ExpenseCaseForm
            organizationSlug={organizationSlug}
            workflowDefinitionId={workflow.id}
            relatedProcessEntityId={workflow.relatedProcessEntityId}
            defaults={{
              expenseDate: "",
              amount: "",
              purpose: "",
              payee: "",
              receiptReference: "",
            }}
          />
        ) : (
          <p className="rounded-2xl bg-status-warning-bg px-4 py-3 text-sm font-semibold text-status-warning-content">
            閲覧権限では新しい案件を開始できません。
          </p>
        )}
      </div>
    </div>
  );
}
