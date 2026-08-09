import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { INITIAL_DEMO_ENTITY_NAME } from "@/constants/demo";
import { confirmChange } from "@/lib/server/change-service";
import { database, sqlClient } from "@/lib/server/database/client";
import { resetDemoState } from "@/lib/server/database/demo-state";
import {
  businessEntities,
  changeSets,
  entityVersions,
} from "@/lib/server/database/schema";
import { getWorkspaceData } from "@/lib/server/workspace-service";

describe("confirmChange", () => {
  beforeEach(async () => {
    await resetDemoState();
  });

  afterAll(async () => {
    await resetDemoState();
    await sqlClient.end();
  });

  it("現在内容、新しいversion、ChangeSetを一つの確定操作で保存する", async () => {
    const workspace = await getWorkspaceData({});
    const target = workspace.selectedEntity;
    const changedContent =
      "金額にかかわらず、すべての経費申請に領収書を添付する。\n紙の領収書は申請後30日間保管する。";

    const result = await confirmChange({
      businessEntityId: target.id,
      beforeVersionId: target.currentVersionId,
      content: changedContent,
      reason: "少額経費を含めて証憑の確認方法を統一するため",
    });

    expect(result.status).toBe("success");

    const changedWorkspace = await getWorkspaceData(
      result.status === "success" ? { changeSetId: result.changeSetId } : {},
    );
    expect(changedWorkspace.selectedEntity.content).toBe(changedContent);
    expect(changedWorkspace.selectedEntity.currentVersionNumber).toBe(2);
    expect(changedWorkspace.changeResult?.beforeContent).toBe(target.content);
    expect(changedWorkspace.changeResult?.impactCandidates).toHaveLength(10);

    const savedChanges = await database.select().from(changeSets);
    const savedVersions = await database.select().from(entityVersions);
    expect(savedChanges).toHaveLength(1);
    expect(savedVersions).toHaveLength(13);
  });

  it("同じbefore_versionからの二つの変更は一方だけを確定する", async () => {
    const target = (await getWorkspaceData({})).selectedEntity;

    const results = await Promise.all([
      confirmChange({
        businessEntityId: target.id,
        beforeVersionId: target.currentVersionId,
        content: `${target.content}\n一つ目の変更。`,
        reason: "一つ目",
      }),
      confirmChange({
        businessEntityId: target.id,
        beforeVersionId: target.currentVersionId,
        content: `${target.content}\n二つ目の変更。`,
        reason: "二つ目",
      }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      "conflict",
      "success",
    ]);
    expect(await database.select().from(changeSets)).toHaveLength(1);
  });

  it("リセット後は初期状態だけが残り、古いURL用IDを再利用しない", async () => {
    const target = (await getWorkspaceData({})).selectedEntity;
    const change = await confirmChange({
      businessEntityId: target.id,
      beforeVersionId: target.currentVersionId,
      content: `${target.content}\n一時的な変更。`,
      reason: "リセット検証",
    });

    expect(change.status).toBe("success");
    const reset = await resetDemoState();
    const resetWorkspace = await getWorkspaceData({
      changeSetId: change.status === "success" ? change.changeSetId : undefined,
    });

    expect(reset.initialEntityId).not.toBe(target.id);
    expect(resetWorkspace.selectedEntity.name).toBe(INITIAL_DEMO_ENTITY_NAME);
    expect(resetWorkspace.changeResult).toBeNull();
    expect(resetWorkspace.notice).toMatch(/見つかりません/);
    expect(await database.select().from(businessEntities)).toHaveLength(12);
    expect(await database.select().from(entityVersions)).toHaveLength(12);
    expect(await database.select().from(changeSets)).toHaveLength(0);
  });
});
