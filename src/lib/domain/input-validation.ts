import {
  CHANGE_REASON_MAX_LENGTH,
  CONTENT_MAX_LENGTH,
  CONTENT_MAX_LINES,
} from "@/constants/demo";
import {
  countUnicodeCodePoints,
  normalizeEditableText,
} from "@/lib/domain/text";

export type ValidatedChangeInput = {
  content: string;
  reason: string | null;
};

export type ChangeInputValidationResult =
  | { valid: true; value: ValidatedChangeInput }
  | {
      valid: false;
      field: "content" | "reason";
      message: string;
    };

export function validateChangeInput(
  content: string,
  reason: string,
): ChangeInputValidationResult {
  const normalizedContent = normalizeEditableText(content);
  const normalizedReason = normalizeEditableText(reason);

  if (!normalizedContent) {
    return {
      valid: false,
      field: "content",
      message: "変更後の内容を入力してください。",
    };
  }

  if (countUnicodeCodePoints(normalizedContent) > CONTENT_MAX_LENGTH) {
    return {
      valid: false,
      field: "content",
      message: `内容は${CONTENT_MAX_LENGTH.toLocaleString("ja-JP")}文字以内で入力してください。`,
    };
  }

  if (normalizedContent.split("\n").length > CONTENT_MAX_LINES) {
    return {
      valid: false,
      field: "content",
      message: `内容は${CONTENT_MAX_LINES.toLocaleString("ja-JP")}行以内で入力してください。`,
    };
  }

  if (countUnicodeCodePoints(normalizedReason) > CHANGE_REASON_MAX_LENGTH) {
    return {
      valid: false,
      field: "reason",
      message: `変更理由は${CHANGE_REASON_MAX_LENGTH.toLocaleString("ja-JP")}文字以内で入力してください。`,
    };
  }

  return {
    valid: true,
    value: {
      content: normalizedContent,
      reason: normalizedReason || null,
    },
  };
}
