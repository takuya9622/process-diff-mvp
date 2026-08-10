"use server";

import {
  getOrganizationContext,
  hasWorkspacePermission,
} from "@/lib/server/auth/session";
import {
  cancelExpenseCase,
  completeAccountingWorkItem,
  decideApproval,
  resubmitExpenseCase,
  saveExpenseCase,
} from "@/lib/server/workflow-service";
import type {
  AccountingInput,
  ExpenseCaseInput,
  WorkflowActionResult,
} from "@/types/workflow";

export async function saveExpenseCaseAction(
  organizationSlug: string,
  workflowDefinitionId: string,
  caseId: string | undefined,
  _previousState: WorkflowActionResult | null,
  formData: FormData,
): Promise<WorkflowActionResult> {
  return executeWorkflowMutation(organizationSlug, async (context) => {
    const mode = formData.get("intent") === "draft" ? "draft" : "submit";
    const result = await saveExpenseCase(
      context.organizationId,
      context.user.id,
      workflowDefinitionId,
      parseExpenseInput(formData),
      mode,
      caseId,
    );
    return result;
  });
}

export async function decideApprovalAction(
  organizationSlug: string,
  caseId: string,
  workItemId: string,
  _previousState: WorkflowActionResult | null,
  formData: FormData,
): Promise<WorkflowActionResult> {
  return executeWorkflowMutation(organizationSlug, async (context) => {
    const decision = String(formData.get("decision") ?? "");

    if (
      decision !== "approve" &&
      decision !== "return" &&
      decision !== "reject"
    ) {
      return {
        status: "invalid",
        field: "decision",
        message: "承認、差し戻し、却下のいずれかを選択してください。",
      };
    }

    const result = await decideApproval(
      context.organizationId,
      context.user.id,
      caseId,
      workItemId,
      decision,
      String(formData.get("reason") ?? ""),
    );
    return result;
  });
}

export async function resubmitExpenseCaseAction(
  organizationSlug: string,
  caseId: string,
  workItemId: string,
  _previousState: WorkflowActionResult | null,
  formData: FormData,
): Promise<WorkflowActionResult> {
  return executeWorkflowMutation(organizationSlug, async (context) => {
    const result = await resubmitExpenseCase(
      context.organizationId,
      context.user.id,
      caseId,
      workItemId,
      parseExpenseInput(formData),
    );
    return result;
  });
}

export async function completeAccountingAction(
  organizationSlug: string,
  caseId: string,
  workItemId: string,
  _previousState: WorkflowActionResult | null,
  formData: FormData,
): Promise<WorkflowActionResult> {
  return executeWorkflowMutation(organizationSlug, async (context) => {
    const input: AccountingInput = {
      processedDate: String(formData.get("processedDate") ?? ""),
      reference: String(formData.get("reference") ?? ""),
      result: String(formData.get("result") ?? ""),
    };
    const actionResult = await completeAccountingWorkItem(
      context.organizationId,
      context.user.id,
      caseId,
      workItemId,
      input,
    );
    return actionResult;
  });
}

export async function cancelExpenseCaseAction(
  organizationSlug: string,
  caseId: string,
): Promise<WorkflowActionResult> {
  return executeWorkflowMutation(organizationSlug, async (context) => {
    const result = await cancelExpenseCase(
      context.organizationId,
      context.user.id,
      caseId,
    );
    return result;
  });
}

async function executeWorkflowMutation(
  organizationSlug: string,
  mutation: (
    context: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>,
  ) => Promise<WorkflowActionResult>,
): Promise<WorkflowActionResult> {
  try {
    const context = await getOrganizationContext(organizationSlug);

    if (!context) {
      return {
        status: "unauthorized",
        message: "ログイン状態または組織への所属を確認できませんでした。",
      };
    }

    if (!hasWorkspacePermission(context.role, "change")) {
      return {
        status: "forbidden",
        message: "閲覧者は案件を開始または更新できません。",
      };
    }

    return await mutation(context);
  } catch (error) {
    console.error("Failed to update a workflow case.", error);
    return {
      status: "error",
      message:
        "業務を更新できませんでした。入力内容を残したまま、もう一度試してください。",
    };
  }
}

function parseExpenseInput(formData: FormData): ExpenseCaseInput {
  return {
    expenseDate: String(formData.get("expenseDate") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    payee: String(formData.get("payee") ?? ""),
    receiptReference: String(formData.get("receiptReference") ?? ""),
  };
}
