"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { resetDemoAction } from "@/app/actions";
import { EntityNavigation } from "@/components/pages/business-workspace/entity-navigation/entity-navigation";
import { WorkspaceSidebar } from "@/components/pages/business-workspace/workspace-sidebar";
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
  const pathname = usePathname();
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
      "この組織の案件、作業、メッセージ、変更内容、変更履歴を削除し、初期状態へ戻します。続けますか？",
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
      <div className="min-h-screen lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <WorkspaceSidebar
          organizationSlug={organizationSlug}
          organizationName={organizationName}
          userName={userName}
          roleLabel={roleLabel}
          onReset={canReset ? resetDemo : undefined}
          isPending={isPending}
        />
        <main
          aria-busy={isPending}
          className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 xl:px-8"
        >
          {resetError ? (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-status-danger-content/20 bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
            >
              {resetError}
            </div>
          ) : null}

          <div
            className={`mx-auto grid max-w-[96rem] items-start gap-5 ${
              isKnowledgePath(pathname, organizationSlug)
                ? "xl:grid-cols-[19rem_minmax(0,1fr)]"
                : "grid-cols-1"
            }`}
          >
            {isKnowledgePath(pathname, organizationSlug) ? (
              <EntityNavigation
                organizationSlug={organizationSlug}
                entities={entities}
                selectedEntityId={routeState.activeEntityId}
                onNavigate={handleEntityNavigate}
              />
            ) : null}
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

function isKnowledgePath(pathname: string, organizationSlug: string) {
  const organizationPath = createOrganizationPath(organizationSlug);
  return (
    pathname.startsWith(`${organizationPath}/documents`) ||
    pathname.startsWith(`${organizationPath}/entities`) ||
    pathname.startsWith(`${organizationPath}/changes`)
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
