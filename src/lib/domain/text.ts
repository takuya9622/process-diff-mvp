export function normalizeEditableText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function countUnicodeCodePoints(value: string) {
  return [...value].length;
}
