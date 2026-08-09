"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { MouseEventHandler } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { confirmChangeAction } from "@/app/actions";
import { ChangeEditor } from "@/components/pages/business-workspace/change-editor/change-editor";
import { DiffReview } from "@/components/pages/business-workspace/diff-review/diff-review";
import { EntityDetail } from "@/components/pages/business-workspace/entity-detail/entity-detail";
import { ImpactResult } from "@/components/pages/business-workspace/impact-result/impact-result";
import { useWorkspaceRouteState } from "@/components/pages/business-workspace/workspace-shell";
import { createChangePath } from "@/constants/routes";
import { validateChangeInput } from "@/lib/domain/input-validation";
import { createLineDiff, summarizeLineDiff } from "@/lib/domain/line-diff";
import type { BusinessEntity } from "@/types/business-entity";
import type { WorkspaceData } from "@/types/workspace";

type WorkspaceMode = "detail" | "edit" | "review" | "result";

export function BusinessWorkspace({
  organizationSlug,
  workspace,
}: {
  organizationSlug: string;
  workspace: WorkspaceData;
}) {
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
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    workspace.changeResult?.impactCandidates[0]?.entity.id ?? null,
  );
  const hasUnconfirmedDraft =
    (mode === "edit" || mode === "review") &&
    (draftContent !== baseEntity.content || draftReason.trim().length > 0);
  const draftDiff = useMemo(
    () => createLineDiff(baseEntity.content, draftContent),
    [baseEntity.content, draftContent],
  );
  const draftDiffSummary = useMemo(
    () => summarizeLineDiff(draftDiff),
    [draftDiff],
  );

  useWorkspaceRouteState(workspace.selectedEntity.id, hasUnconfirmedDraft);

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
        router.push(createChangePath(organizationSlug, result.changeSetId));
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

  const handleEntityNavigate: MouseEventHandler<HTMLAnchorElement> = (
    event,
  ) => {
    if (
      hasUnconfirmedDraft &&
      !window.confirm("未確定の変更案を破棄して移動しますか？")
    ) {
      event.preventDefault();
    }
  };

  return (
    <div ref={workspacePanelRef} className="p-5 sm:p-7 lg:p-9">
      <motion.div
        key={mode}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      >
        {mode === "detail" ? (
          <EntityDetail
            organizationSlug={organizationSlug}
            entity={workspace.selectedEntity}
            directRelations={workspace.directRelations}
            onEdit={beginEdit}
            onNavigate={handleEntityNavigate}
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
            organizationSlug={organizationSlug}
            entity={workspace.selectedEntity}
            changeResult={workspace.changeResult}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={setSelectedCandidateId}
            onNavigate={handleEntityNavigate}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
