import type { MouseEventHandler } from "react";
import Link from "next/link";

import type { BusinessEntityType } from "@/constants/business-entity";
import { createEntityPath } from "@/constants/routes";
import type { DirectRelation } from "@/types/workspace";

type RelationGroupKey =
  | "rules"
  | "systems"
  | "roles"
  | "documents"
  | "previous-processes"
  | "next-processes"
  | "related-processes";

const PROCESS_RELATION_GROUP_ORDER: readonly RelationGroupKey[] = [
  "rules",
  "systems",
  "roles",
  "documents",
  "previous-processes",
  "next-processes",
  "related-processes",
];

const RELATED_RELATION_GROUP_ORDER: readonly RelationGroupKey[] = [
  "related-processes",
  "rules",
  "systems",
  "roles",
  "documents",
];

const RELATION_GROUP_LABELS: Record<RelationGroupKey, string> = {
  rules: "ルール",
  systems: "使用システム",
  roles: "担当・承認",
  documents: "関連文書",
  "previous-processes": "前工程",
  "next-processes": "後工程",
  "related-processes": "関係する業務",
};

export function EntityRelations({
  organizationSlug,
  entityType,
  directRelations,
  onNavigate,
}: {
  organizationSlug: string;
  entityType: BusinessEntityType;
  directRelations: DirectRelation[];
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const relationGroups = groupDirectRelations(entityType, directRelations);
  const title = entityType === "PROCESS" ? "業務の構成" : "関連項目";

  return (
    <section aria-labelledby="direct-relations-title">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="direct-relations-title"
          className="text-xs font-bold tracking-[0.12em] text-content-tertiary uppercase"
        >
          {title}
        </h2>
        <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[0.7rem] font-bold text-content-secondary">
          {directRelations.length}
        </span>
      </div>
      {relationGroups.length > 0 ? (
        <div className="mt-4 space-y-5">
          {relationGroups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`relation-group-${group.key}`}
            >
              <h3
                id={`relation-group-${group.key}`}
                className="text-xs font-semibold text-content-secondary"
              >
                {group.label}
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-outline bg-surface">
                {group.relations.map(({ relatedEntity, step }) => (
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
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-4 text-xs leading-5 text-content-tertiary">
          関連する業務知識はありません。
        </p>
      )}
    </section>
  );
}

function groupDirectRelations(
  entityType: BusinessEntityType,
  directRelations: DirectRelation[],
) {
  const relationsByGroup = new Map<RelationGroupKey, DirectRelation[]>();

  for (const relation of directRelations) {
    const groupKey = getRelationGroupKey(entityType, relation);
    const relations = relationsByGroup.get(groupKey) ?? [];
    relations.push(relation);
    relationsByGroup.set(groupKey, relations);
  }

  const groupOrder =
    entityType === "PROCESS"
      ? PROCESS_RELATION_GROUP_ORDER
      : RELATED_RELATION_GROUP_ORDER;

  return groupOrder.flatMap((key) => {
    const relations = relationsByGroup.get(key);

    return relations
      ? [{ key, label: RELATION_GROUP_LABELS[key], relations }]
      : [];
  });
}

function getRelationGroupKey(
  entityType: BusinessEntityType,
  relation: DirectRelation,
): RelationGroupKey {
  switch (relation.relatedEntity.type) {
    case "RULE":
      return "rules";
    case "SYSTEM":
      return "systems";
    case "ROLE":
      return "roles";
    case "DOCUMENT":
      return "documents";
    case "PROCESS":
      if (entityType !== "PROCESS") {
        return "related-processes";
      }

      if (relation.step.relationType === "REQUIRES") {
        return relation.step.direction === "forward"
          ? "previous-processes"
          : "next-processes";
      }

      return "related-processes";
  }
}
