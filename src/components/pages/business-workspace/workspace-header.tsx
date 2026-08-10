"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/general/button";
import { SIGN_IN_PATH } from "@/constants/routes";
import { authClient } from "@/lib/auth/client";

export function WorkspaceHeader({
  organizationName,
  userName,
  roleLabel,
  onReset,
  isPending,
}: {
  organizationName: string;
  userName: string;
  roleLabel: string;
  onReset?: () => void;
  isPending: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push(SIGN_IN_PATH);
    router.refresh();
  }

  return (
    <header className="border-b border-outline bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-content-primary text-sm font-black tracking-tight text-surface">
            PD
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-content-primary sm:text-base">
                Process Diff
              </p>
              <span className="rounded-full bg-status-info-bg px-2 py-0.5 text-[0.65rem] font-bold tracking-[0.08em] text-status-info-content">
                アクセス権限: {roleLabel}
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              業務知識ワークスペース · {organizationName} · あなた: {userName}
            </p>
            <p className="mt-0.5 text-xs text-content-tertiary">
              業務を起点に全体像を理解し、必要なときは安全に変更できる
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          {onReset ? (
            <Button
              data-testid="reset-demo-button"
              variant="secondary"
              disabled={isPending || isSigningOut}
              onClick={onReset}
            >
              <span aria-hidden="true">↺</span>
              <span className="hidden sm:inline">サンプルを</span>初期化
            </Button>
          ) : null}
          <Button
            variant="ghost"
            disabled={isPending || isSigningOut}
            onClick={signOut}
          >
            {isSigningOut ? "ログアウト中…" : "ログアウト"}
          </Button>
        </div>
      </div>
    </header>
  );
}
