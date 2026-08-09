import { Button } from "@/components/general/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-outline bg-surface p-8 shadow-panel sm:p-12">
        <p className="text-sm font-semibold tracking-[0.18em] text-content-tertiary uppercase">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-content-primary">
          指定された業務スペースは見つかりませんでした
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-content-secondary">
          URLを確認するか、利用できる業務スペースの入口へ戻ってください。
        </p>
        <form action="/">
          <Button className="mt-8" type="submit">
            業務スペースへ戻る
          </Button>
        </form>
      </section>
    </main>
  );
}
