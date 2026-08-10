import type { CaseFieldValue, WorkflowCaseStatus } from "@/types/workflow";

export const CASE_STATUS_STYLES: Record<WorkflowCaseStatus, string> = {
  DRAFT: "bg-surface-strong text-content-secondary",
  RUNNING: "bg-status-info-bg text-status-info-content",
  WAITING: "bg-status-warning-bg text-status-warning-content",
  COMPLETED: "bg-change-added-bg text-change-added-content",
  REJECTED: "bg-status-danger-bg text-status-danger-content",
  CANCELLED: "bg-surface-strong text-content-tertiary",
  FAILED: "bg-status-danger-bg text-status-danger-content",
};

export function formatWorkflowDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function formatWorkflowDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export function formatFieldValue(field: CaseFieldValue) {
  if (!field.value) {
    return "未入力";
  }

  if (field.type === "INTEGER") {
    return `${Number(field.value).toLocaleString("ja-JP")}円`;
  }

  if (field.type === "DATE") {
    return formatWorkflowDate(field.value);
  }

  return field.value;
}

export function fieldsToExpenseDefaults(fields: CaseFieldValue[]) {
  const values = new Map(fields.map((field) => [field.key, field.value]));
  return {
    expenseDate: values.get("expense_date") ?? "",
    amount: values.get("amount") ?? "",
    purpose: values.get("purpose") ?? "",
    payee: values.get("payee") ?? "",
    receiptReference: values.get("receipt_reference") ?? "",
  };
}
