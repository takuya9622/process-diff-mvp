"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { postCommunicationMessageAction } from "@/app/organizations/[organizationSlug]/communication-actions";
import { Button } from "@/components/general/button";
import { createCommunicationPath } from "@/constants/routes";
import type {
  CommunicationActionResult,
  CommunicationShareableCase,
} from "@/types/communication";

export function MessageComposer({
  organizationSlug,
  channelId,
  shareableCases,
}: {
  organizationSlug: string;
  channelId: string;
  shareableCases: CommunicationShareableCase[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    CommunicationActionResult | null,
    FormData
  >(
    postCommunicationMessageAction.bind(null, organizationSlug, channelId),
    null,
  );

  useEffect(() => {
    if (state?.status === "success") {
      formRef.current?.reset();
      router.push(createCommunicationPath(organizationSlug, channelId));
      router.refresh();
    }
  }, [channelId, organizationSlug, router, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-t border-outline bg-surface-muted p-4 sm:p-5"
    >
      {state && state.status !== "success" ? (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-status-danger-bg px-3 py-2 text-sm font-semibold text-status-danger-content"
        >
          {state.message}
        </p>
      ) : null}
      <label className="block text-sm font-bold text-content-primary">
        メッセージ
        <textarea
          name="body"
          required
          rows={3}
          maxLength={2000}
          placeholder="相談、確認事項、共有したい内容を入力"
          className="mt-1.5 w-full resize-y rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm leading-6 text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
        />
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block min-w-0 flex-1 text-xs font-bold text-content-secondary">
          案件を添付（任意）
          <select
            name="relatedCaseId"
            defaultValue=""
            className="mt-1.5 min-h-10 w-full rounded-xl border border-outline bg-surface px-3 text-sm text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
          >
            <option value="">案件を添付しない</option>
            {shareableCases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.displayNumber} · {caseItem.workflowName} ·{" "}
                {caseItem.statusLabel}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={isPending} className="sm:min-w-28">
          {isPending ? "送信中…" : "送信"}
        </Button>
      </div>
    </form>
  );
}
