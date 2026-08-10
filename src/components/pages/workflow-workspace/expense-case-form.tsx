"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  resubmitExpenseCaseAction,
  saveExpenseCaseAction,
} from "@/app/organizations/[organizationSlug]/workflow-actions";
import { Button } from "@/components/general/button";
import { createCasePath, createEntityPath } from "@/constants/routes";
import type { ExpenseCaseInput, WorkflowActionResult } from "@/types/workflow";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm text-content-primary shadow-sm focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none";

export function ExpenseCaseForm({
  organizationSlug,
  workflowDefinitionId,
  relatedProcessEntityId,
  caseId,
  workItemId,
  defaults,
  returnReason,
}: {
  organizationSlug: string;
  workflowDefinitionId: string;
  relatedProcessEntityId: string;
  caseId?: string;
  workItemId?: string;
  defaults: ExpenseCaseInput;
  returnReason?: string | null;
}) {
  const router = useRouter();
  const isResubmission = Boolean(caseId && workItemId);
  const action = isResubmission
    ? resubmitExpenseCaseAction.bind(
        null,
        organizationSlug,
        caseId!,
        workItemId!,
      )
    : saveExpenseCaseAction.bind(
        null,
        organizationSlug,
        workflowDefinitionId,
        caseId,
      );
  const [state, formAction, isPending] = useActionState<
    WorkflowActionResult | null,
    FormData
  >(action, null);

  useEffect(() => {
    if (state?.status === "success") {
      router.push(createCasePath(organizationSlug, state.caseId));
      router.refresh();
    }
  }, [organizationSlug, router, state]);

  return (
    <form action={formAction} className="space-y-6">
      {returnReason ? (
        <div className="rounded-2xl border border-status-warning-content/20 bg-status-warning-bg px-4 py-3">
          <p className="text-xs font-bold text-status-warning-content">
            差し戻し理由
          </p>
          <p className="mt-1 text-sm leading-6 text-content-primary">
            {returnReason}
          </p>
        </div>
      ) : null}

      {state && state.status !== "success" ? (
        <p
          role="alert"
          className="rounded-2xl border border-status-danger-content/20 bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-content-primary">
          経費発生日 <span className="text-status-danger-content">必須</span>
          <input
            name="expenseDate"
            type="date"
            required
            defaultValue={defaults.expenseDate}
            className={inputClassName}
          />
        </label>
        <label className="text-sm font-semibold text-content-primary">
          金額 <span className="text-status-danger-content">必須</span>
          <span className="relative block">
            <input
              name="amount"
              type="number"
              min="1"
              max="10000000"
              step="1"
              required
              defaultValue={defaults.amount}
              className={`${inputClassName} pr-10`}
            />
            <span className="absolute top-1/2 right-3 translate-y-[-42%] text-sm text-content-tertiary">
              円
            </span>
          </span>
        </label>
        <label className="text-sm font-semibold text-content-primary sm:col-span-2">
          用途 <span className="text-status-danger-content">必須</span>
          <textarea
            name="purpose"
            required
            maxLength={500}
            rows={4}
            defaultValue={defaults.purpose}
            placeholder="例: 顧客訪問のための新幹線往復費用"
            className={inputClassName}
          />
          <span className="mt-1 block text-xs font-normal text-content-tertiary">
            業務との関係が分かるように入力してください。
          </span>
        </label>
        <label className="text-sm font-semibold text-content-primary">
          支払先 <span className="text-status-danger-content">必須</span>
          <input
            name="payee"
            type="text"
            required
            maxLength={200}
            defaultValue={defaults.payee}
            placeholder="例: 東海旅客鉄道"
            className={inputClassName}
          />
        </label>
        <label className="text-sm font-semibold text-content-primary">
          領収書情報 <span className="text-status-danger-content">必須</span>
          <input
            name="receiptReference"
            type="text"
            required
            maxLength={500}
            defaultValue={defaults.receiptReference}
            placeholder="例: 電子領収書 R-2026-0810"
            className={inputClassName}
          />
        </label>
      </div>

      <aside className="rounded-2xl border border-outline bg-surface-muted px-4 py-4">
        <p className="text-xs font-bold tracking-[0.1em] text-action-primary uppercase">
          判断の根拠
        </p>
        <p className="mt-1 text-sm leading-6 text-content-secondary">
          領収書提出ルール、金額別承認ルール、経費規程に基づいて処理します。
        </p>
        <Link
          href={createEntityPath(organizationSlug, relatedProcessEntityId)}
          className="mt-2 inline-flex text-sm font-semibold text-action-primary underline-offset-4 hover:underline"
        >
          経費申請の業務知識を確認
        </Link>
      </aside>

      <div className="flex flex-col-reverse gap-2 border-t border-outline pt-5 sm:flex-row sm:justify-end">
        {!isResubmission ? (
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="secondary"
            disabled={isPending}
          >
            {isPending ? "保存中…" : "下書き保存"}
          </Button>
        ) : null}
        <Button type="submit" name="intent" value="submit" disabled={isPending}>
          {isPending
            ? "処理中…"
            : isResubmission
              ? "修正して再申請"
              : "内容を確認して申請"}
        </Button>
      </div>
    </form>
  );
}
