import { Button } from "@/components/general/button";

export default function NotFound() {
  return (
    <section className="p-7 sm:p-10">
      <p className="text-xs font-bold tracking-[0.14em] text-content-tertiary uppercase">
        Not found
      </p>
      <h1
        data-workspace-heading="true"
        tabIndex={-1}
        className="mt-3 text-3xl font-semibold tracking-tight text-content-primary outline-none"
      >
        指定されたデータは見つかりませんでした
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-content-secondary">
        業務要素または変更結果が存在しないか、サンプルの初期化によって削除された可能性があります。
      </p>
      <form action="/">
        <Button className="mt-8" type="submit">
          業務スペースへ戻る
        </Button>
      </form>
    </section>
  );
}
