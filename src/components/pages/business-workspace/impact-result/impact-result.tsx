import type { MouseEventHandler } from "react";
import Link from "next/link";

import { DiffView } from "@/components/general/diff-view";
import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import { SectionHeading } from "@/components/general/section-heading";
import { createEntityPath } from "@/constants/routes";
import type { BusinessEntity } from "@/types/business-entity";
import type { ChangeResult } from "@/types/change-set";
import type { ImpactCandidate } from "@/types/impact";

export function ImpactResult({
  organizationSlug,
  entity,
  changeResult,
  selectedCandidateId,
  onSelectCandidate,
  onNavigate,
}: {
  organizationSlug: string;
  entity: BusinessEntity;
  changeResult: ChangeResult;
  selectedCandidateId: string | null;
  onSelectCandidate: (entityId: string) => void;
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  const selectedCandidate =
    changeResult.impactCandidates.find(
      (candidate) => candidate.entity.id === selectedCandidateId,
    ) ?? changeResult.impactCandidates[0];
  const directCandidates = changeResult.impactCandidates.filter(
    (candidate) => candidate.distance === 1,
  );
  const secondaryCandidates = changeResult.impactCandidates.filter(
    (candidate) => candidate.distance === 2,
  );

  return (
    <div>
      <SectionHeading
        eyebrow="Change confirmed"
        title="変更と影響候補を確認"
        description={`${entity.name}の変更を保存しました。以下は、影響を断定する結果ではなく確認が必要な候補です。`}
        focusTarget
        action={
          <Link
            href={createEntityPath(organizationSlug, entity.id)}
            onClick={onNavigate}
            className={SECONDARY_LINK_CLASSES}
          >
            現在の内容を見る
          </Link>
        }
      />

      <div
        role="status"
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-change-added-outline bg-change-added-bg p-4 text-change-added-content sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface font-bold"
          >
            ✓
          </span>
          <div>
            <p className="font-semibold">変更を保存しました</p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              {changeResult.changedByName} ·{" "}
              {formatDateTime(changeResult.createdAt)} · 変更ID{" "}
              {changeResult.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex gap-5 text-sm">
          <span>
            <strong className="text-xl tabular-nums">
              {changeResult.diffSummary.added +
                changeResult.diffSummary.removed}
            </strong>{" "}
            変更行
          </span>
          <span>
            <strong className="text-xl tabular-nums">
              {changeResult.impactCandidates.length}
            </strong>{" "}
            候補
          </span>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="confirmed-diff-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="confirmed-diff-title"
              className="text-lg font-semibold text-content-primary"
            >
              確定した変更内容
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              変更前と変更後を行単位で比較
            </p>
          </div>
          {changeResult.reason ? (
            <p className="max-w-xl text-sm text-content-secondary">
              <span className="font-semibold text-content-primary">理由:</span>{" "}
              {changeResult.reason}
            </p>
          ) : null}
        </div>
        <div className="mt-4">
          <DiffView diff={changeResult.diff} />
        </div>
      </section>

      <section
        className="mt-10 border-t border-outline pt-8"
        aria-labelledby="impact-candidates-title"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="impact-candidates-title"
              className="text-lg font-semibold text-content-primary"
            >
              確認が必要な候補
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              登録された関係を変更元から最大2段階まで探索
            </p>
          </div>
          <p className="text-xs font-semibold text-content-tertiary">
            直接 {directCandidates.length}件 · 2段階先{" "}
            {secondaryCandidates.length}件
          </p>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-6">
            <CandidateGroup
              title="直接関係"
              candidates={directCandidates}
              selectedCandidateId={selectedCandidate?.entity.id ?? null}
              onSelect={onSelectCandidate}
            />
            <CandidateGroup
              title="2段階先の関連項目"
              candidates={secondaryCandidates}
              selectedCandidateId={selectedCandidate?.entity.id ?? null}
              onSelect={onSelectCandidate}
            />
          </div>

          {selectedCandidate ? (
            <PathDetail
              organizationSlug={organizationSlug}
              originEntity={entity}
              candidate={selectedCandidate}
              onNavigate={onNavigate}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function CandidateGroup({
  title,
  candidates,
  selectedCandidateId,
  onSelect,
}: {
  title: string;
  candidates: ImpactCandidate[];
  selectedCandidateId: string | null;
  onSelect: (entityId: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold tracking-[0.12em] text-content-tertiary uppercase">
        {title}
      </h3>
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = candidate.entity.id === selectedCandidateId;

          return (
            <button
              key={candidate.entity.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(candidate.entity.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                isSelected
                  ? "border-action-primary bg-action-muted"
                  : "border-outline bg-surface hover:border-outline-strong hover:bg-surface-muted"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-semibold text-content-primary">
                  {candidate.entity.name}
                </span>
                <EntityTypeBadge
                  type={candidate.entity.type}
                  label={candidate.entity.typeLabel}
                />
              </span>
              <span className="mt-2 line-clamp-2 block text-xs leading-5 text-content-secondary">
                {candidate.reason}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PathDetail({
  organizationSlug,
  originEntity,
  candidate,
  onNavigate,
}: {
  organizationSlug: string;
  originEntity: BusinessEntity;
  candidate: ImpactCandidate;
  onNavigate: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <div
      data-testid="impact-path-detail"
      className="rounded-3xl border border-outline bg-surface-muted p-5 sm:p-6 xl:sticky xl:top-5 xl:self-start"
    >
      <div className="flex flex-col gap-3 border-b border-outline pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-action-primary uppercase">
            Why this candidate
          </p>
          <h3 className="mt-2 text-xl font-semibold text-content-primary">
            {candidate.entity.name}までの関係経路
          </h3>
          <p className="mt-2 text-sm text-content-secondary">
            {candidate.distanceLabel} · 最短経路を1件表示
          </p>
        </div>
        <EntityTypeBadge
          type={candidate.entity.type}
          label={candidate.entity.typeLabel}
        />
      </div>

      <ol className="mt-5 space-y-4">
        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-content-primary text-xs font-bold text-surface">
            0
          </span>
          <div>
            <p className="text-xs font-semibold text-content-tertiary">
              変更元
            </p>
            <p className="mt-0.5 font-semibold text-content-primary">
              {originEntity.name}
            </p>
          </div>
        </li>
        {candidate.path.map((step, index) => (
          <li key={step.relationId} className="relative flex gap-3">
            <span className="absolute -top-4 left-3 h-4 w-px bg-outline-strong" />
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-outline-strong bg-surface text-xs font-bold text-content-primary">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-5 text-content-secondary">
                {step.description}
              </p>
              <p className="mt-1 font-semibold text-content-primary">
                {step.toEntityName}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href={createEntityPath(organizationSlug, candidate.entity.id)}
        onClick={onNavigate}
        className={`${SECONDARY_LINK_CLASSES} mt-6 w-full`}
      >
        {candidate.entity.name}の詳細を見る
      </Link>
    </div>
  );
}

const SECONDARY_LINK_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-strong bg-surface px-4 py-2.5 text-sm font-semibold text-content-primary transition-colors hover:border-action-primary hover:bg-action-muted focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
