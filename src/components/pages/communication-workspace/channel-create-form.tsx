"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createCommunicationChannelAction } from "@/app/organizations/[organizationSlug]/communication-actions";
import { Button } from "@/components/general/button";
import { createCommunicationPath } from "@/constants/routes";
import type { CommunicationActionResult } from "@/types/communication";

export function ChannelCreateForm({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    CommunicationActionResult | null,
    FormData
  >(createCommunicationChannelAction.bind(null, organizationSlug), null);

  useEffect(() => {
    if (state?.status === "success") {
      router.push(createCommunicationPath(organizationSlug, state.channelId));
      router.refresh();
    }
  }, [organizationSlug, router, state]);

  return (
    <details className="rounded-2xl border border-outline bg-surface-muted p-3">
      <summary className="cursor-pointer text-sm font-bold text-action-primary">
        チャンネルを作成
      </summary>
      <form action={formAction} className="mt-4 space-y-3">
        {state && state.status !== "success" ? (
          <p
            role="alert"
            className="text-sm font-semibold text-status-danger-content"
          >
            {state.message}
          </p>
        ) : null}
        <label className="block text-xs font-bold text-content-secondary">
          チャンネル名
          <input
            name="name"
            required
            minLength={2}
            maxLength={40}
            placeholder="例: 総務相談"
            className="mt-1.5 min-h-10 w-full rounded-xl border border-outline bg-surface px-3 text-sm text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
          />
        </label>
        <label className="block text-xs font-bold text-content-secondary">
          説明
          <textarea
            name="description"
            rows={3}
            maxLength={120}
            placeholder="何を相談・共有する場所か"
            className="mt-1.5 w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
          />
        </label>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "作成中…" : "作成する"}
        </Button>
      </form>
    </details>
  );
}
