export const RELATION_TYPES = [
  "REQUIRES",
  "REFERENCES",
  "GOVERNED_BY",
  "USES",
  "OWNED_BY",
  "APPROVED_BY",
  "PRODUCES",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

const RELATION_TYPE_SET = new Set<string>(RELATION_TYPES);

export function isRelationType(value: string): value is RelationType {
  return RELATION_TYPE_SET.has(value);
}

export const RELATION_TYPE_ORDER: Record<RelationType, number> = {
  GOVERNED_BY: 0,
  REFERENCES: 1,
  REQUIRES: 2,
  USES: 3,
  PRODUCES: 4,
  APPROVED_BY: 5,
  OWNED_BY: 6,
};
