"use client";

import { useActionState } from "react";

import { createOrganizationAction } from "@/app/onboarding/actions";
import { Button } from "@/components/general/button";
import type { CreateOrganizationResult } from "@/types/actions";

const INITIAL_STATE: CreateOrganizationResult = { status: "idle" };

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, isPending] = useActionState(
    createOrganizationAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="mt-8">
      <label className="block text-sm font-semibold text-content-primary">
        組織名
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-outline-strong bg-surface px-4 text-base font-normal focus:border-action-primary focus:ring-2 focus:ring-focus-ring/30 focus:outline-none"
          name="name"
          defaultValue={defaultName}
          minLength={2}
          maxLength={80}
          autoComplete="organization"
          required
        />
      </label>
      {state.status === "invalid" || state.status === "error" ? (
        <p
          role="alert"
          className="mt-4 text-sm font-semibold text-status-danger-content"
        >
          {state.message}
        </p>
      ) : null}
      <Button className="mt-7 w-full" type="submit" disabled={isPending}>
        {isPending ? "ワークスペースを準備しています…" : "作成して始める"}
      </Button>
    </form>
  );
}
