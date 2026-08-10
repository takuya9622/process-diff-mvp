import { randomUUID } from "node:crypto";

import { and, asc, count, eq, max } from "drizzle-orm";

import {
  validateChannelInput,
  validateMessageInput,
} from "@/lib/domain/communication-validation";
import { isUuid } from "@/lib/domain/identifier";
import { users } from "@/lib/server/database/auth-schema.generated";
import { database } from "@/lib/server/database/client";
import { ensureDemoCommunicationState } from "@/lib/server/database/demo-state";
import {
  communicationChannels,
  communicationMessages,
  workflowCases,
} from "@/lib/server/database/schema";
import { getCaseList } from "@/lib/server/workflow-service";
import type {
  CommunicationActionResult,
  CommunicationChannelSummary,
  CommunicationWorkspaceData,
} from "@/types/communication";

export async function getCommunicationWorkspaceData(
  organizationId: string,
  userId: string,
  requestedChannelId?: string,
): Promise<CommunicationWorkspaceData> {
  await ensureDemoCommunicationState(organizationId);

  const [channelRows, messageStatRows, caseRows] = await Promise.all([
    database
      .select()
      .from(communicationChannels)
      .where(eq(communicationChannels.organizationId, organizationId))
      .orderBy(asc(communicationChannels.name)),
    database
      .select({
        channelId: communicationMessages.channelId,
        messageCount: count(),
        lastMessageAt: max(communicationMessages.createdAt),
      })
      .from(communicationMessages)
      .where(eq(communicationMessages.organizationId, organizationId))
      .groupBy(communicationMessages.channelId),
    getCaseList(organizationId, userId, { includeOrganizationCases: true }),
  ]);

  const messageStats = new Map(
    messageStatRows.map((row) => [row.channelId, row]),
  );

  const channels: CommunicationChannelSummary[] = channelRows.map(
    (channel) => ({
      id: channel.id,
      key: channel.channelKey,
      name: channel.name,
      description: channel.description,
      messageCount: messageStats.get(channel.id)?.messageCount ?? 0,
      lastMessageAt:
        messageStats.get(channel.id)?.lastMessageAt?.toISOString() ?? null,
    }),
  );
  const selectedChannel =
    (requestedChannelId && isUuid(requestedChannelId)
      ? channels.find((channel) => channel.id === requestedChannelId)
      : null) ?? channels[0];

  if (!selectedChannel) {
    throw new Error("The organization does not have a communication channel.");
  }

  const messageRows = await database
    .select()
    .from(communicationMessages)
    .where(
      and(
        eq(communicationMessages.organizationId, organizationId),
        eq(communicationMessages.channelId, selectedChannel.id),
      ),
    )
    .orderBy(asc(communicationMessages.createdAt));
  const casesById = new Map(caseRows.map((item) => [item.id, item]));
  const messages = messageRows
    .filter((message) => message.channelId === selectedChannel.id)
    .map((message) => {
      const relatedCase = message.relatedCaseId
        ? casesById.get(message.relatedCaseId)
        : null;

      return {
        id: message.id,
        body: message.body,
        type: message.messageType as "TEXT" | "CASE_SHARE" | "SYSTEM",
        authorDisplayName: message.authorDisplayName,
        createdAt: message.createdAt.toISOString(),
        relatedCase: relatedCase
          ? {
              id: relatedCase.id,
              displayNumber: relatedCase.displayNumber,
              workflowName: relatedCase.workflowName,
              status: relatedCase.status,
              statusLabel: relatedCase.statusLabel,
            }
          : null,
      };
    });

  const shareableCases = caseRows.map((caseItem) => ({
    id: caseItem.id,
    displayNumber: caseItem.displayNumber,
    workflowName: caseItem.workflowName,
    statusLabel: caseItem.statusLabel,
  }));

  return { channels, selectedChannel, messages, shareableCases };
}

export async function createCommunicationChannel(
  organizationId: string,
  nameValue: string,
  descriptionValue: string,
): Promise<CommunicationActionResult> {
  const validation = validateChannelInput(nameValue, descriptionValue);
  if (validation.status === "invalid") {
    return validation;
  }

  const [duplicate] = await database
    .select({ id: communicationChannels.id })
    .from(communicationChannels)
    .where(
      and(
        eq(communicationChannels.organizationId, organizationId),
        eq(communicationChannels.name, validation.value.name),
      ),
    )
    .limit(1);
  if (duplicate) {
    return {
      status: "invalid",
      field: "name",
      message: "同じ名前のチャンネルがすでにあります。",
    };
  }

  const id = randomUUID();
  const now = new Date();
  await database.insert(communicationChannels).values({
    id,
    organizationId,
    channelKey: `native-${randomUUID()}`,
    name: validation.value.name,
    description: validation.value.description,
    createdAt: now,
    updatedAt: now,
  });
  return { status: "success", channelId: id };
}

export async function postCommunicationMessage(
  organizationId: string,
  userId: string,
  channelId: string,
  bodyValue: string,
  relatedCaseIdValue: string,
): Promise<CommunicationActionResult> {
  const validation = validateMessageInput(bodyValue);
  if (validation.status === "invalid") {
    return validation;
  }
  if (!isUuid(channelId)) {
    return { status: "not-found", message: "チャンネルが見つかりません。" };
  }

  const [channel] = await database
    .select({ id: communicationChannels.id })
    .from(communicationChannels)
    .where(
      and(
        eq(communicationChannels.organizationId, organizationId),
        eq(communicationChannels.id, channelId),
      ),
    )
    .limit(1);
  if (!channel) {
    return { status: "not-found", message: "チャンネルが見つかりません。" };
  }

  const relatedCaseId = relatedCaseIdValue || null;
  if (relatedCaseId) {
    if (!isUuid(relatedCaseId)) {
      return { status: "not-found", message: "共有する案件が見つかりません。" };
    }
    const [relatedCase] = await database
      .select({ id: workflowCases.id })
      .from(workflowCases)
      .where(
        and(
          eq(workflowCases.organizationId, organizationId),
          eq(workflowCases.id, relatedCaseId),
        ),
      )
      .limit(1);
    if (!relatedCase) {
      return { status: "not-found", message: "共有する案件が見つかりません。" };
    }
  }

  const [author] = await database
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!author) {
    return {
      status: "unauthorized",
      message: "投稿者を確認できませんでした。",
    };
  }

  const messageId = randomUUID();
  const now = new Date();
  await database.transaction(async (transaction) => {
    await transaction.insert(communicationMessages).values({
      id: messageId,
      organizationId,
      channelId,
      authorUserId: userId,
      authorDisplayName: author.name,
      messageType: relatedCaseId ? "CASE_SHARE" : "TEXT",
      body: validation.value.body,
      relatedCaseId,
      createdAt: now,
      editedAt: null,
    });
    await transaction
      .update(communicationChannels)
      .set({ updatedAt: now })
      .where(
        and(
          eq(communicationChannels.organizationId, organizationId),
          eq(communicationChannels.id, channelId),
        ),
      );
  });

  return { status: "success", channelId, messageId };
}
