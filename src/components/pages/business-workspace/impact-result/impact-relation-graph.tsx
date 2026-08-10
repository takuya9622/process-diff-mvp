import { EntityTypeBadge } from "@/components/general/entity-type-badge";
import type { BusinessEntity } from "@/types/business-entity";
import type { ImpactCandidate } from "@/types/impact";

const CANVAS_WIDTH = 768;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;
const NODE_GAP = 18;
const ORIGIN_X = 16;
const DIRECT_X = 284;
const SECONDARY_X = 552;

type PositionedCandidate = {
  candidate: ImpactCandidate;
  x: number;
  y: number;
};

export function ImpactRelationGraph({
  originEntity,
  directCandidates,
  secondaryCandidates,
  selectedCandidateId,
  onSelect,
}: {
  originEntity: BusinessEntity;
  directCandidates: ImpactCandidate[];
  secondaryCandidates: ImpactCandidate[];
  selectedCandidateId: string | null;
  onSelect: (entityId: string) => void;
}) {
  const largestColumn = Math.max(
    directCandidates.length,
    secondaryCandidates.length,
    1,
  );
  const height = Math.max(
    330,
    largestColumn * NODE_HEIGHT + (largestColumn - 1) * NODE_GAP + 96,
  );
  const originY = (height - NODE_HEIGHT) / 2;
  const directNodes = positionCandidates(directCandidates, DIRECT_X, height);
  const secondaryNodes = positionCandidates(
    secondaryCandidates,
    SECONDARY_X,
    height,
  );
  const selectedCandidate = [...directCandidates, ...secondaryCandidates].find(
    (candidate) => candidate.entity.id === selectedCandidateId,
  );
  const selectedDirectId =
    selectedCandidate?.distance === 1
      ? selectedCandidate.entity.id
      : selectedCandidate?.path[0]?.toEntityId;

  return (
    <div
      data-testid="impact-relation-graph"
      className="overflow-x-auto rounded-2xl border border-outline bg-surface-muted"
    >
      <div className="relative min-w-[48rem]" style={{ height: `${height}px` }}>
        <div className="absolute inset-x-0 top-0 z-20 grid grid-cols-3 border-b border-outline bg-surface/90 px-5 py-3 text-[0.7rem] font-bold tracking-[0.12em] text-content-tertiary uppercase backdrop-blur-sm">
          <span>変更元</span>
          <span className="pl-2">直接関係</span>
          <span className="pl-4">2段階先</span>
        </div>

        <svg
          aria-hidden="true"
          viewBox={`0 0 ${CANVAS_WIDTH} ${height}`}
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          {directNodes.map(({ candidate, x, y }) => (
            <Connector
              key={`origin-${candidate.entity.id}`}
              fromX={ORIGIN_X + NODE_WIDTH}
              fromY={originY + NODE_HEIGHT / 2}
              toX={x}
              toY={y + NODE_HEIGHT / 2}
              active={candidate.entity.id === selectedDirectId}
            />
          ))}
          {secondaryNodes.map(({ candidate, x, y }) => {
            const directId = candidate.path[0]?.toEntityId;
            const directNode = directNodes.find(
              (node) => node.candidate.entity.id === directId,
            );

            return directNode ? (
              <Connector
                key={`secondary-${candidate.entity.id}`}
                fromX={directNode.x + NODE_WIDTH}
                fromY={directNode.y + NODE_HEIGHT / 2}
                toX={x}
                toY={y + NODE_HEIGHT / 2}
                active={candidate.entity.id === selectedCandidateId}
              />
            ) : null;
          })}
        </svg>

        <div
          className="absolute z-10 rounded-xl border-2 border-content-primary bg-content-primary px-3 py-3 text-surface shadow-sm"
          style={{
            left: `${ORIGIN_X}px`,
            top: `${originY}px`,
            width: `${NODE_WIDTH}px`,
            height: `${NODE_HEIGHT}px`,
          }}
        >
          <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase opacity-70">
            変更元
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {originEntity.name}
          </p>
        </div>

        {[...directNodes, ...secondaryNodes].map(({ candidate, x, y }) => {
          const isSelected = candidate.entity.id === selectedCandidateId;

          return (
            <button
              key={candidate.entity.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${candidate.entity.name}の関係経路を表示`}
              onClick={() => onSelect(candidate.entity.id)}
              className={`absolute z-10 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                isSelected
                  ? "border-action-primary bg-action-muted"
                  : "border-outline-strong bg-surface hover:border-action-primary hover:bg-action-muted"
              }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${NODE_WIDTH}px`,
                height: `${NODE_HEIGHT}px`,
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold text-content-primary">
                  {candidate.entity.name}
                </span>
                <EntityTypeBadge
                  type={candidate.entity.type}
                  label={candidate.entity.typeLabel}
                />
              </span>
              <span className="mt-1 block text-[0.65rem] text-content-tertiary">
                {candidate.distanceLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Connector({
  fromX,
  fromY,
  toX,
  toY,
  active,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  active: boolean;
}) {
  const curve = Math.max(42, (toX - fromX) / 2);

  return (
    <path
      d={`M ${fromX} ${fromY} C ${fromX + curve} ${fromY}, ${toX - curve} ${toY}, ${toX} ${toY}`}
      fill="none"
      stroke={
        active ? "var(--color-action-primary)" : "var(--color-outline-strong)"
      }
      strokeWidth={active ? 3 : 1.5}
      strokeLinecap="round"
    />
  );
}

function positionCandidates(
  candidates: ImpactCandidate[],
  x: number,
  height: number,
): PositionedCandidate[] {
  const columnHeight =
    candidates.length * NODE_HEIGHT +
    Math.max(0, candidates.length - 1) * NODE_GAP;
  const startY = Math.max(64, (height - columnHeight) / 2);

  return candidates.map((candidate, index) => ({
    candidate,
    x,
    y: startY + index * (NODE_HEIGHT + NODE_GAP),
  }));
}
