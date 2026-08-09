import { Button } from "@/components/general/button";

export function WorkspaceHeader({
  onReset,
  isPending,
}: {
  onReset: () => void;
  isPending: boolean;
}) {
  return (
    <header className="border-b border-outline bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-content-primary text-sm font-black tracking-tight text-surface">
            PD
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-content-primary sm:text-base">
                Process Diff
              </p>
              <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-[0.65rem] font-bold tracking-[0.12em] text-status-warning-content uppercase">
                Shared demo
              </span>
            </div>
            <p className="hidden text-xs text-content-tertiary sm:block">
              経費精算サンプル · 変更と影響候補の確認
            </p>
          </div>
        </div>
        <Button
          data-testid="reset-demo-button"
          variant="secondary"
          className="shrink-0"
          disabled={isPending}
          onClick={onReset}
        >
          <span aria-hidden="true">↺</span>
          <span className="hidden sm:inline">サンプルを</span>初期化
        </Button>
      </div>
    </header>
  );
}
