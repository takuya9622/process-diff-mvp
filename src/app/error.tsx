"use client";

import { Button } from "@/components/general/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-outline bg-surface p-8 shadow-panel sm:p-12">
        <p className="text-sm font-semibold tracking-[0.18em] text-status-danger-content uppercase">
          Data unavailable
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-content-primary">
          業務スペースを表示できませんでした
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-content-secondary">
          データベース接続またはサンプル初期状態を確認できません。少し待ってから再試行してください。
        </p>
        <Button className="mt-8" onClick={reset}>
          もう一度読み込む
        </Button>
      </section>
    </main>
  );
}
