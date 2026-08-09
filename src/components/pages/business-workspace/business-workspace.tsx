"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { confirmChangeAction, resetDemoAction } from "@/app/actions";
import { ChangeEditor } from "@/components/pages/business-workspace/change-editor/change-editor";
import { DiffReview } from "@/components/pages/business-workspace/diff-review/diff-review";
import { EntityDetail } from "@/components/pages/business-workspace/entity-detail/entity-detail";
import { EntityNavigation } from "@/components/pages/business-workspace/entity-navigation/entity-navigation";
import { ImpactResult } from "@/components/pages/business-workspace/impact-result/impact-result";
import { WorkspaceHeader } from "@/components/pages/business-workspace/workspace-header";
import { validateChangeInput } from "@/lib/domain/input-validation";
import { createLineDiff, summarizeLineDiff } from "@/lib/domain/line-diff";
import type { BusinessEntity } from "@/types/business-entity";
import type { WorkspaceData } from "@/types/workspace";

type WorkspaceMode = "detail" | "edit" | "review" | "result";

export function BusinessWorkspace({ workspace }: { workspace: WorkspaceData }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const workspacePanelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<WorkspaceMode>(
    workspace.changeResult ? "result" : "detail",
  );
  const [baseEntity, setBaseEntity] = useState<BusinessEntity>(
    workspace.selectedEntity,
  );
  const [draftContent, setDraftContent] = useState(
    workspace.selectedEntity.content,
  );
  const [draftReason, setDraftReason] = useState("");
  const [fieldError, setFieldError] = useState<{
    field: "content" | "reason";
    message: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    workspace.changeResult?.impactCandidates[0]?.entity.id ?? null,
  );
  const draftDiff = useMemo(
    () => createLineDiff(baseEntity.content, draftContent),
    [baseEntity.content, draftContent],
  );
  const draftDiffSummary = useMemo(
    () => summarizeLineDiff(draftDiff),
    [draftDiff],
  );

  useEffect(() => {
    workspacePanelRef.current
      ?.querySelector<HTMLElement>("[data-workspace-heading='true']")
      ?.focus();
  }, [mode]);

  function beginEdit() {
    setBaseEntity(workspace.selectedEntity);
    setDraftContent(workspace.selectedEntity.content);
    setDraftReason("");
    setFieldError(null);
    setActionError(null);
    setMode("edit");
  }

  function reviewChange() {
    const validation = validateChangeInput(draftContent, draftReason);

    if (!validation.valid) {
      setFieldError({
        field: validation.field,
        message: validation.message,
      });
      return;
    }

    if (validation.value.content === baseEntity.content) {
      setFieldError({
        field: "content",
        message: "変更前と異なる内容を入力してください。",
      });
      return;
    }

    setDraftContent(validation.value.content);
    setDraftReason(validation.value.reason ?? "");
    setFieldError(null);
    setActionError(null);
    setMode("review");
  }

  function confirmDraft() {
    setActionError(null);
    startTransition(async () => {
      const result = await confirmChangeAction({
        businessEntityId: baseEntity.id,
        beforeVersionId: baseEntity.currentVersionId,
        content: draftContent,
        reason: draftReason,
      });

      if (result.status === "success") {
        router.push(`/?change=${encodeURIComponent(result.changeSetId)}`);
        return;
      }

      if (result.status === "conflict") {
        setBaseEntity((current) => ({
          ...current,
          content: result.latestContent,
          currentVersionId: result.latestVersionId,
          currentVersionNumber: result.latestVersionNumber,
        }));
        setActionError(
          `${result.message} 変更前の欄を最新のv${result.latestVersionNumber}へ更新しました。編集中の内容は保持しています。`,
        );
        return;
      }

      if (result.status === "invalid") {
        setFieldError({ field: result.field, message: result.message });
        setActionError(result.message);
        setMode("edit");
        return;
      }

      setActionError(result.message);
    });
  }

  function navigateToEntity(entityId: string) {
    if (entityId === workspace.selectedEntity.id && mode === "detail") {
      return;
    }

    if (
      hasUnconfirmedDraft() &&
      !window.confirm("未確定の変更案を破棄して移動しますか？")
    ) {
      return;
    }

    router.push(`/?entity=${encodeURIComponent(entityId)}`);
  }

  function resetDemo() {
    const confirmed = window.confirm(
      "共有サンプルのすべての変更内容と変更履歴を削除し、初期状態へ戻します。続けますか？",
    );

    if (!confirmed) {
      return;
    }

    setResetError(null);
    startTransition(async () => {
      const result = await resetDemoAction();

      if (result.status === "success") {
        router.push(`/?entity=${encodeURIComponent(result.initialEntityId)}`);
        return;
      }

      setResetError(result.message);
    });
  }

  function hasUnconfirmedDraft() {
    return (
      (mode === "edit" || mode === "review") &&
      (draftContent !== baseEntity.content || draftReason.trim().length > 0)
    );
  }

  return (
    <div className="min-h-screen">
      <WorkspaceHeader onReset={resetDemo} isPending={isPending} />
      <main
        aria-busy={isPending}
        className="mx-auto max-w-[92rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"
      >
        {workspace.notice ? (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-status-info-content/20 bg-status-info-bg px-4 py-3 text-sm text-status-info-content"
          >
            {workspace.notice}
          </div>
        ) : null}
        {resetError ? (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-status-danger-content/20 bg-status-danger-bg px-4 py-3 text-sm font-semibold text-status-danger-content"
          >
            {resetError}
          </div>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <EntityNavigation
            entities={workspace.entities}
            selectedEntityId={workspace.selectedEntity.id}
            onSelect={navigateToEntity}
          />
          <div
            ref={workspacePanelRef}
            className="min-w-0 rounded-3xl border border-outline bg-surface p-5 shadow-panel sm:p-7 lg:p-9"
          >
            <motion.div
              key={mode}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            >
              {mode === "detail" ? (
                <EntityDetail
                  entity={workspace.selectedEntity}
                  directRelations={workspace.directRelations}
                  onEdit={beginEdit}
                  onSelectEntity={navigateToEntity}
                />
              ) : null}
              {mode === "edit" ? (
                <ChangeEditor
                  entity={baseEntity}
                  content={draftContent}
                  reason={draftReason}
                  fieldError={fieldError}
                  onContentChange={(value) => {
                    setDraftContent(value);
                    setFieldError(null);
                  }}
                  onReasonChange={(value) => {
                    setDraftReason(value);
                    setFieldError(null);
                  }}
                  onCancel={() => setMode("detail")}
                  onReview={reviewChange}
                />
              ) : null}
              {mode === "review" ? (
                <DiffReview
                  entity={baseEntity}
                  reason={draftReason}
                  diff={draftDiff}
                  summary={draftDiffSummary}
                  actionError={actionError}
                  isPending={isPending}
                  onBack={() => setMode("edit")}
                  onConfirm={confirmDraft}
                />
              ) : null}
              {mode === "result" && workspace.changeResult ? (
                <ImpactResult
                  entity={workspace.selectedEntity}
                  changeResult={workspace.changeResult}
                  selectedCandidateId={selectedCandidateId}
                  onSelectCandidate={setSelectedCandidateId}
                  onOpenEntity={navigateToEntity}
                  onBackToEntity={() =>
                    navigateToEntity(workspace.selectedEntity.id)
                  }
                />
              ) : null}
            </motion.div>
          </div>
        </div>

        <footer className="px-2 pt-6 pb-2 text-center text-xs leading-5 text-content-tertiary">
          Process Diff MVP · 公開用の架空データを使用しています
        </footer>
      </main>
    </div>
  );
}
