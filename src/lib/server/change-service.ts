import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import { isUuid } from "@/lib/domain/identifier";
import { validateChangeInput } from "@/lib/domain/input-validation";
import { database } from "@/lib/server/database/client";
import {
  businessEntities,
  changeSets,
  entityVersions,
} from "@/lib/server/database/schema";
import type { ConfirmChangeInput, ConfirmChangeResult } from "@/types/actions";

export async function confirmChange(
  organizationId: string,
  changedByUserId: string,
  input: ConfirmChangeInput,
): Promise<ConfirmChangeResult> {
  const validation = validateChangeInput(input.content, input.reason);

  if (!validation.valid) {
    return {
      status: "invalid",
      field: validation.field,
      message: validation.message,
    };
  }

  if (!isUuid(input.businessEntityId) || !isUuid(input.beforeVersionId)) {
    return {
      status: "not-found",
      message:
        "変更対象を確認できませんでした。画面を更新してやり直してください。",
    };
  }

  return database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select id from business_entities where organization_id = ${organizationId} and id = ${input.businessEntityId} for update`,
    );

    const [entity] = await transaction
      .select()
      .from(businessEntities)
      .where(
        and(
          eq(businessEntities.organizationId, organizationId),
          eq(businessEntities.id, input.businessEntityId),
        ),
      )
      .limit(1);

    if (!entity) {
      return {
        status: "not-found" as const,
        message:
          "変更対象は現在利用できません。サンプルを初期状態へ戻してください。",
      };
    }

    const [currentVersion] = await transaction
      .select()
      .from(entityVersions)
      .where(
        and(
          eq(entityVersions.organizationId, organizationId),
          eq(entityVersions.businessEntityId, entity.id),
        ),
      )
      .orderBy(desc(entityVersions.versionNumber))
      .limit(1);

    if (!currentVersion) {
      return {
        status: "not-found" as const,
        message:
          "現在のバージョンを確認できません。サンプルを初期状態へ戻してください。",
      };
    }

    if (currentVersion.id !== input.beforeVersionId) {
      return {
        status: "conflict" as const,
        message:
          "ほかの変更が反映されています。最新内容を確認してから、もう一度変更してください。",
        latestContent: entity.currentContent,
        latestVersionId: currentVersion.id,
        latestVersionNumber: currentVersion.versionNumber,
      };
    }

    if (validation.value.content === entity.currentContent) {
      return {
        status: "invalid" as const,
        field: "content" as const,
        message: "変更前と異なる内容を入力してください。",
      };
    }

    const now = new Date();
    const nextVersionId = randomUUID();
    const changeSetId = randomUUID();

    await transaction.insert(entityVersions).values({
      id: nextVersionId,
      organizationId,
      businessEntityId: entity.id,
      versionNumber: currentVersion.versionNumber + 1,
      content: validation.value.content,
      createdAt: now,
    });
    await transaction.insert(changeSets).values({
      id: changeSetId,
      organizationId,
      changedByUserId,
      businessEntityId: entity.id,
      beforeVersionId: currentVersion.id,
      afterVersionId: nextVersionId,
      reason: validation.value.reason,
      createdAt: now,
    });
    await transaction
      .update(businessEntities)
      .set({
        currentContent: validation.value.content,
        updatedAt: now,
      })
      .where(
        and(
          eq(businessEntities.organizationId, organizationId),
          eq(businessEntities.id, entity.id),
        ),
      );

    return { status: "success" as const, changeSetId };
  });
}
