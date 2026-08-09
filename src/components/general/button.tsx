import type { ButtonProps, ButtonVariant } from "@/types/components/general";

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-action-primary bg-action-primary text-surface hover:border-action-primary-hover hover:bg-action-primary-hover",
  secondary:
    "border-outline-strong bg-surface text-content-primary hover:border-action-primary hover:bg-action-muted",
  ghost:
    "border-transparent bg-transparent text-content-secondary hover:bg-surface-strong hover:text-content-primary",
  danger:
    "border-status-danger-content bg-surface text-status-danger-content hover:bg-status-danger-bg",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 ${BUTTON_VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
