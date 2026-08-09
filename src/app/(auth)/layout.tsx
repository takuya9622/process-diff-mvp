export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-outline bg-surface p-6 shadow-panel sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-content-primary text-sm font-black tracking-tight text-surface">
            PD
          </span>
          <div>
            <p className="font-bold text-content-primary">Process Diff</p>
            <p className="text-xs text-content-tertiary">
              変更と影響候補を組織ごとに管理
            </p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
