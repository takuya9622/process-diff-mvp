"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { decideApprovalAction } from "@/app/organizations/[organizationSlug]/workflow-actions";
import { Button } from "@/components/general/button";
import { createCasePath } from "@/constants/routes";
import type { WorkflowActionResult } from "@/types/workflow";

export function ApprovalForm({
  organizationSlug,
  caseId,
  workItemId,
}: {
  organizationSlug: string;
  caseId: string;
  workItemId: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    WorkflowActionResult | null,
    FormData
  >(
    decideApprovalAction.bind(
      null,
      organizationSlug,
      caseId,
      workItemId,
    ),
    null,
  );

  useEffect(() => {
    if (state?.status === "success") {
      router.push(createCasePath(organizationSlug, caseId));
      router.refresh();
    }
  }, [caseId, organizationSlug, router, state]);

  return (
    <form action={formAction} className="space-y-4">
      {state && state.status !== "success" ? (
        <p
          role="alert"
          className="rounded-2xl bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
        >
          {state.message}
        </p>
      ) : null}
      <label className="block text-sm font-semibold text-content-primary">
        判断理由
        <textarea
          name="reason"
          rows={4}
          maxLength={500}
          placeholder="差し戻し・却下では理由を必ず入力してください"
          className="mt-1.5 w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="submit"
          name="decision"
          value="return"
          variant="secondary"
          disabled={isPending}
        >
          差し戻す
        </Button>
        <Button
          type="submit"
          name="decision"
          value="reject"
          variant="danger"
          disabled={isPending}
        >
          却下する
        </Button>
        <Button
          type="submit"
          name="decision"
          value="approve"
          disabled={isPending}
        >
          {isPending ? "確定中…" : "承認する"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-content-tertiary">
        サンプルでは同じ組織memberが承認者の業務役割を兼務します。判断主体と役割はActivityへ記録されます。
      </p>
    </form>
  );
}
