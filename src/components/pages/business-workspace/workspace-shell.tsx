"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { resetDemoAction } from "@/app/actions";
import { EntityNavigation } from "@/components/pages/business-workspace/entity-navigation/entity-navigation";
import { WorkspaceHeader } from "@/components/pages/business-workspace/workspace-header";
import { createOrganizationPath } from "@/constants/routes";
import type { WorkspaceNavigationEntity } from "@/types/workspace";

type WorkspaceRouteState = {
  activeEntityId: string | null;
  hasUnconfirmedDraft: boolean;
};

const WorkspaceRouteStateContext = createContext<
  ((state: WorkspaceRouteState) => void) | null
>(null);

export function WorkspaceShell({
  organizationSlug,
  organizationName,
  userName,
  roleLabel,
  canReset,
  entities,
  children,
}: {
  organizationSlug: string;
  organizationName: string;
  userName: string;
  roleLabel: string;
  canReset: boolean;
  entities: WorkspaceNavigationEntity[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);
  const [routeState, setRouteState] = useState<WorkspaceRouteState>({
    activeEntityId: null,
    hasUnconfirmedDraft: false,
  });

  const handleEntityNavigate: MouseEventHandler<HTMLAnchorElement> = (
    event,
  ) => {
    if (
      routeState.hasUnconfirmedDraft &&
      !window.confirm("未確定の変更案を破棄して移動しますか？")
    ) {
      event.preventDefault();
    }
  };

  function resetDemo() {
    const confirmed = window.confirm(
      "この組織の案件、作業、変更内容、変更履歴を削除し、初期状態へ戻します。続けますか？",
    );

    if (!confirmed) {
      return;
    }

    setResetError(null);
    startTransition(async () => {
      const result = await resetDemoAction(organizationSlug);

      if (result.status === "success") {
        router.push(createOrganizationPath(organizationSlug));
        router.refresh();
        return;
      }

      setResetError(result.message);
    });
  }

  return (
    <WorkspaceRouteStateContext.Provider value={setRouteState}>
      <div className="min-h-screen">
        <WorkspaceHeader
          organizationName={organizationName}
          userName={userName}
          roleLabel={roleLabel}
          onReset={canReset ? resetDemo : undefined}
          isPending={isPending}
        />
        <main
          aria-busy={isPending}
          className="mx-auto max-w-[92rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"
        >
          {resetError ? (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-status-danger-content/20 bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
            >
              {resetError}
            </div>
          ) : null}

          <div className="grid items-start gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <EntityNavigation
              organizationSlug={organizationSlug}
              entities={entities}
              selectedEntityId={routeState.activeEntityId}
              onNavigate={handleEntityNavigate}
            />
            <div className="min-w-0 rounded-3xl border border-outline bg-surface shadow-panel">
              {children}
            </div>
          </div>

          <footer className="px-2 pt-6 pb-2 text-center text-xs leading-5 text-content-tertiary">
            Process Diff MVP ·
            組織ごとに分離された架空の業務知識を使用しています
          </footer>
        </main>
      </div>
    </WorkspaceRouteStateContext.Provider>
  );
}

export function useWorkspaceRouteState(
  activeEntityId: string,
  hasUnconfirmedDraft: boolean,
) {
  const setRouteState = useContext(WorkspaceRouteStateContext);

  if (!setRouteState) {
    throw new Error(
      "useWorkspaceRouteState must be used within WorkspaceShell.",
    );
  }

  useEffect(() => {
    setRouteState({ activeEntityId, hasUnconfirmedDraft });

    return () => {
      setRouteState({
        activeEntityId: null,
        hasUnconfirmedDraft: false,
      });
    };
  }, [activeEntityId, hasUnconfirmedDraft, setRouteState]);
}
