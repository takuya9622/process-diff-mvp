"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/general/button";
import {
  createCasesPath,
  createCommunicationPath,
  createDocumentLibraryPath,
  createOrganizationPath,
  createWorkflowCatalogPath,
  SIGN_IN_PATH,
} from "@/constants/routes";
import { authClient } from "@/lib/auth/client";

type NavigationItem = {
  label: string;
  description: string;
  href: string;
  icon: string;
  isActive: (pathname: string) => boolean;
};

export function WorkspaceSidebar({
  organizationSlug,
  organizationName,
  userName,
  roleLabel,
  onReset,
  isPending,
}: {
  organizationSlug: string;
  organizationName: string;
  userName: string;
  roleLabel: string;
  onReset?: () => void;
  isPending: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const organizationPath = createOrganizationPath(organizationSlug);
  const workflowsPath = createWorkflowCatalogPath(organizationSlug);
  const casesPath = createCasesPath(organizationSlug);
  const documentsPath = createDocumentLibraryPath(organizationSlug);
  const communicationPath = createCommunicationPath(organizationSlug);

  const sections: { label: string; items: NavigationItem[] }[] = [
    {
      label: "概要",
      items: [
        {
          label: "ダッシュボード",
          description: "対応待ちと最近の動き",
          href: organizationPath,
          icon: "⌂",
          isActive: (value) => value === organizationPath,
        },
      ],
    },
    {
      label: "ワークフロー",
      items: [
        {
          label: "業務を開始",
          description: "利用できる業務を選ぶ",
          href: workflowsPath,
          icon: "▷",
          isActive: (value) => value.startsWith(workflowsPath),
        },
        {
          label: "自分の案件",
          description: "進行状況と作業を確認",
          href: casesPath,
          icon: "✓",
          isActive: (value) => value.startsWith(casesPath),
        },
      ],
    },
    {
      label: "ナレッジ",
      items: [
        {
          label: "規定・文書",
          description: "ルールと業務手順を参照",
          href: documentsPath,
          icon: "§",
          isActive: (value) =>
            value.startsWith(documentsPath) ||
            value.startsWith(`${organizationPath}/entities`) ||
            value.startsWith(`${organizationPath}/changes`),
        },
      ],
    },
    {
      label: "コラボレーション",
      items: [
        {
          label: "コミュニケーション",
          description: "相談と案件共有",
          href: communicationPath,
          icon: "#",
          isActive: (value) => value.startsWith(communicationPath),
        },
      ],
    },
  ];

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push(SIGN_IN_PATH);
    router.refresh();
  }

  return (
    <aside className="border-b border-outline bg-content-primary text-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 border-b border-surface/10 px-5 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-sm font-black tracking-tight text-content-primary">
          PD
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">Process Diff</p>
          <p className="truncate text-xs text-surface/60">{organizationName}</p>
        </div>
      </div>

      <nav
        aria-label="主ナビゲーション"
        className="grid gap-5 overflow-x-auto px-3 py-4 sm:grid-cols-4 lg:block lg:flex-1 lg:space-y-6 lg:overflow-y-auto"
      >
        {sections.map((section) => (
          <section key={section.label} aria-label={section.label}>
            <p className="px-3 text-[0.65rem] font-bold tracking-[0.14em] text-surface/45 uppercase">
              {section.label}
            </p>
            <ul className="mt-1 space-y-1">
              {section.items.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-w-44 items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none lg:min-w-0 ${
                        active
                          ? "bg-surface/15 text-surface"
                          : "text-surface/70 hover:bg-surface/10 hover:text-surface"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                          active
                            ? "bg-surface text-content-primary"
                            : "bg-surface/10"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[0.7rem] leading-4 opacity-70">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="border-t border-surface/10 p-4">
        <div className="rounded-xl bg-surface/10 px-3 py-2.5">
          <p className="truncate text-sm font-bold">{userName}</p>
          <p className="mt-0.5 text-xs text-surface/60">{roleLabel}</p>
        </div>
        <SidebarActions>
          {onReset ? (
            <Button
              data-testid="reset-demo-button"
              variant="secondary"
              disabled={isPending || isSigningOut}
              onClick={onReset}
              className="flex-1"
            >
              初期化
            </Button>
          ) : null}
          <Button
            variant="ghost"
            disabled={isPending || isSigningOut}
            onClick={signOut}
            className="flex-1 text-surface hover:bg-surface/10"
          >
            {isSigningOut ? "処理中…" : "ログアウト"}
          </Button>
        </SidebarActions>
      </div>
    </aside>
  );
}

function SidebarActions({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex gap-2">{children}</div>;
}
