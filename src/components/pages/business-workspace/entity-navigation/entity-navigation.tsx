"use client";

import { useMemo, useState } from "react";
import type { MouseEventHandler } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BUSINESS_ENTITY_TYPES } from "@/constants/business-entity";
import {
  createCasesPath,
  createEntityPath,
  createOrganizationPath,
  createWorkflowCatalogPath,
} from "@/constants/routes";
import type { WorkspaceNavigationEntity } from "@/types/workspace";

export function EntityNavigation({
  organizationSlug,
  entities,
  selectedEntityId,
  onNavigate,
}: {
  organizationSlug: string;
  entities: WorkspaceNavigationEntity[];
  selectedEntityId: string | null;
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const organizationPath = createOrganizationPath(organizationSlug);
  const primaryNavigation = [
    {
      label: "ホーム",
      description: "対応待ちと最近の案件",
      href: organizationPath,
      isActive: pathname === organizationPath,
    },
    {
      label: "業務を開始",
      description: "公開済みの業務から選ぶ",
      href: createWorkflowCatalogPath(organizationSlug),
      isActive: pathname.startsWith(
        createWorkflowCatalogPath(organizationSlug),
      ),
    },
    {
      label: "案件",
      description: "現在地と証跡を確認",
      href: createCasesPath(organizationSlug),
      isActive: pathname.startsWith(createCasesPath(organizationSlug)),
    },
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");
  const visibleEntities = useMemo(
    () =>
      normalizedQuery
        ? entities.filter((entity) =>
            [entity.name, entity.description, entity.typeLabel]
              .filter(Boolean)
              .some((value) =>
                value?.toLocaleLowerCase("ja-JP").includes(normalizedQuery),
              ),
          )
        : entities,
    [entities, normalizedQuery],
  );

  return (
    <aside
      aria-labelledby="entity-navigation-title"
      className="rounded-3xl border border-outline bg-surface p-3 shadow-panel lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto"
    >
      <nav aria-label="業務" className="border-b border-outline px-1 pb-4">
        <p className="px-2 pt-1 text-[0.7rem] font-bold tracking-[0.12em] text-content-tertiary uppercase">
          業務
        </p>
        <ul className="mt-1 space-y-1">
          {primaryNavigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                onClick={onNavigate}
                className={`block rounded-xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none ${
                  item.isActive
                    ? "bg-action-muted text-action-primary"
                    : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-0.5 block text-xs opacity-80">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-2 pt-2 pb-3">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          業務知識
        </p>
        <h2
          id="entity-navigation-title"
          className="mt-1 text-lg font-semibold text-content-primary"
        >
          経費精算
        </h2>
        <p className="mt-1 text-xs leading-5 text-content-tertiary">
          ページを探して、関係をたどる
        </p>
      </div>

      <label className="relative mt-1 block px-1">
        <span className="sr-only">業務知識を検索</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-content-tertiary"
        >
          ⌕
        </span>
        <input
          type="search"
          value={query}
          placeholder="ページを検索"
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-10 w-full rounded-xl border border-outline bg-surface-muted pr-3 pl-9 text-sm text-content-primary placeholder:text-content-tertiary focus:border-action-primary focus:ring-2 focus:ring-focus-ring/25 focus:outline-none"
        />
      </label>

      <nav aria-label="業務知識" className="mt-4">
        {visibleEntities.length > 0 ? (
          <div className="space-y-5">
            {BUSINESS_ENTITY_TYPES.map((type) => {
              const group = visibleEntities.filter(
                (entity) => entity.type === type,
              );

              if (group.length === 0) {
                return null;
              }

              return (
                <section key={type} aria-labelledby={`entity-group-${type}`}>
                  <h3
                    id={`entity-group-${type}`}
                    className="px-2 text-[0.7rem] font-bold tracking-[0.12em] text-content-tertiary uppercase"
                  >
                    {group[0].typeLabel}
                    <span className="ml-1.5 font-semibold tracking-normal">
                      {group.length}
                    </span>
                  </h3>
                  <ul className="mt-1 space-y-0.5">
                    {group.map((entity) => {
                      const isSelected = entity.id === selectedEntityId;

                      return (
                        <li key={entity.id}>
                          <Link
                            href={createEntityPath(organizationSlug, entity.id)}
                            aria-current={isSelected ? "page" : undefined}
                            onClick={onNavigate}
                            className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none ${
                              isSelected
                                ? "bg-action-muted font-semibold text-action-primary"
                                : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`size-1.5 shrink-0 rounded-full ${
                                isSelected
                                  ? "bg-action-primary"
                                  : "bg-outline-strong"
                              }`}
                            />
                            <span className="min-w-0 truncate">
                              {entity.name}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-muted px-3 py-6 text-center text-xs leading-5 text-content-tertiary">
            「{query}」に一致するページはありません
          </p>
        )}
      </nav>
    </aside>
  );
}
