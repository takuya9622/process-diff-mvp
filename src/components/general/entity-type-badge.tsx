import type { BusinessEntityType } from "@/constants/business-entity";

const ENTITY_TYPE_BADGE_CLASSES: Record<BusinessEntityType, string> = {
  PROCESS: "bg-type-process-bg text-type-process-content",
  RULE: "bg-type-rule-bg text-type-rule-content",
  DOCUMENT: "bg-type-document-bg text-type-document-content",
  SYSTEM: "bg-type-system-bg text-type-system-content",
  ROLE: "bg-type-role-bg text-type-role-content",
};

export function EntityTypeBadge({
  type,
  label,
}: {
  type: BusinessEntityType;
  label: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.08em] ${ENTITY_TYPE_BADGE_CLASSES[type]}`}
    >
      {label}
    </span>
  );
}
