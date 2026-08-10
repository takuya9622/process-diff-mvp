"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { completeAccountingAction } from "@/app/organizations/[organizationSlug]/workflow-actions";
import { Button } from "@/components/general/button";
import { createCasePath } from "@/constants/routes";
import type { WorkflowActionResult } from "@/types/workflow";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none";

export function AccountingForm({
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
    completeAccountingAction.bind(null, organizationSlug, caseId, workItemId),
    null,
  );

  useEffect(() => {
    if (state?.status === "success") {
      router.push(createCasePath(organizationSlug, caseId));
      router.refresh();
    }
  }, [caseId, organizationSlug, router, state]);

  return (
    <form action={formAction} className="space-y-5">
      {state && state.status !== "success" ? (
        <p
          role="alert"
          className="rounded-2xl bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
        >
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-content-primary">
          処理日 <span className="text-status-danger-content">必須</span>
          <input
            name="processedDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClassName}
          />
        </label>
        <label className="text-sm font-semibold text-content-primary">
          処理参照番号 <span className="text-status-danger-content">必須</span>
          <input
            name="reference"
            type="text"
            required
            maxLength={200}
            placeholder="例: JV-2026-0810-001"
            className={inputClassName}
          />
        </label>
        <label className="text-sm font-semibold text-content-primary sm:col-span-2">
          処理結果・証跡{" "}
          <span className="text-status-danger-content">必須</span>
          <textarea
            name="result"
            required
            maxLength={1000}
            rows={5}
            placeholder="申請内容と領収書情報を照合し、支払対象へ登録した結果を入力します"
            className={inputClassName}
          />
        </label>
      </div>
      <div className="flex justify-end border-t border-outline pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "完了処理中…" : "経理処理を完了"}
        </Button>
      </div>
    </form>
  );
}
