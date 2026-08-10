import { formatFieldValue } from "@/lib/workflow-display";
import type { CaseFieldValue } from "@/types/workflow";

export function CaseFieldList({
  fields,
  stepKey,
}: {
  fields: CaseFieldValue[];
  stepKey: string;
}) {
  const visibleFields = fields.filter((field) => field.stepKey === stepKey);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {visibleFields.map((field) => (
        <div key={field.id} className="border-b border-outline pb-3">
          <dt className="text-xs font-bold text-content-tertiary">
            {field.label}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 font-medium text-content-primary">
            {formatFieldValue(field)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
