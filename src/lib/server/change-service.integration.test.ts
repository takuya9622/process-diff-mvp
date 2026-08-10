import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { INITIAL_DEMO_ENTITY_NAME } from "@/constants/demo";
import { confirmChange } from "@/lib/server/change-service";
import {
  organizationMemberships,
  organizations,
  users,
} from "@/lib/server/database/auth-schema.generated";
import { database, sqlClient } from "@/lib/server/database/client";
import { resetDemoState } from "@/lib/server/database/demo-state";
import {
  businessEntities,
  businessRelations,
  changeSets,
  entityVersions,
} from "@/lib/server/database/schema";
import {
  getChangeWorkspaceData,
  getEntityWorkspaceData,
  getInitialWorkspaceEntityId,
} from "@/lib/server/workspace-service";

const primaryFixture = createFixture("primary");
const secondaryFixture = createFixture("secondary");
const organizationIds = [
  primaryFixture.organizationId,
  secondaryFixture.organizationId,
];
const userIds = [primaryFixture.userId, secondaryFixture.userId];

describe("confirmChange", () => {
  beforeAll(async () => {
    await insertFixture(primaryFixture);
    await insertFixture(secondaryFixture);
  });

  beforeEach(async () => {
    await resetDemoState(primaryFixture.organizationId);
    await resetDemoState(secondaryFixture.organizationId);
  });

  afterAll(async () => {
    await deleteFixtureData();
    await sqlClient.end();
  });

  it("初期表示では経費申請を起点に7件の業務構造を取得する", async () => {
    const workspace = await getInitialWorkspaceData(primaryFixture);

    expect(workspace.selectedEntity.name).toBe("経費申請");
    expect(workspace.selectedEntity.type).toBe("PROCESS");
    expect(workspace.directRelations).toHaveLength(7);
    expect(
      workspace.directRelations.map((relation) => relation.relatedEntity.name),
    ).toEqual(
      expect.arrayContaining([
        "領収書提出ルール",
        "金額別承認ルール",
        "経費申請システム",
        "申請者",
        "承認者",
        "経費申請マニュアル",
        "証憑確認",
      ]),
    );
  });

  it("現在内容、新しいversion、ChangeSetと変更者を一つの確定操作で保存する", async () => {
    const workspace = await getChangeTargetWorkspaceData(primaryFixture);
    const target = workspace.selectedEntity;
    const changedContent =
      "金額にかかわらず、すべての経費申請に領収書を添付する。\n紙の領収書は申請後30日間保管する。";

    const result = await confirmFixtureChange(primaryFixture, {
      businessEntityId: target.id,
      beforeVersionId: target.currentVersionId,
      content: changedContent,
      reason: "少額経費を含めて証憑の確認方法を統一するため",
    });

    expect(result.status).toBe("success");

    const changedWorkspace =
      result.status === "success"
        ? await getChangeWorkspaceData(
            primaryFixture.organizationId,
            result.changeSetId,
          )
        : null;
    expect(changedWorkspace).not.toBeNull();
    if (!changedWorkspace) {
      throw new Error("Changed workspace was not found.");
    }
    expect(changedWorkspace.selectedEntity.content).toBe(changedContent);
    expect(changedWorkspace.selectedEntity.currentVersionNumber).toBe(2);
    expect(changedWorkspace.changeResult?.beforeContent).toBe(target.content);
    expect(changedWorkspace.changeResult?.changedByName).toBe(
      primaryFixture.userName,
    );
    expect(changedWorkspace.changeResult?.impactCandidates).toHaveLength(10);

    const savedChanges = await selectPrimaryChanges();
    const savedVersions = await database
      .select()
      .from(entityVersions)
      .where(eq(entityVersions.organizationId, primaryFixture.organizationId));
    expect(savedChanges).toHaveLength(1);
    expect(savedVersions).toHaveLength(13);
  });

  it("同じbefore_versionからの二つの変更は一方だけを確定する", async () => {
    const target = (await getChangeTargetWorkspaceData(primaryFixture))
      .selectedEntity;

    const results = await Promise.all([
      confirmFixtureChange(primaryFixture, {
        businessEntityId: target.id,
        beforeVersionId: target.currentVersionId,
        content: `${target.content}\n一つ目の変更。`,
        reason: "一つ目",
      }),
      confirmFixtureChange(primaryFixture, {
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
    expect(await selectPrimaryChanges()).toHaveLength(1);
  });

  it("リセット後は対象組織の初期状態だけが残り、古いURL用IDを再利用しない", async () => {
    const target = (await getInitialWorkspaceData(primaryFixture))
      .selectedEntity;
    const secondaryInitialId = await getInitialWorkspaceEntityId(
      secondaryFixture.organizationId,
    );
    const change = await confirmFixtureChange(primaryFixture, {
      businessEntityId: target.id,
      beforeVersionId: target.currentVersionId,
      content: `${target.content}\n一時的な変更。`,
      reason: "リセット検証",
    });

    expect(change.status).toBe("success");
    const reset = await resetDemoState(primaryFixture.organizationId);
    const resetWorkspace =
      change.status === "success"
        ? await getChangeWorkspaceData(
            primaryFixture.organizationId,
            change.changeSetId,
          )
        : null;

    expect(reset.initialEntityId).not.toBe(target.id);
    expect(resetWorkspace).toBeNull();
    expect(
      await getInitialWorkspaceEntityId(secondaryFixture.organizationId),
    ).toBe(secondaryInitialId);
    const initialWorkspace = await getInitialWorkspaceData(primaryFixture);
    expect(initialWorkspace.selectedEntity.name).toBe(INITIAL_DEMO_ENTITY_NAME);
    expect(await selectPrimaryEntities()).toHaveLength(12);
    expect(await selectPrimaryVersions()).toHaveLength(12);
    expect(await selectPrimaryChanges()).toHaveLength(0);
  });

  it("別組織の業務要素と変更結果はIDを知っていても取得できない", async () => {
    const target = (await getInitialWorkspaceData(primaryFixture))
      .selectedEntity;
    const change = await confirmFixtureChange(primaryFixture, {
      businessEntityId: target.id,
      beforeVersionId: target.currentVersionId,
      content: `${target.content}\n組織境界の検証。`,
      reason: "組織境界",
    });

    expect(
      await getEntityWorkspaceData(secondaryFixture.organizationId, target.id),
    ).toBeNull();
    expect(
      change.status === "success"
        ? await getChangeWorkspaceData(
            secondaryFixture.organizationId,
            change.changeSetId,
          )
        : undefined,
    ).toBeNull();

    const secondaryTarget = (await getInitialWorkspaceData(secondaryFixture))
      .selectedEntity;
    const crossOrganizationChange = await confirmFixtureChange(primaryFixture, {
      businessEntityId: secondaryTarget.id,
      beforeVersionId: secondaryTarget.currentVersionId,
      content: `${secondaryTarget.content}\n不正な変更。`,
      reason: "組織境界",
    });
    expect(crossOrganizationChange.status).toBe("not-found");

    await expect(
      database.insert(businessRelations).values({
        id: randomUUID(),
        organizationId: primaryFixture.organizationId,
        sourceEntityId: target.id,
        targetEntityId: secondaryTarget.id,
        relationType: "REFERENCES",
        createdAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});

type Fixture = ReturnType<typeof createFixture>;

function createFixture(label: string) {
  return {
    userId: randomUUID(),
    userName: `${label} user`,
    userEmail: `${label}-${randomUUID()}@example.com`,
    organizationId: randomUUID(),
    organizationName: `${label} organization`,
    organizationSlug: `${label}-${randomUUID()}`,
  };
}

async function insertFixture(fixture: Fixture) {
  const now = new Date();
  await database.insert(users).values({
    id: fixture.userId,
    name: fixture.userName,
    email: fixture.userEmail,
    createdAt: now,
    updatedAt: now,
  });
  await database.insert(organizations).values({
    id: fixture.organizationId,
    name: fixture.organizationName,
    slug: fixture.organizationSlug,
    createdAt: now,
  });
  await database.insert(organizationMemberships).values({
    id: randomUUID(),
    organizationId: fixture.organizationId,
    userId: fixture.userId,
    role: "owner",
    createdAt: now,
  });
}

async function deleteFixtureData() {
  await database
    .delete(changeSets)
    .where(inArray(changeSets.organizationId, organizationIds));
  await database
    .delete(entityVersions)
    .where(inArray(entityVersions.organizationId, organizationIds));
  await database
    .delete(businessRelations)
    .where(inArray(businessRelations.organizationId, organizationIds));
  await database
    .delete(businessEntities)
    .where(inArray(businessEntities.organizationId, organizationIds));
  await database
    .delete(organizations)
    .where(inArray(organizations.id, organizationIds));
  await database.delete(users).where(inArray(users.id, userIds));
}

async function getInitialWorkspaceData(fixture: Fixture) {
  const initialEntityId = await getInitialWorkspaceEntityId(
    fixture.organizationId,
  );
  const workspace = await getEntityWorkspaceData(
    fixture.organizationId,
    initialEntityId,
  );

  if (!workspace) {
    throw new Error("Initial workspace entity was not found.");
  }

  return workspace;
}

async function getChangeTargetWorkspaceData(fixture: Fixture) {
  const initialWorkspace = await getInitialWorkspaceData(fixture);
  const target = initialWorkspace.directRelations.find(
    (relation) => relation.relatedEntity.name === "領収書提出ルール",
  );

  if (!target) {
    throw new Error("Change target was not found from the initial process.");
  }

  const workspace = await getEntityWorkspaceData(
    fixture.organizationId,
    target.relatedEntity.id,
  );

  if (!workspace) {
    throw new Error("Change target workspace was not found.");
  }

  return workspace;
}

function confirmFixtureChange(
  fixture: Fixture,
  input: Parameters<typeof confirmChange>[2],
) {
  return confirmChange(fixture.organizationId, fixture.userId, input);
}

function selectPrimaryChanges() {
  return database
    .select()
    .from(changeSets)
    .where(eq(changeSets.organizationId, primaryFixture.organizationId));
}

function selectPrimaryEntities() {
  return database
    .select()
    .from(businessEntities)
    .where(eq(businessEntities.organizationId, primaryFixture.organizationId));
}

function selectPrimaryVersions() {
  return database
    .select()
    .from(entityVersions)
    .where(eq(entityVersions.organizationId, primaryFixture.organizationId));
}
