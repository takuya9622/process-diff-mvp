"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelExpenseCaseAction } from "@/app/organizations/[organizationSlug]/workflow-actions";
import { Button } from "@/components/general/button";

export function CancelCaseButton({
  organizationSlug,
  caseId,
}: {
  organizationSlug: string;
  caseId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancelCase() {
    if (!window.confirm("この経費申請を取り下げますか？")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelExpenseCaseAction(organizationSlug, caseId);
      if (result.status === "success") {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="text-right">
      <Button variant="ghost" disabled={isPending} onClick={cancelCase}>
        {isPending ? "取下げ中…" : "申請を取り下げる"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-status-danger-content">
          {error}
        </p>
      ) : null}
    </div>
  );
}
