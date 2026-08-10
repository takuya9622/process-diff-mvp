import { CASE_STATUS_STYLES } from "@/lib/workflow-display";
import type { WorkflowCaseStatus } from "@/types/workflow";

export function WorkflowStatusBadge({
  status,
  label,
}: {
  status: WorkflowCaseStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${CASE_STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}
