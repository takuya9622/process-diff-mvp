import type { CaseSummary } from "@/types/workflow";

export type CommunicationChannelSummary = {
  id: string;
  key: string;
  name: string;
  description: string;
  messageCount: number;
  lastMessageAt: string | null;
};

export type CommunicationCaseLink = Pick<
  CaseSummary,
  "id" | "displayNumber" | "workflowName" | "status" | "statusLabel"
>;

export type CommunicationShareableCase = Pick<
  CaseSummary,
  "id" | "displayNumber" | "workflowName" | "statusLabel"
>;

export type CommunicationMessage = {
  id: string;
  body: string;
  type: "TEXT" | "CASE_SHARE" | "SYSTEM";
  authorDisplayName: string;
  createdAt: string;
  relatedCase: CommunicationCaseLink | null;
};

export type CommunicationWorkspaceData = {
  channels: CommunicationChannelSummary[];
  selectedChannel: CommunicationChannelSummary;
  messages: CommunicationMessage[];
  shareableCases: CommunicationShareableCase[];
};

export type CommunicationActionResult =
  | { status: "success"; channelId: string; messageId?: string }
  | { status: "invalid"; message: string; field?: string }
  | { status: "not-found" | "unauthorized" | "forbidden"; message: string }
  | { status: "error"; message: string };
