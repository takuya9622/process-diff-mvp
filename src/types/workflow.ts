export type WorkflowFieldType = "TEXT" | "INTEGER" | "DATE";

export type WorkflowField = {
  id: string;
  key: string;
  label: string;
  type: WorkflowFieldType;
  stepKey: string;
  required: boolean;
  position: number;
  description: string | null;
};

export type WorkflowStep = {
  id: string;
  key: string;
  name: string;
  type: "INPUT" | "TASK" | "APPROVAL" | "END";
  assignedRole: string | null;
  dueDays: number | null;
  position: number;
};

export type WorkflowCatalogItem = {
  id: string;
  versionId: string;
  versionNumber: number;
  name: string;
  description: string;
  relatedProcessEntityId: string;
  fields: WorkflowField[];
  steps: WorkflowStep[];
};

export type WorkflowCaseStatus =
  | "DRAFT"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED";

export type WorkItemStatus =
  "READY" | "IN_PROGRESS" | "COMPLETED" | "RETURNED" | "CANCELLED" | "SKIPPED";

export type CaseFieldValue = WorkflowField & { value: string };

export type CaseSummary = {
  id: string;
  caseNumber: number;
  displayNumber: string;
  workflowName: string;
  status: WorkflowCaseStatus;
  statusLabel: string;
  currentStepKey: string;
  currentStepName: string;
  nextActor: string | null;
  dueAt: string | null;
  updatedAt: string;
  initiatedByName: string;
};

export type WorkItemSummary = {
  id: string;
  caseId: string;
  caseNumber: number;
  displayNumber: string;
  workflowName: string;
  title: string;
  assignedRole: string;
  assignedUserId: string;
  status: WorkItemStatus;
  dueAt: string | null;
  isOverdue: boolean;
  initiatedByName: string;
};

export type WorkflowHomeData = {
  pendingWorkItems: WorkItemSummary[];
  recentCases: CaseSummary[];
  startableWorkflows: WorkflowCatalogItem[];
};

export type ApprovalHistoryItem = {
  id: string;
  attempt: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED";
  reason: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
};

export type WorkflowActivityItem = {
  id: string;
  actorName: string | null;
  actorRole: string | null;
  type: string;
  summary: string;
  detail: string | null;
  createdAt: string;
};

export type CaseDetail = CaseSummary & {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersionNumber: number;
  relatedProcessEntityId: string;
  fields: CaseFieldValue[];
  steps: WorkflowStep[];
  activeWorkItem: WorkItemSummary | null;
  approvals: ApprovalHistoryItem[];
  activities: WorkflowActivityItem[];
  completedAt: string | null;
  createdAt: string;
  initiatedByUserId: string;
};

export type WorkItemDetail = {
  item: WorkItemSummary & {
    stepKey: string;
    stepType: WorkflowStep["type"];
  };
  caseDetail: CaseDetail;
};

export type ExpenseCaseInput = {
  expenseDate: string;
  amount: string;
  purpose: string;
  payee: string;
  receiptReference: string;
};

export type AccountingInput = {
  processedDate: string;
  reference: string;
  result: string;
};

export type WorkflowActionResult =
  | { status: "success"; caseId: string; workItemId?: string }
  | { status: "invalid"; message: string; field?: string }
  | { status: "conflict"; message: string }
  | { status: "not-found"; message: string }
  | { status: "unauthorized" | "forbidden"; message: string }
  | { status: "error"; message: string };
