import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, inArray, max, sql } from "drizzle-orm";

import { isUuid } from "@/lib/domain/identifier";
import {
  validateAccountingInput,
  validateExpenseCaseInput,
} from "@/lib/domain/workflow-validation";
import { users } from "@/lib/server/database/auth-schema.generated";
import { database } from "@/lib/server/database/client";
import { ensureDemoWorkflowState } from "@/lib/server/database/demo-state";
import {
  approvals,
  caseFieldValues,
  workflowActivities,
  workflowCases,
  workflowDefinitions,
  workflowFieldDefinitions,
  workflowStepDefinitions,
  workflowVersions,
  workItems,
} from "@/lib/server/database/schema";
import {
  EXPENSE_ACCOUNTING_STEP_KEY,
  EXPENSE_APPROVAL_STEP_KEY,
  EXPENSE_REQUEST_STEP_KEY,
} from "@/lib/server/database/workflow-seed-data";
import type {
  AccountingInput,
  ApprovalHistoryItem,
  CaseDetail,
  CaseFieldValue,
  CaseSummary,
  ExpenseCaseInput,
  WorkflowActionResult,
  WorkflowActivityItem,
  WorkflowCatalogItem,
  WorkflowField,
  WorkflowHomeData,
  WorkflowStep,
  WorkItemDetail,
  WorkItemSummary,
} from "@/types/workflow";

type DatabaseTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0];

type SaveCaseMode = "draft" | "submit";
type ApprovalDecision = "approve" | "return" | "reject";

const CASE_STATUS_LABELS = {
  DRAFT: "下書き",
  RUNNING: "対応中",
  WAITING: "待機中",
  COMPLETED: "完了",
  REJECTED: "却下",
  CANCELLED: "取消",
  FAILED: "処理失敗",
} as const;

export async function getWorkflowCatalog(
  organizationId: string,
): Promise<WorkflowCatalogItem[]> {
  await ensureDemoWorkflowState(organizationId);
  const definitions = await database
    .select({
      id: workflowDefinitions.id,
      name: workflowDefinitions.name,
      description: workflowDefinitions.description,
      relatedProcessEntityId: workflowDefinitions.relatedProcessEntityId,
      versionId: workflowVersions.id,
      versionNumber: workflowVersions.versionNumber,
    })
    .from(workflowDefinitions)
    .innerJoin(
      workflowVersions,
      and(
        eq(workflowVersions.organizationId, workflowDefinitions.organizationId),
        eq(workflowVersions.workflowDefinitionId, workflowDefinitions.id),
      ),
    )
    .where(
      and(
        eq(workflowDefinitions.organizationId, organizationId),
        eq(workflowVersions.status, "PUBLISHED"),
      ),
    )
    .orderBy(asc(workflowDefinitions.name));

  if (definitions.length === 0) {
    return [];
  }

  const versionIds = definitions.map((definition) => definition.versionId);
  const [fieldRows, stepRows] = await Promise.all([
    database
      .select()
      .from(workflowFieldDefinitions)
      .where(
        and(
          eq(workflowFieldDefinitions.organizationId, organizationId),
          inArray(workflowFieldDefinitions.workflowVersionId, versionIds),
        ),
      )
      .orderBy(asc(workflowFieldDefinitions.position)),
    database
      .select()
      .from(workflowStepDefinitions)
      .where(
        and(
          eq(workflowStepDefinitions.organizationId, organizationId),
          inArray(workflowStepDefinitions.workflowVersionId, versionIds),
        ),
      )
      .orderBy(asc(workflowStepDefinitions.position)),
  ]);

  return definitions.map((definition) => ({
    ...definition,
    fields: fieldRows
      .filter((field) => field.workflowVersionId === definition.versionId)
      .map(mapWorkflowField),
    steps: stepRows
      .filter((step) => step.workflowVersionId === definition.versionId)
      .map(mapWorkflowStep),
  }));
}

export async function getWorkflowStartData(
  organizationId: string,
  workflowDefinitionId: string,
) {
  if (!isUuid(workflowDefinitionId)) {
    return null;
  }

  return (
    (await getWorkflowCatalog(organizationId)).find(
      (workflow) => workflow.id === workflowDefinitionId,
    ) ?? null
  );
}

export async function getWorkflowHomeData(
  organizationId: string,
  userId: string,
): Promise<WorkflowHomeData> {
  const startableWorkflows = await getWorkflowCatalog(organizationId);
  const [pendingWorkItems, recentCases] = await Promise.all([
    getPendingWorkItems(organizationId, userId),
    getCaseList(organizationId, userId, { limit: 5 }),
  ]);

  return { pendingWorkItems, recentCases, startableWorkflows };
}

export async function getCaseList(
  organizationId: string,
  userId: string,
  options: { limit?: number; includeOrganizationCases?: boolean } = {},
): Promise<CaseSummary[]> {
  await ensureDemoWorkflowState(organizationId);
  const rows = await database
    .select({
      caseRow: workflowCases,
      workflowName: workflowDefinitions.name,
      initiatedByName: users.name,
      stepName: workflowStepDefinitions.name,
    })
    .from(workflowCases)
    .innerJoin(
      workflowVersions,
      and(
        eq(workflowVersions.organizationId, workflowCases.organizationId),
        eq(workflowVersions.id, workflowCases.workflowVersionId),
      ),
    )
    .innerJoin(
      workflowDefinitions,
      and(
        eq(workflowDefinitions.organizationId, workflowVersions.organizationId),
        eq(workflowDefinitions.id, workflowVersions.workflowDefinitionId),
      ),
    )
    .innerJoin(users, eq(users.id, workflowCases.initiatedByUserId))
    .innerJoin(
      workflowStepDefinitions,
      and(
        eq(
          workflowStepDefinitions.organizationId,
          workflowCases.organizationId,
        ),
        eq(
          workflowStepDefinitions.workflowVersionId,
          workflowCases.workflowVersionId,
        ),
        eq(workflowStepDefinitions.stepKey, workflowCases.currentStepKey),
      ),
    )
    .where(
      options.includeOrganizationCases
        ? eq(workflowCases.organizationId, organizationId)
        : and(
            eq(workflowCases.organizationId, organizationId),
            eq(workflowCases.initiatedByUserId, userId),
          ),
    )
    .orderBy(desc(workflowCases.updatedAt))
    .limit(options.limit ?? 100);

  if (rows.length === 0) {
    return [];
  }

  const activeItems = await database
    .select()
    .from(workItems)
    .where(
      and(
        eq(workItems.organizationId, organizationId),
        inArray(
          workItems.caseId,
          rows.map(({ caseRow }) => caseRow.id),
        ),
        inArray(workItems.status, ["READY", "IN_PROGRESS"]),
      ),
    );
  const activeItemsByCaseId = new Map(
    activeItems.map((item) => [item.caseId, item]),
  );

  return rows.map((row) =>
    mapCaseSummary(row, activeItemsByCaseId.get(row.caseRow.id) ?? null),
  );
}

export async function getCaseDetail(
  organizationId: string,
  caseId: string,
): Promise<CaseDetail | null> {
  if (!isUuid(caseId)) {
    return null;
  }

  const [row] = await database
    .select({
      caseRow: workflowCases,
      workflowName: workflowDefinitions.name,
      workflowDefinitionId: workflowDefinitions.id,
      relatedProcessEntityId: workflowDefinitions.relatedProcessEntityId,
      workflowVersionNumber: workflowVersions.versionNumber,
      initiatedByName: users.name,
    })
    .from(workflowCases)
    .innerJoin(
      workflowVersions,
      and(
        eq(workflowVersions.organizationId, workflowCases.organizationId),
        eq(workflowVersions.id, workflowCases.workflowVersionId),
      ),
    )
    .innerJoin(
      workflowDefinitions,
      and(
        eq(workflowDefinitions.organizationId, workflowVersions.organizationId),
        eq(workflowDefinitions.id, workflowVersions.workflowDefinitionId),
      ),
    )
    .innerJoin(users, eq(users.id, workflowCases.initiatedByUserId))
    .where(
      and(
        eq(workflowCases.organizationId, organizationId),
        eq(workflowCases.id, caseId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [fieldRows, stepRows, activeItemRows, approvalRows, activityRows] =
    await Promise.all([
      database
        .select({
          field: workflowFieldDefinitions,
          value: caseFieldValues.value,
        })
        .from(workflowFieldDefinitions)
        .leftJoin(
          caseFieldValues,
          and(
            eq(
              caseFieldValues.organizationId,
              workflowFieldDefinitions.organizationId,
            ),
            eq(caseFieldValues.fieldDefinitionId, workflowFieldDefinitions.id),
            eq(caseFieldValues.caseId, caseId),
          ),
        )
        .where(
          and(
            eq(workflowFieldDefinitions.organizationId, organizationId),
            eq(
              workflowFieldDefinitions.workflowVersionId,
              row.caseRow.workflowVersionId,
            ),
          ),
        )
        .orderBy(asc(workflowFieldDefinitions.position)),
      database
        .select()
        .from(workflowStepDefinitions)
        .where(
          and(
            eq(workflowStepDefinitions.organizationId, organizationId),
            eq(
              workflowStepDefinitions.workflowVersionId,
              row.caseRow.workflowVersionId,
            ),
          ),
        )
        .orderBy(asc(workflowStepDefinitions.position)),
      database
        .select()
        .from(workItems)
        .where(
          and(
            eq(workItems.organizationId, organizationId),
            eq(workItems.caseId, caseId),
            inArray(workItems.status, ["READY", "IN_PROGRESS"]),
          ),
        )
        .orderBy(desc(workItems.createdAt))
        .limit(1),
      database
        .select({ approval: approvals, decidedByName: users.name })
        .from(approvals)
        .leftJoin(users, eq(users.id, approvals.decidedByUserId))
        .where(
          and(
            eq(approvals.organizationId, organizationId),
            eq(approvals.caseId, caseId),
          ),
        )
        .orderBy(asc(approvals.attempt)),
      database
        .select({ activity: workflowActivities, actorName: users.name })
        .from(workflowActivities)
        .leftJoin(users, eq(users.id, workflowActivities.actorUserId))
        .where(
          and(
            eq(workflowActivities.organizationId, organizationId),
            eq(workflowActivities.caseId, caseId),
          ),
        )
        .orderBy(desc(workflowActivities.createdAt)),
    ]);

  const steps = stepRows.map(mapWorkflowStep);
  const currentStep = steps.find(
    (step) => step.key === row.caseRow.currentStepKey,
  );

  if (!currentStep) {
    throw new Error(`Current step ${row.caseRow.currentStepKey} is missing.`);
  }

  const activeItem = activeItemRows[0] ?? null;
  const summary = mapCaseSummary(
    {
      caseRow: row.caseRow,
      workflowName: row.workflowName,
      initiatedByName: row.initiatedByName,
      stepName: currentStep.name,
    },
    activeItem,
  );

  return {
    ...summary,
    workflowVersionId: row.caseRow.workflowVersionId,
    workflowDefinitionId: row.workflowDefinitionId,
    workflowVersionNumber: row.workflowVersionNumber,
    relatedProcessEntityId: row.relatedProcessEntityId,
    fields: fieldRows.map(({ field, value }): CaseFieldValue => ({
      ...mapWorkflowField(field),
      value: value ?? "",
    })),
    steps,
    activeWorkItem: activeItem
      ? mapWorkItemSummary({
          item: activeItem,
          caseRow: row.caseRow,
          workflowName: row.workflowName,
          initiatedByName: row.initiatedByName,
        })
      : null,
    approvals: approvalRows.map(
      ({ approval, decidedByName }): ApprovalHistoryItem => ({
        id: approval.id,
        attempt: approval.attempt,
        status: approval.status as ApprovalHistoryItem["status"],
        reason: approval.reason,
        decidedByName,
        decidedAt: approval.decidedAt?.toISOString() ?? null,
      }),
    ),
    activities: activityRows.map(
      ({ activity, actorName }): WorkflowActivityItem => ({
        id: activity.id,
        actorName,
        actorRole: activity.actorRole,
        type: activity.activityType,
        summary: activity.summary,
        detail: activity.detail,
        createdAt: activity.createdAt.toISOString(),
      }),
    ),
    completedAt: row.caseRow.completedAt?.toISOString() ?? null,
    createdAt: row.caseRow.createdAt.toISOString(),
    initiatedByUserId: row.caseRow.initiatedByUserId,
  };
}

export async function getWorkItemDetail(
  organizationId: string,
  caseId: string,
  workItemId: string,
): Promise<WorkItemDetail | null> {
  if (!isUuid(workItemId)) {
    return null;
  }

  const caseDetail = await getCaseDetail(organizationId, caseId);

  if (!caseDetail) {
    return null;
  }

  const [row] = await database
    .select({ item: workItems, step: workflowStepDefinitions })
    .from(workItems)
    .innerJoin(
      workflowStepDefinitions,
      and(
        eq(workflowStepDefinitions.organizationId, workItems.organizationId),
        eq(workflowStepDefinitions.id, workItems.stepDefinitionId),
      ),
    )
    .where(
      and(
        eq(workItems.organizationId, organizationId),
        eq(workItems.caseId, caseId),
        eq(workItems.id, workItemId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    item: {
      ...mapWorkItemSummary({
        item: row.item,
        caseRow: {
          id: caseDetail.id,
          caseNumber: caseDetail.caseNumber,
        },
        workflowName: caseDetail.workflowName,
        initiatedByName: caseDetail.initiatedByName,
      }),
      stepKey: row.step.stepKey,
      stepType: row.step.stepType as WorkflowStep["type"],
    },
    caseDetail,
  };
}

export async function saveExpenseCase(
  organizationId: string,
  userId: string,
  workflowDefinitionId: string,
  input: ExpenseCaseInput,
  mode: SaveCaseMode,
  caseId?: string,
): Promise<WorkflowActionResult> {
  const validation = validateExpenseCaseInput(input);

  if (validation) {
    return validation;
  }

  if (!isUuid(workflowDefinitionId) || (caseId && !isUuid(caseId))) {
    return { status: "not-found", message: "対象の業務が見つかりません。" };
  }

  await ensureDemoWorkflowState(organizationId);

  return database.transaction(async (transaction) => {
    await lockWorkflowState(transaction, organizationId);
    const workflow = await loadPublishedWorkflowForUpdate(
      transaction,
      organizationId,
      workflowDefinitionId,
    );

    if (!workflow) {
      return {
        status: "not-found",
        message: "開始できる業務versionが見つかりません。",
      };
    }

    const now = new Date();
    let savedCaseId = caseId;

    if (savedCaseId) {
      const [existingCase] = await transaction
        .select()
        .from(workflowCases)
        .where(
          and(
            eq(workflowCases.organizationId, organizationId),
            eq(workflowCases.id, savedCaseId),
            eq(workflowCases.initiatedByUserId, userId),
          ),
        )
        .limit(1);

      if (!existingCase) {
        return { status: "not-found", message: "下書きが見つかりません。" };
      }

      if (existingCase.status !== "DRAFT") {
        return {
          status: "conflict",
          message: "この案件はすでに申請済みです。最新状態を確認してください。",
        };
      }
    } else {
      const [{ maximumCaseNumber }] = await transaction
        .select({ maximumCaseNumber: max(workflowCases.caseNumber) })
        .from(workflowCases)
        .where(eq(workflowCases.organizationId, organizationId));
      savedCaseId = randomUUID();
      await transaction.insert(workflowCases).values({
        id: savedCaseId,
        organizationId,
        workflowVersionId: workflow.versionId,
        caseNumber: (maximumCaseNumber ?? 0) + 1,
        status: "DRAFT",
        currentStepKey: EXPENSE_REQUEST_STEP_KEY,
        initiatedByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await saveFieldValues(
      transaction,
      organizationId,
      savedCaseId,
      userId,
      workflow.fields,
      expenseInputToValues(input),
      now,
    );

    if (mode === "submit") {
      const workItemId = await createApprovalWorkItem(
        transaction,
        organizationId,
        savedCaseId,
        userId,
        workflow.steps,
        1,
        now,
      );
      await transaction
        .update(workflowCases)
        .set({
          status: "RUNNING",
          currentStepKey: EXPENSE_APPROVAL_STEP_KEY,
          updatedAt: now,
        })
        .where(
          and(
            eq(workflowCases.organizationId, organizationId),
            eq(workflowCases.id, savedCaseId),
          ),
        );
      await insertActivity(transaction, {
        organizationId,
        caseId: savedCaseId,
        actorUserId: userId,
        actorRole: "申請者",
        activityType: "SUBMITTED",
        summary: "経費申請を提出しました",
        detail: "承認者へ申請内容を割り当てました。",
        createdAt: now,
      });
      return { status: "success", caseId: savedCaseId, workItemId };
    }

    await transaction
      .update(workflowCases)
      .set({ updatedAt: now })
      .where(
        and(
          eq(workflowCases.organizationId, organizationId),
          eq(workflowCases.id, savedCaseId),
        ),
      );
    await insertActivity(transaction, {
      organizationId,
      caseId: savedCaseId,
      actorUserId: userId,
      actorRole: "申請者",
      activityType: "DRAFT_SAVED",
      summary: "下書きを保存しました",
      detail: null,
      createdAt: now,
    });
    return { status: "success", caseId: savedCaseId };
  });
}

export async function decideApproval(
  organizationId: string,
  userId: string,
  caseId: string,
  workItemId: string,
  decision: ApprovalDecision,
  reason: string,
): Promise<WorkflowActionResult> {
  const normalizedReason = reason.trim();

  if (
    (decision === "return" || decision === "reject") &&
    normalizedReason.length === 0
  ) {
    return {
      status: "invalid",
      field: "reason",
      message: "差し戻しまたは却下の理由を入力してください。",
    };
  }

  if (normalizedReason.length > 500) {
    return {
      status: "invalid",
      field: "reason",
      message: "判断理由は500文字以内で入力してください。",
    };
  }

  return database.transaction(async (transaction) => {
    await lockCaseState(transaction, caseId);
    const context = await loadActionContext(
      transaction,
      organizationId,
      caseId,
      workItemId,
      userId,
    );

    if (!context) {
      return {
        status: "not-found",
        message: "操作できる承認作業が見つかりません。",
      };
    }

    if (
      context.item.status !== "READY" ||
      context.step.stepType !== "APPROVAL" ||
      context.caseRow.status !== "RUNNING"
    ) {
      return {
        status: "conflict",
        message:
          "この承認はすでに処理されています。最新状態を確認してください。",
      };
    }

    const now = new Date();
    const approvalStatus =
      decision === "approve"
        ? "APPROVED"
        : decision === "return"
          ? "RETURNED"
          : "REJECTED";
    await transaction
      .update(approvals)
      .set({
        status: approvalStatus,
        decidedByUserId: userId,
        reason: normalizedReason || null,
        decidedAt: now,
      })
      .where(
        and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.workItemId, workItemId),
          eq(approvals.status, "PENDING"),
        ),
      );
    await transaction
      .update(workItems)
      .set({
        status: decision === "return" ? "RETURNED" : "COMPLETED",
        completedAt: now,
      })
      .where(
        and(
          eq(workItems.organizationId, organizationId),
          eq(workItems.id, workItemId),
        ),
      );

    if (decision === "approve") {
      const accountingStep = requireStep(
        context.steps,
        EXPENSE_ACCOUNTING_STEP_KEY,
      );
      const nextWorkItemId = randomUUID();
      await transaction.insert(workItems).values({
        id: nextWorkItemId,
        organizationId,
        caseId,
        stepDefinitionId: accountingStep.id,
        title: accountingStep.name,
        assignedUserId: userId,
        assignedRole: accountingStep.assignedRole ?? "経理担当",
        status: "READY",
        dueAt: calculateDueAt(now, accountingStep.dueDays),
        createdAt: now,
      });
      await updateCaseStep(
        transaction,
        organizationId,
        caseId,
        "RUNNING",
        EXPENSE_ACCOUNTING_STEP_KEY,
        now,
      );
      await insertActivity(transaction, {
        organizationId,
        caseId,
        actorUserId: userId,
        actorRole: "承認者",
        activityType: "APPROVED",
        summary: "経費申請を承認しました",
        detail: normalizedReason || null,
        createdAt: now,
      });
      return { status: "success", caseId, workItemId: nextWorkItemId };
    }

    if (decision === "return") {
      const requestStep = requireStep(context.steps, EXPENSE_REQUEST_STEP_KEY);
      const nextWorkItemId = randomUUID();
      await transaction.insert(workItems).values({
        id: nextWorkItemId,
        organizationId,
        caseId,
        stepDefinitionId: requestStep.id,
        title: "申請内容の修正・再申請",
        assignedUserId: context.caseRow.initiatedByUserId,
        assignedRole: requestStep.assignedRole ?? "申請者",
        status: "READY",
        dueAt: null,
        createdAt: now,
      });
      await updateCaseStep(
        transaction,
        organizationId,
        caseId,
        "RUNNING",
        EXPENSE_REQUEST_STEP_KEY,
        now,
      );
      await insertActivity(transaction, {
        organizationId,
        caseId,
        actorUserId: userId,
        actorRole: "承認者",
        activityType: "RETURNED",
        summary: "申請内容を差し戻しました",
        detail: normalizedReason,
        createdAt: now,
      });
      return { status: "success", caseId, workItemId: nextWorkItemId };
    }

    await updateCaseStep(
      transaction,
      organizationId,
      caseId,
      "REJECTED",
      context.step.stepKey,
      now,
      now,
    );
    await insertActivity(transaction, {
      organizationId,
      caseId,
      actorUserId: userId,
      actorRole: "承認者",
      activityType: "REJECTED",
      summary: "経費申請を却下しました",
      detail: normalizedReason,
      createdAt: now,
    });
    return { status: "success", caseId };
  });
}

export async function resubmitExpenseCase(
  organizationId: string,
  userId: string,
  caseId: string,
  workItemId: string,
  input: ExpenseCaseInput,
): Promise<WorkflowActionResult> {
  const validation = validateExpenseCaseInput(input);

  if (validation) {
    return validation;
  }

  return database.transaction(async (transaction) => {
    await lockCaseState(transaction, caseId);
    const context = await loadActionContext(
      transaction,
      organizationId,
      caseId,
      workItemId,
      userId,
    );

    if (
      !context ||
      context.item.status !== "READY" ||
      context.step.stepType !== "INPUT" ||
      context.caseRow.currentStepKey !== EXPENSE_REQUEST_STEP_KEY
    ) {
      return {
        status: "conflict",
        message: "この再申請作業はすでに処理されています。",
      };
    }

    const now = new Date();
    const fields = await transaction
      .select()
      .from(workflowFieldDefinitions)
      .where(
        and(
          eq(workflowFieldDefinitions.organizationId, organizationId),
          eq(
            workflowFieldDefinitions.workflowVersionId,
            context.caseRow.workflowVersionId,
          ),
        ),
      );
    await saveFieldValues(
      transaction,
      organizationId,
      caseId,
      userId,
      fields.map(mapWorkflowField),
      expenseInputToValues(input),
      now,
    );
    await transaction
      .update(workItems)
      .set({ status: "COMPLETED", completedAt: now })
      .where(
        and(
          eq(workItems.organizationId, organizationId),
          eq(workItems.id, workItemId),
        ),
      );
    const [{ attemptCount }] = await transaction
      .select({ attemptCount: sql<number>`count(*)::int` })
      .from(approvals)
      .where(
        and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.caseId, caseId),
        ),
      );
    const nextWorkItemId = await createApprovalWorkItem(
      transaction,
      organizationId,
      caseId,
      userId,
      context.steps,
      attemptCount + 1,
      now,
    );
    await updateCaseStep(
      transaction,
      organizationId,
      caseId,
      "RUNNING",
      EXPENSE_APPROVAL_STEP_KEY,
      now,
    );
    await insertActivity(transaction, {
      organizationId,
      caseId,
      actorUserId: userId,
      actorRole: "申請者",
      activityType: "RESUBMITTED",
      summary: "申請内容を修正して再申請しました",
      detail: null,
      createdAt: now,
    });
    return { status: "success", caseId, workItemId: nextWorkItemId };
  });
}

export async function completeAccountingWorkItem(
  organizationId: string,
  userId: string,
  caseId: string,
  workItemId: string,
  input: AccountingInput,
): Promise<WorkflowActionResult> {
  const validation = validateAccountingInput(input);

  if (validation) {
    return validation;
  }

  return database.transaction(async (transaction) => {
    await lockCaseState(transaction, caseId);
    const context = await loadActionContext(
      transaction,
      organizationId,
      caseId,
      workItemId,
      userId,
    );

    if (
      !context ||
      context.item.status !== "READY" ||
      context.step.stepKey !== EXPENSE_ACCOUNTING_STEP_KEY ||
      context.caseRow.status !== "RUNNING"
    ) {
      return {
        status: "conflict",
        message: "この経理作業はすでに処理されています。",
      };
    }

    const now = new Date();
    const fields = await transaction
      .select()
      .from(workflowFieldDefinitions)
      .where(
        and(
          eq(workflowFieldDefinitions.organizationId, organizationId),
          eq(
            workflowFieldDefinitions.workflowVersionId,
            context.caseRow.workflowVersionId,
          ),
        ),
      );
    await saveFieldValues(
      transaction,
      organizationId,
      caseId,
      userId,
      fields.map(mapWorkflowField),
      {
        accounting_processed_date: input.processedDate,
        accounting_reference: input.reference.trim(),
        accounting_result: input.result.trim(),
      },
      now,
    );
    await transaction
      .update(workItems)
      .set({ status: "COMPLETED", completedAt: now })
      .where(
        and(
          eq(workItems.organizationId, organizationId),
          eq(workItems.id, workItemId),
        ),
      );
    await updateCaseStep(
      transaction,
      organizationId,
      caseId,
      "COMPLETED",
      "complete",
      now,
      now,
    );
    await insertActivity(transaction, {
      organizationId,
      caseId,
      actorUserId: userId,
      actorRole: "経理担当",
      activityType: "COMPLETED",
      summary: "経理処理を完了しました",
      detail: `${input.reference.trim()} · ${input.result.trim()}`,
      createdAt: now,
    });
    return { status: "success", caseId };
  });
}

export async function cancelExpenseCase(
  organizationId: string,
  userId: string,
  caseId: string,
): Promise<WorkflowActionResult> {
  if (!isUuid(caseId)) {
    return { status: "not-found", message: "案件が見つかりません。" };
  }

  return database.transaction(async (transaction) => {
    await lockCaseState(transaction, caseId);
    const [caseRow] = await transaction
      .select()
      .from(workflowCases)
      .where(
        and(
          eq(workflowCases.organizationId, organizationId),
          eq(workflowCases.id, caseId),
          eq(workflowCases.initiatedByUserId, userId),
        ),
      )
      .limit(1);

    if (!caseRow) {
      return { status: "not-found", message: "案件が見つかりません。" };
    }

    if (
      caseRow.status !== "DRAFT" &&
      !(
        caseRow.status === "RUNNING" &&
        caseRow.currentStepKey === EXPENSE_APPROVAL_STEP_KEY
      )
    ) {
      return {
        status: "conflict",
        message: "この状態の案件は取り下げできません。",
      };
    }

    const now = new Date();
    await transaction
      .update(workItems)
      .set({ status: "CANCELLED", completedAt: now })
      .where(
        and(
          eq(workItems.organizationId, organizationId),
          eq(workItems.caseId, caseId),
          inArray(workItems.status, ["READY", "IN_PROGRESS"]),
        ),
      );
    await transaction
      .update(approvals)
      .set({ status: "CANCELLED", decidedAt: now })
      .where(
        and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.caseId, caseId),
          eq(approvals.status, "PENDING"),
        ),
      );
    await updateCaseStep(
      transaction,
      organizationId,
      caseId,
      "CANCELLED",
      caseRow.currentStepKey,
      now,
      now,
    );
    await insertActivity(transaction, {
      organizationId,
      caseId,
      actorUserId: userId,
      actorRole: "申請者",
      activityType: "CANCELLED",
      summary: "経費申請を取り下げました",
      detail: null,
      createdAt: now,
    });
    return { status: "success", caseId };
  });
}

async function getPendingWorkItems(
  organizationId: string,
  userId: string,
): Promise<WorkItemSummary[]> {
  const rows = await database
    .select({
      item: workItems,
      caseRow: workflowCases,
      workflowName: workflowDefinitions.name,
      initiatedByName: users.name,
    })
    .from(workItems)
    .innerJoin(
      workflowCases,
      and(
        eq(workflowCases.organizationId, workItems.organizationId),
        eq(workflowCases.id, workItems.caseId),
      ),
    )
    .innerJoin(
      workflowVersions,
      and(
        eq(workflowVersions.organizationId, workflowCases.organizationId),
        eq(workflowVersions.id, workflowCases.workflowVersionId),
      ),
    )
    .innerJoin(
      workflowDefinitions,
      and(
        eq(workflowDefinitions.organizationId, workflowVersions.organizationId),
        eq(workflowDefinitions.id, workflowVersions.workflowDefinitionId),
      ),
    )
    .innerJoin(users, eq(users.id, workflowCases.initiatedByUserId))
    .where(
      and(
        eq(workItems.organizationId, organizationId),
        eq(workItems.assignedUserId, userId),
        inArray(workItems.status, ["READY", "IN_PROGRESS"]),
      ),
    )
    .orderBy(asc(workItems.dueAt), asc(workItems.createdAt));

  return rows.map(mapWorkItemSummary);
}

function mapCaseSummary(
  row: {
    caseRow:
      typeof workflowCases.$inferSelect | { id: string; caseNumber: number };
    workflowName: string;
    initiatedByName: string;
    stepName: string;
  },
  activeItem: typeof workItems.$inferSelect | null,
): CaseSummary {
  if (!("status" in row.caseRow)) {
    throw new Error("A complete case row is required.");
  }

  return {
    id: row.caseRow.id,
    caseNumber: row.caseRow.caseNumber,
    displayNumber: formatCaseNumber(row.caseRow.caseNumber),
    workflowName: row.workflowName,
    status: row.caseRow.status as CaseSummary["status"],
    statusLabel:
      CASE_STATUS_LABELS[
        row.caseRow.status as keyof typeof CASE_STATUS_LABELS
      ] ?? row.caseRow.status,
    currentStepKey: row.caseRow.currentStepKey,
    currentStepName: row.stepName,
    nextActor: activeItem?.assignedRole ?? null,
    dueAt: activeItem?.dueAt?.toISOString() ?? null,
    updatedAt: row.caseRow.updatedAt.toISOString(),
    initiatedByName: row.initiatedByName,
  };
}

function mapWorkItemSummary(row: {
  item: typeof workItems.$inferSelect;
  caseRow:
    typeof workflowCases.$inferSelect | { id: string; caseNumber: number };
  workflowName: string;
  initiatedByName: string;
}): WorkItemSummary {
  return {
    id: row.item.id,
    caseId: row.caseRow.id,
    caseNumber: row.caseRow.caseNumber,
    displayNumber: formatCaseNumber(row.caseRow.caseNumber),
    workflowName: row.workflowName,
    title: row.item.title,
    assignedRole: row.item.assignedRole,
    assignedUserId: row.item.assignedUserId,
    status: row.item.status as WorkItemSummary["status"],
    dueAt: row.item.dueAt?.toISOString() ?? null,
    isOverdue: row.item.dueAt ? row.item.dueAt.getTime() < Date.now() : false,
    initiatedByName: row.initiatedByName,
  };
}

function mapWorkflowField(
  field: typeof workflowFieldDefinitions.$inferSelect,
): WorkflowField {
  return {
    id: field.id,
    key: field.fieldKey,
    label: field.label,
    type: field.fieldType as WorkflowField["type"],
    stepKey: field.stepKey,
    required: field.isRequired,
    position: field.position,
    description: field.description,
  };
}

function mapWorkflowStep(
  step: typeof workflowStepDefinitions.$inferSelect,
): WorkflowStep {
  return {
    id: step.id,
    key: step.stepKey,
    name: step.name,
    type: step.stepType as WorkflowStep["type"],
    assignedRole: step.assignedRole,
    dueDays: step.dueDays,
    position: step.position,
  };
}

async function loadPublishedWorkflowForUpdate(
  transaction: DatabaseTransaction,
  organizationId: string,
  workflowDefinitionId: string,
) {
  const [definition] = await transaction
    .select({
      versionId: workflowVersions.id,
      workflowDefinitionId: workflowDefinitions.id,
    })
    .from(workflowDefinitions)
    .innerJoin(
      workflowVersions,
      and(
        eq(workflowVersions.organizationId, workflowDefinitions.organizationId),
        eq(workflowVersions.workflowDefinitionId, workflowDefinitions.id),
      ),
    )
    .where(
      and(
        eq(workflowDefinitions.organizationId, organizationId),
        eq(workflowDefinitions.id, workflowDefinitionId),
        eq(workflowVersions.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  if (!definition) {
    return null;
  }

  const [fields, steps] = await Promise.all([
    transaction
      .select()
      .from(workflowFieldDefinitions)
      .where(
        and(
          eq(workflowFieldDefinitions.organizationId, organizationId),
          eq(workflowFieldDefinitions.workflowVersionId, definition.versionId),
        ),
      ),
    transaction
      .select()
      .from(workflowStepDefinitions)
      .where(
        and(
          eq(workflowStepDefinitions.organizationId, organizationId),
          eq(workflowStepDefinitions.workflowVersionId, definition.versionId),
        ),
      ),
  ]);

  return {
    ...definition,
    fields: fields.map(mapWorkflowField),
    steps: steps.map(mapWorkflowStep),
  };
}

async function loadActionContext(
  transaction: DatabaseTransaction,
  organizationId: string,
  caseId: string,
  workItemId: string,
  userId: string,
) {
  if (!isUuid(caseId) || !isUuid(workItemId)) {
    return null;
  }

  const [row] = await transaction
    .select({
      item: workItems,
      caseRow: workflowCases,
      step: workflowStepDefinitions,
    })
    .from(workItems)
    .innerJoin(
      workflowCases,
      and(
        eq(workflowCases.organizationId, workItems.organizationId),
        eq(workflowCases.id, workItems.caseId),
      ),
    )
    .innerJoin(
      workflowStepDefinitions,
      and(
        eq(workflowStepDefinitions.organizationId, workItems.organizationId),
        eq(workflowStepDefinitions.id, workItems.stepDefinitionId),
      ),
    )
    .where(
      and(
        eq(workItems.organizationId, organizationId),
        eq(workItems.caseId, caseId),
        eq(workItems.id, workItemId),
        eq(workItems.assignedUserId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const steps = await transaction
    .select()
    .from(workflowStepDefinitions)
    .where(
      and(
        eq(workflowStepDefinitions.organizationId, organizationId),
        eq(
          workflowStepDefinitions.workflowVersionId,
          row.caseRow.workflowVersionId,
        ),
      ),
    );

  return { ...row, steps: steps.map(mapWorkflowStep) };
}

async function createApprovalWorkItem(
  transaction: DatabaseTransaction,
  organizationId: string,
  caseId: string,
  assignedUserId: string,
  steps: WorkflowStep[],
  attempt: number,
  now: Date,
) {
  const approvalStep = requireStep(steps, EXPENSE_APPROVAL_STEP_KEY);
  const workItemId = randomUUID();
  await transaction.insert(workItems).values({
    id: workItemId,
    organizationId,
    caseId,
    stepDefinitionId: approvalStep.id,
    title: approvalStep.name,
    assignedUserId,
    assignedRole: approvalStep.assignedRole ?? "承認者",
    status: "READY",
    dueAt: calculateDueAt(now, approvalStep.dueDays),
    createdAt: now,
  });
  await transaction.insert(approvals).values({
    id: randomUUID(),
    organizationId,
    caseId,
    workItemId,
    attempt,
    status: "PENDING",
    createdAt: now,
  });
  return workItemId;
}

async function saveFieldValues(
  transaction: DatabaseTransaction,
  organizationId: string,
  caseId: string,
  userId: string,
  fields: WorkflowField[],
  values: Record<string, string>,
  now: Date,
) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));

  for (const [key, value] of Object.entries(values)) {
    const field = fieldsByKey.get(key);
    if (!field) {
      throw new Error(`Workflow field ${key} is not defined.`);
    }

    await transaction
      .insert(caseFieldValues)
      .values({
        id: randomUUID(),
        organizationId,
        caseId,
        fieldDefinitionId: field.id,
        value,
        updatedByUserId: userId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          caseFieldValues.organizationId,
          caseFieldValues.caseId,
          caseFieldValues.fieldDefinitionId,
        ],
        set: { value, updatedByUserId: userId, updatedAt: now },
      });
  }
}

async function updateCaseStep(
  transaction: DatabaseTransaction,
  organizationId: string,
  caseId: string,
  status: typeof workflowCases.$inferInsert.status,
  currentStepKey: string,
  updatedAt: Date,
  completedAt?: Date,
) {
  await transaction
    .update(workflowCases)
    .set({ status, currentStepKey, updatedAt, completedAt })
    .where(
      and(
        eq(workflowCases.organizationId, organizationId),
        eq(workflowCases.id, caseId),
      ),
    );
}

function insertActivity(
  transaction: DatabaseTransaction,
  value: Omit<typeof workflowActivities.$inferInsert, "id">,
) {
  return transaction
    .insert(workflowActivities)
    .values({ id: randomUUID(), ...value });
}

function requireStep(steps: WorkflowStep[], key: string) {
  const step = steps.find((candidate) => candidate.key === key);
  if (!step) {
    throw new Error(`Workflow step ${key} is not defined.`);
  }
  return step;
}

function expenseInputToValues(input: ExpenseCaseInput) {
  return {
    expense_date: input.expenseDate,
    amount: String(Number(input.amount)),
    purpose: input.purpose.trim(),
    payee: input.payee.trim(),
    receipt_reference: input.receiptReference.trim(),
  };
}

function calculateDueAt(now: Date, dueDays: number | null) {
  if (dueDays === null) {
    return null;
  }
  return new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);
}

function formatCaseNumber(caseNumber: number) {
  return `EXP-${String(caseNumber).padStart(4, "0")}`;
}

function lockWorkflowState(
  transaction: DatabaseTransaction,
  organizationId: string,
) {
  return transaction.execute(
    sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`,
  );
}

function lockCaseState(transaction: DatabaseTransaction, caseId: string) {
  return transaction.execute(
    sql`select pg_advisory_xact_lock(hashtext(${caseId}))`,
  );
}
