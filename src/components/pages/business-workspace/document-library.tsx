import Link from "next/link";

import { BUSINESS_ENTITY_TYPES } from "@/constants/business-entity";
import { createEntityPath } from "@/constants/routes";
import type { WorkspaceNavigationEntity } from "@/types/workspace";

export function DocumentLibrary({
  organizationSlug,
  entities,
}: {
  organizationSlug: string;
  entities: WorkspaceNavigationEntity[];
}) {
  return (
    <div className="space-y-8 p-5 sm:p-8">
      <header className="border-b border-outline pb-6">
        <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
          規定・文書
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">
          業務ナレッジ
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-secondary">
          規定、業務手順、役割、利用システムを種類ごとに整理しています。左の一覧から横断検索もできます。
        </p>
      </header>

      <div className="space-y-8">
        {BUSINESS_ENTITY_TYPES.map((type) => {
          const group = entities.filter((entity) => entity.type === type);
          if (group.length === 0) {
            return null;
          }

          return (
            <section key={type} aria-labelledby={`library-${type}`}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    id={`library-${type}`}
                    className="text-xl font-bold text-content-primary"
                  >
                    {group[0].typeLabel}
                  </h2>
                  <p className="mt-1 text-sm text-content-tertiary">
                    {getGroupDescription(type)}
                  </p>
                </div>
                <span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-bold text-content-secondary">
                  {group.length}件
                </span>
              </div>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {group.map((entity) => (
                  <li key={entity.id}>
                    <Link
                      href={createEntityPath(organizationSlug, entity.id)}
                      className="group block h-full rounded-2xl border border-outline bg-surface-muted p-4 transition-colors hover:border-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none"
                    >
                      <h3 className="font-bold text-content-primary group-hover:text-action-primary">
                        {entity.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-content-secondary">
                        {entity.description || "説明は登録されていません。"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function getGroupDescription(type: WorkspaceNavigationEntity["type"]) {
  return {
    PROCESS: "業務の開始条件、手順、完了条件",
    RULE: "判断基準と守るべきルール",
    DOCUMENT: "正式な規程と利用者向け文書",
    ROLE: "担当者の責任と確認事項",
    SYSTEM: "業務で利用するシステムの役割",
  }[type];
}
