export const BUSINESS_ENTITY_TYPES = [
  "PROCESS",
  "RULE",
  "DOCUMENT",
  "ROLE",
  "SYSTEM",
] as const;

export type BusinessEntityType = (typeof BUSINESS_ENTITY_TYPES)[number];

const BUSINESS_ENTITY_TYPE_SET = new Set<string>(BUSINESS_ENTITY_TYPES);

export function isBusinessEntityType(
  value: string,
): value is BusinessEntityType {
  return BUSINESS_ENTITY_TYPE_SET.has(value);
}

export const BUSINESS_ENTITY_TYPE_LABELS: Record<BusinessEntityType, string> = {
  PROCESS: "業務",
  RULE: "ルール",
  DOCUMENT: "文書",
  ROLE: "役割",
  SYSTEM: "システム",
};

export const BUSINESS_ENTITY_TYPE_ORDER: Record<BusinessEntityType, number> = {
  PROCESS: 0,
  RULE: 1,
  DOCUMENT: 2,
  SYSTEM: 3,
  ROLE: 4,
};
