import type { WorkflowStep } from "@/types/workflow";

export function WorkflowProgress({
  steps,
  currentStepKey,
  isCompleted,
}: {
  steps: WorkflowStep[];
  currentStepKey: string;
  isCompleted: boolean;
}) {
  const currentIndex = steps.findIndex((step) => step.key === currentStepKey);

  return (
    <ol aria-label="案件の進行状況" className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isCurrent = step.key === currentStepKey;
        const isComplete = isCompleted || index < currentIndex;

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className={`rounded-2xl border px-3 py-3 text-sm ${
              isCurrent
                ? "border-action-primary bg-action-muted text-action-primary"
                : isComplete
                  ? "border-change-added-outline bg-change-added-bg text-change-added-content"
                  : "border-outline bg-surface-muted text-content-tertiary"
            }`}
          >
            <span className="block text-[0.68rem] font-bold tracking-[0.08em] uppercase">
              {isComplete ? "完了" : isCurrent ? "現在" : `STEP ${index + 1}`}
            </span>
            <span className="mt-1 block font-semibold">{step.name}</span>
          </li>
        );
      })}
    </ol>
  );
}
