import type { MouseEventHandler } from "react";
import Link from "next/link";

import { Button } from "@/components/general/button";
import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import { SectionHeading } from "@/components/general/section-heading";
import {
  BusinessDocument,
  getBusinessDocumentOutline,
} from "@/components/pages/business-workspace/entity-detail/business-document";
import { createEntityPath } from "@/constants/routes";
import type { BusinessEntity } from "@/types/business-entity";
import type { DirectRelation } from "@/types/workspace";

export function EntityDetail({
  organizationSlug,
  entity,
  directRelations,
  onEdit,
  onNavigate,
}: {
  organizationSlug: string;
  entity: BusinessEntity;
  directRelations: DirectRelation[];
  onEdit?: () => void;
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const outline = getBusinessDocumentOutline(entity.content);

  return (
    <div>
      <SectionHeading
        eyebrow="業務知識"
        title={entity.name}
        description={entity.description ?? undefined}
        focusTarget
        action={
          onEdit ? (
            <Button variant="secondary" onClick={onEdit}>
              変更案を作成
            </Button>
          ) : (
            <span className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-semibold text-content-secondary">
              閲覧者は変更できません
            </span>
          )
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-outline pb-5 text-xs text-content-tertiary">
        <EntityTypeBadge type={entity.type} label={entity.typeLabel} />
        <span>更新 {formatDate(entity.updatedAt)}</span>
        <span aria-hidden="true">·</span>
        <span>{directRelations.length}件の関連項目</span>
      </div>

      <div className="mt-8 grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <article aria-labelledby="business-document-title" className="min-w-0">
          <h2 id="business-document-title" className="sr-only">
            本文
          </h2>
          <BusinessDocument content={entity.content} />
        </article>

        <aside className="space-y-7 xl:sticky xl:top-5">
          {outline.length > 0 ? (
            <nav aria-labelledby="document-outline-title">
              <h2
                id="document-outline-title"
                className="text-xs font-bold tracking-[0.12em] text-content-tertiary uppercase"
              >
                このページ
              </h2>
              <ol className="mt-3 border-l border-outline pl-3">
                {outline.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`block rounded-lg py-1.5 text-xs leading-5 text-content-secondary transition-colors hover:text-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none ${
                        heading.level === 3 ? "pl-3" : "font-semibold"
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <section aria-labelledby="direct-relations-title">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="direct-relations-title"
                className="text-xs font-bold tracking-[0.12em] text-content-tertiary uppercase"
              >
                関連項目
              </h2>
              <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[0.7rem] font-bold text-content-secondary">
                {directRelations.length}
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-outline bg-surface">
              {directRelations.map(({ relatedEntity, step }) => (
                <Link
                  key={step.relationId}
                  href={createEntityPath(organizationSlug, relatedEntity.id)}
                  onClick={onNavigate}
                  className="group block border-b border-outline px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-action-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-content-primary">
                      {relatedEntity.name}
                    </span>
                    <span aria-hidden="true" className="text-action-primary">
                      →
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-content-tertiary">
                    {step.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
