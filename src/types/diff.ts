export type DiffLineStatus = "unchanged" | "removed" | "added";

export type DiffLine = {
  status: DiffLineStatus;
  content: string;
  beforeLineNumber: number | null;
  afterLineNumber: number | null;
};

export type DiffSummary = {
  added: number;
  removed: number;
  unchanged: number;
};
