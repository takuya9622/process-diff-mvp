export function WorkspaceLoading() {
  return (
    <div className="flex min-h-80 items-center justify-center px-6 py-16">
      <div
        aria-live="polite"
        className="rounded-3xl border border-outline bg-surface px-8 py-7 shadow-panel"
      >
        <p className="text-sm font-semibold text-content-primary">
          業務知識ワークスペースを読み込んでいます
        </p>
        <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-surface-strong">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-action-primary" />
        </div>
      </div>
    </div>
  );
}
