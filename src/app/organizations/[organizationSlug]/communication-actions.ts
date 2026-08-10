"use server";

import {
  getOrganizationContext,
  hasWorkspacePermission,
} from "@/lib/server/auth/session";
import {
  createCommunicationChannel,
  postCommunicationMessage,
} from "@/lib/server/communication-service";
import type { CommunicationActionResult } from "@/types/communication";

export async function createCommunicationChannelAction(
  organizationSlug: string,
  _previousState: CommunicationActionResult | null,
  formData: FormData,
): Promise<CommunicationActionResult> {
  return executeCommunicationMutation(organizationSlug, (context) =>
    createCommunicationChannel(
      context.organizationId,
      String(formData.get("name") ?? ""),
      String(formData.get("description") ?? ""),
    ),
  );
}

export async function postCommunicationMessageAction(
  organizationSlug: string,
  channelId: string,
  _previousState: CommunicationActionResult | null,
  formData: FormData,
): Promise<CommunicationActionResult> {
  return executeCommunicationMutation(organizationSlug, (context) =>
    postCommunicationMessage(
      context.organizationId,
      context.user.id,
      channelId,
      String(formData.get("body") ?? ""),
      String(formData.get("relatedCaseId") ?? ""),
    ),
  );
}

async function executeCommunicationMutation(
  organizationSlug: string,
  mutation: (
    context: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>,
  ) => Promise<CommunicationActionResult>,
): Promise<CommunicationActionResult> {
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
        message: "閲覧者はチャンネルの作成やメッセージの投稿ができません。",
      };
    }
    return await mutation(context);
  } catch (error) {
    console.error("Failed to update organization communication.", error);
    return {
      status: "error",
      message:
        "コミュニケーションを更新できませんでした。もう一度試してください。",
    };
  }
}
