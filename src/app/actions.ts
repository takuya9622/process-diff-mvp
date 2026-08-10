"use server";

import { revalidatePath } from "next/cache";

import { confirmChange } from "@/lib/server/change-service";
import {
  getOrganizationContext,
  hasWorkspacePermission,
} from "@/lib/server/auth/session";
import { resetDemoState } from "@/lib/server/database/demo-state";
import type {
  ConfirmChangeInput,
  ConfirmChangeResult,
  ResetDemoResult,
} from "@/types/actions";

export async function confirmChangeAction(
  organizationSlug: string,
  input: ConfirmChangeInput,
): Promise<ConfirmChangeResult> {
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
        message: "この組織で変更を確定する権限がありません。",
      };
    }

    const result = await confirmChange(
      context.organizationId,
      context.user.id,
      input,
    );

    if (result.status === "success") {
      revalidatePath("/organizations/[organizationSlug]", "layout");
    }

    return result;
  } catch (error) {
    console.error("Failed to confirm a demo change.", error);
    return {
      status: "error",
      message:
        "変更を確定できませんでした。入力内容を残したまま、もう一度試してください。",
    };
  }
}

export async function resetDemoAction(
  organizationSlug: string,
): Promise<ResetDemoResult> {
  try {
    const context = await getOrganizationContext(organizationSlug);

    if (!context) {
      return {
        status: "unauthorized",
        message: "ログイン状態または組織への所属を確認できませんでした。",
      };
    }

    if (!hasWorkspacePermission(context.role, "reset")) {
      return {
        status: "forbidden",
        message: "組織のサンプルを初期化できるのはオーナーだけです。",
      };
    }

    const result = await resetDemoState(context.organizationId);
    revalidatePath("/organizations/[organizationSlug]", "layout");
    return { status: "success", initialEntityId: result.initialEntityId };
  } catch (error) {
    console.error("Failed to reset the demo state.", error);
    return {
      status: "error",
      message:
        "サンプルを初期状態へ戻せませんでした。時間をおいてもう一度試してください。",
    };
  }
}
