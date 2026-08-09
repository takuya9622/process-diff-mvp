import { Button } from "@/components/general/button";
import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import { SectionHeading } from "@/components/general/section-heading";
import type { BusinessEntity } from "@/types/business-entity";
import type { DirectRelation } from "@/types/workspace";

export function EntityDetail({
  entity,
  directRelations,
  onEdit,
  onSelectEntity,
}: {
  entity: BusinessEntity;
  directRelations: DirectRelation[];
  onEdit: () => void;
  onSelectEntity: (entityId: string) => void;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Current state"
        title={entity.name}
        description={entity.description ?? undefined}
        focusTarget
        action={<Button onClick={onEdit}>この業務を変更する</Button>}
      />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section aria-labelledby="current-content-title">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="current-content-title"
              className="text-base font-semibold text-content-primary"
            >
              現在の内容
            </h2>
            <div className="flex items-center gap-2">
              <EntityTypeBadge type={entity.type} label={entity.typeLabel} />
              <span className="text-xs font-semibold text-content-tertiary">
                v{entity.currentVersionNumber}
              </span>
            </div>
          </div>
          <ol className="mt-4 overflow-hidden rounded-2xl border border-outline bg-surface-muted">
            {entity.content.split("\n").map((line, index) => (
              <li
                key={`${index}-${line}`}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-b border-outline px-3 py-4 last:border-b-0"
              >
                <span className="text-center font-mono text-xs text-content-tertiary">
                  {index + 1}
                </span>
                <span className="text-sm leading-7 whitespace-pre-wrap text-content-primary">
                  {line}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="direct-relations-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2
                id="direct-relations-title"
                className="text-base font-semibold text-content-primary"
              >
                直接関係する項目
              </h2>
              <p className="mt-1 text-xs text-content-tertiary">
                登録された関係を両方向から表示
              </p>
            </div>
            <span className="rounded-full bg-surface-strong px-2.5 py-1 text-xs font-bold text-content-secondary">
              {directRelations.length}件
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {directRelations.map(({ relatedEntity, step }) => (
              <button
                key={step.relationId}
                type="button"
                onClick={() => onSelectEntity(relatedEntity.id)}
                className="group w-full rounded-2xl border border-outline bg-surface p-4 text-left transition-colors hover:border-action-primary hover:bg-action-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-content-primary">
                    {relatedEntity.name}
                  </span>
                  <span aria-hidden="true" className="text-action-primary">
                    →
                  </span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-content-secondary">
                  {step.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
