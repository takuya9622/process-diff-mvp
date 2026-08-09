import type { SectionHeadingProps } from "@/types/components/general";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  focusTarget = false,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-outline pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.16em] text-action-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-content-primary focus:outline-none sm:text-4xl"
          tabIndex={focusTarget ? -1 : undefined}
          data-workspace-heading={focusTarget ? "true" : undefined}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-content-secondary sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
