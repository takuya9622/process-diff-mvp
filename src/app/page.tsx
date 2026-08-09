export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
          Process Diff MVP
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          業務の変更と影響を、履歴としてたどれる形へ。
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">
          Next.jsとPostgreSQLを使ったローカル開発環境の準備が完了しました。
          ここから業務要素、差分、影響候補の確認フローを実装します。
        </p>
      </div>

      <section
        aria-labelledby="environment-status"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2
          id="environment-status"
          className="text-lg font-semibold text-slate-900"
        >
          開発環境
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Application</dt>
            <dd className="mt-1 font-medium text-slate-900">Next.js 16</dd>
          </div>
          <div>
            <dt className="text-slate-500">Runtime</dt>
            <dd className="mt-1 font-medium text-slate-900">Node.js 24</dd>
          </div>
          <div>
            <dt className="text-slate-500">Database</dt>
            <dd className="mt-1 font-medium text-slate-900">PostgreSQL 17</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
