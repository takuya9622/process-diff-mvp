import type { MouseEventHandler } from "react";
import Link from "next/link";

import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import { createEntityPath } from "@/constants/routes";
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
  return (
    <aside
      aria-labelledby="entity-navigation-title"
      className="rounded-3xl border border-outline bg-surface p-3 shadow-panel lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto"
    >
      <div className="px-3 pt-2 pb-3">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          Sample workspace
        </p>
        <h2
          id="entity-navigation-title"
          className="mt-1 text-lg font-semibold text-content-primary"
        >
          経費精算の業務要素
        </h2>
        <p className="mt-1 text-xs leading-5 text-content-tertiary">
          {entities.length}件の要素を種類とともに表示
        </p>
      </div>
      <nav aria-label="業務要素">
        <ul className="space-y-1">
          {entities.map((entity) => {
            const isSelected = entity.id === selectedEntityId;

            return (
              <li key={entity.id}>
                <Link
                  href={createEntityPath(organizationSlug, entity.id)}
                  aria-current={isSelected ? "page" : undefined}
                  onClick={onNavigate}
                  className={`block w-full rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isSelected
                      ? "border-action-primary bg-action-muted"
                      : "border-transparent hover:border-outline hover:bg-surface-muted"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-content-primary">
                        {entity.name}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-content-tertiary">
                        {entity.description}
                      </span>
                    </span>
                    <EntityTypeBadge
                      type={entity.type}
                      label={entity.typeLabel}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
