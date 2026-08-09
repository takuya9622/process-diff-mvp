export type ConfirmChangeInput = {
  businessEntityId: string;
  beforeVersionId: string;
  content: string;
  reason: string;
};

export type ConfirmChangeResult =
  | { status: "success"; changeSetId: string }
  | { status: "invalid"; field: "content" | "reason"; message: string }
  | {
      status: "conflict";
      message: string;
      latestContent: string;
      latestVersionId: string;
      latestVersionNumber: number;
    }
  | { status: "not-found"; message: string }
  | { status: "error"; message: string };

export type ResetDemoResult =
  | { status: "success"; initialEntityId: string }
  | { status: "error"; message: string };
