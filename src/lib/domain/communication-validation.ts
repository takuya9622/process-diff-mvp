import { countUnicodeCodePoints } from "@/lib/domain/text";

export function validateChannelInput(
  nameValue: string,
  descriptionValue: string,
) {
  const name = nameValue.trim();
  const description = descriptionValue.trim();
  const nameLength = countUnicodeCodePoints(name);
  const descriptionLength = countUnicodeCodePoints(description);

  if (nameLength < 2 || nameLength > 40) {
    return {
      status: "invalid" as const,
      field: "name",
      message: "チャンネル名は2文字以上40文字以内で入力してください。",
    };
  }

  if (descriptionLength > 120) {
    return {
      status: "invalid" as const,
      field: "description",
      message: "説明は120文字以内で入力してください。",
    };
  }

  return { status: "valid" as const, value: { name, description } };
}

export function validateMessageInput(bodyValue: string) {
  const body = bodyValue.trim();
  const bodyLength = countUnicodeCodePoints(body);

  if (bodyLength < 1 || bodyLength > 2000) {
    return {
      status: "invalid" as const,
      field: "body",
      message: "メッセージは1文字以上2,000文字以内で入力してください。",
    };
  }

  return { status: "valid" as const, value: { body } };
}
