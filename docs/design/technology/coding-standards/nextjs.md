# Next.jsコーディング規約

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 初期決定 |
| 対象 | Next.js App Router、React、TypeScript |
| 最終更新日 | 2026-08-09 |

この文書は、[共通コーディング規約](README.md)を前提として、Next.jsコードの配置、
コンポーネント境界、型、定数、データ処理を定義します。Server Components、Server Actions、
SPAの基本方針は[MVP技術選定](../README.md)を参照してください。

## 2. 基本方針

- App Routerと`src`ディレクトリを使用する。
- 画面はServer Componentから始め、対話操作に必要な最小範囲だけをClient Componentにする。
- `page.tsx`と`layout.tsx`はルーティング境界と組み立てを担当し、画面固有の大きな実装を
  抱え込まない。
- 業務ロジック、データ取得、表示、ブラウザ状態を一つのコンポーネントへ混在させない。
- フレームワークの機能を独自実装で置き換える前に、App Routerの標準機能で表現できるかを
  確認する。

Next.jsのファイル規約と配置方法は
[公式のProject structure](https://nextjs.org/docs/app/getting-started/project-structure)、
ServerとClientの境界は
[公式のServer and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
を基準とします。

## 3. ディレクトリ構成

初期構成は次を基本とし、実際に責務が生じたディレクトリだけを追加します。

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   └── health/route.ts
│   ├── onboarding/page.tsx
│   ├── organizations/[organizationSlug]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── entities/[businessEntityId]/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── changes/[changeSetId]/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── components/
│   ├── general/
│   ├── layout/
│   └── pages/
│       └── business-workspace/
│           ├── entity-list/
│           ├── entity-detail/
│           ├── change-editor/
│           ├── diff-review/
│           └── impact-result/
├── constants/
├── types/
└── lib/
    ├── domain/
    └── server/
```

`business-workspace`配下の分割例は、
[MVP画面構成とユーザーフロー](../../screens-and-user-flow.md)の画面状態に対応します。
すべてのディレクトリを先に空で作成せず、最初の利用箇所と同時に追加します。

### 3.1 コンポーネントの分類

| 配置 | 責務 | 依存してよい範囲 |
|---|---|---|
| `components/general` | Button、Dialog、Badgeなど、業務やページを知らない汎用部品 | 型、部品固有の定数、ほかのgeneral部品 |
| `components/layout` | AppShell、Header、Sidebarなど、複数画面で共有する配置 | general、layout内の部品 |
| `components/pages/<page>` | ページ固有の表示、画面状態、業務要素との接続 | general、layout、対象ページの型・定数・処理 |

依存方向は`pages → layout → general`を基本とします。`general`からページ固有または
業務固有のコードをimportしません。`layout`から特定ページのコードもimportしません。

同じページ内でも、一覧、詳細、編集、差分確認、影響結果のように独立して変更される単位は
サブディレクトリへ分けます。ページ固有コンポーネントを、再利用される可能性だけを理由に
早い段階で`general`へ移動しません。

### 3.2 `app`ディレクトリ

- `page.tsx`は入力となるURL状態とサーバーデータを取得し、ページ固有コンポーネントを
  組み立てる。
- `layout.tsx`はルート階層で共有するUI、metadata、fontなどを組み立てる。
- `(auth)`のようなroute groupは、URLを変えずにlayoutや責務を分ける場合だけ使う。
- URLで識別・共有する主リソースには`[organizationSlug]`、`[businessEntityId]`のような
  dynamic segmentを使い、一つの`page.tsx`へqueryで複数リソースを切り替える構造にしない。
- `loading.tsx`、`error.tsx`、`not-found.tsx`は、利用者が回復方法を判断できる単位で置く。
- `route.ts`は外部クライアント、Webhook、Health checkなどHTTP境界が必要な場合だけ使う。
- App Routerの予約ファイル以外をroute segmentへ置く場合は、`_components`や`_lib`などの
  private folderを使い、ルーティング対象ではないことを明示する。

## 4. ファイルとexport

- Next.jsの予約ファイル名は、フレームワークの規約に従う。
- 通常のファイルとディレクトリはkebab-case、React ComponentはPascalCase、Hookは
  `use`で始まる名前を使用する。
- 再利用するComponent、関数、定数はnamed exportを基本とする。
- `page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx`など、Next.jsがdefault exportを
  要求する境界ではdefault exportを使用する。
- importは`@/`aliasを使い、離れた階層への`../../../`を作らない。
- 広範囲のbarrel exportはServerとClientの境界や依存元を分かりにくくするため作らない。
  同じ責務内で公開対象が明確な場合だけ、局所的な`index.ts`を使用できる。
- テストは対象コードと同じ責務へ置き、`<name>.test.ts`または`<name>.test.tsx`とする。

## 5. 型定義

手書きするアプリケーションの型定義は、`src/types`を正本とします。一つの`types.ts`へ
集約せず、ドメインまたは利用境界で分けます。

```text
src/types/
├── business-entity.ts
├── change-set.ts
├── impact.ts
└── components/
    ├── general.ts
    ├── layout.ts
    └── business-workspace.ts
```

- 同じ型を複数のComponentや処理から参照する場合は、最初から`src/types`へ置く。
- Component Propsの型も`src/types/components`へ置き、同じ画面または責務に属する型を
  適切な粒度でまとめる。小さなPropsごとに一ファイルを作らない。
- ドメイン型、表示用のView Model、入力型、Server Actionの結果型を区別する。
- `any`は禁止する。型が分からない外部入力は`unknown`として受け取り、検証または型の絞り込み後に
  使用する。
- 値から導出できるunion型は、定数を`as const`で定義して生成し、値と型を重複管理しない。
- DrizzleやNext.jsが生成または推論する型は、同じ形の型を`src/types`へ複製しない。
  アプリケーション境界で別の意味を持つ場合だけ、明示的な型へ変換する。
- 型だけをimportする場合は、実行時依存と区別できる形にする。

短い関数内で推論でき、ほかから参照されない一時的な型まで、無理に名前付き型として
切り出しません。`src/types`へ置くのは、アプリケーションの契約として名前を持つ型です。

### 5.1 `any`の例外

外部libraryに型が存在しない、移行途中の境界を一時的に接続するなど、ほかの型で安全に
表現できないことを確認した場合だけ、`any`を例外的に使用できます。

- 使用範囲を一つの式または一つの行まで狭める。
- `@typescript-eslint/no-explicit-any`をファイル全体で無効化しない。
- 対象行の直前で`eslint-disable-next-line`を使用し、`--`以降に必要な理由を記載する。
- 一時対応の場合は、型を置き換えられる終了条件も説明する。
- `any`を別の型としてそのままアプリケーション内部へ伝播させず、境界の直後で検証または
  変換する。

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 型定義のない外部SDKの返却値を境界で検証するため
const rawPayload: any = legacySdk.read();
```

理由のない無効化コメントと、不要になった無効化コメントはESLint errorとします。具体的な
設定は[Linter・Formatter設計](../linting-and-formatting.md)を参照してください。

## 6. 定数

意味を持つ文字列、数値、選択肢、対応表、制限値を処理内へ直接埋め込まず、定数として
管理します。

- 複数機能から使う定数は`src/constants`へ置き、`routes.ts`、`business-entity.ts`、
  `relations.ts`のように責務でファイルを分ける。
- 一つのページだけで共有する定数も、規模が増える場合は`src/constants/<page>`へ分ける。
- 一つのComponentだけが使う定数は、そのComponentのmodule scopeへ置く。
- ルート、業務要素種別、関係種別、表示ラベル、探索上限、入力制限、状態とclassの対応表は
  定数化する。
- 環境ごとに変わる値は環境変数とサーバー側設定へ集約し、定数へ秘密情報を含めない。
- 定数名は値ではなく意味を表し、名前を付けても意図が増えない自明な`0`、`1`、空文字まで
  機械的に定数化しない。
- 型、選択肢、表示ラベルの正本が複数にならないよう、一つの定数から必要な値を導出する。

## 7. Server ComponentとClient Component

- `useState`、`useEffect`、event handler、browser APIが必要になるまで、`"use client"`を
  追加しない。
- `"use client"`は、そのファイル以下のimportをClient bundleへ含める境界として扱い、
  ページ全体や大きなlayoutへ付けない。
- Client Componentを`async function`として定義しない。データはServer Componentで取得して
  渡すか、必要なHTTP境界から取得する。
- Server ComponentからClient Componentへ渡すPropsは、Reactがserializeできるplain object、
  array、文字列、数値、真偽値などに限定する。`Date`、`Map`、class instanceは境界で変換する。
- server専用moduleとclient専用moduleを分け、必要に応じて`server-only`または`client-only`で
  誤importを検出する。
- Client Componentへ、操作に不要な大きなデータや秘密情報を渡さない。
- Client状態は利用する最も近い共通親へ置き、必要性が確認されるまでglobal stateを追加しない。

## 8. データ取得と更新

- Server Componentの読み取りは、同じアプリケーションのRoute HandlerをHTTP経由で呼ばず、
  server側のserviceまたはrepositoryを直接呼ぶ。
- 独立した複数の読み取りを直列に`await`せず、`Promise.all`、コンポーネント分割、Suspenseを
  使って不要なwaterfallを避ける。
- UIからの更新はServer Actionを入口とし、入力検証、serviceの呼び出し、再検証または
  cache更新に責務を絞る。
- Server Action内へ業務判断や複数テーブルの更新手順を直接積み上げず、domain serviceへ渡す。
- Server Actionの入力はサーバー側で検証し、成功と想定内エラーを判定できる型付き結果を返す。
- Route Handlerは、Health check、外部クライアント、Webhook、HTTP cacheなどAPI境界が
  必要な場合だけ追加する。
- Next.js 15以降の`params`、`searchParams`、`cookies()`、`headers()`は非同期APIとして
  `await`する。
- Node.js Runtimeを標準とし、具体的な遅延要件と依存互換性を確認できない限りEdge Runtimeを
  指定しない。

## 9. Routing、URL、Client state

- 組織、選択中の業務要素、確定済み変更結果など、URL共有、再読み込み、戻る・進むで
  復元する主リソースはdynamic route segmentで表現する。
- 絞り込み、並べ替え、表示tabなど、主リソースを変えない任意の表示条件だけをsearch paramsで
  表現する。主リソースのIDをsearch paramsへ置かない。
- 編集中の内容、変更理由、差分確認、dialogの開閉など、未確定で一時的なUI状態はClient
  Component内に保持する。
- URLから導出できる状態を別のstateへ複製しない。
- Propsまたは既存stateから計算できる値を`useEffect`で同期せず、render中に導出する。
- Browser Historyへ残す必要がない細かな表示状態まで、search paramsへ追加しない。
- 共有シェルと認可境界は共通の`layout.tsx`へ置き、子routeの切り替えで再作成しない。
- 内部の通常移動は`Link`を使い、処理結果によって移動先が決まる場合だけ`redirect()`または
  `useRouter`を使う。
- `useSearchParams`を使うClient Componentは、静的表示全体をClient renderingへ移行させないよう
  適切なSuspense境界の内側へ置く。

## 10. エラー、Loading、Navigation

- 取得中、データなし、想定内エラー、予期しないエラーを区別する。
- 想定内の入力エラーや更新失敗は、利用者が修正または再試行できる型付き結果として扱う。
- 予期しない例外を握りつぶさず、最も近い`error.tsx`で回復操作を示す。
- 対象が存在しない場合は`notFound()`と`not-found.tsx`を使用する。
- 認可対象の存在を隠す必要がある場合も、権限エラーではなく`notFound()`で同じ応答にする。
- `redirect()`、`notFound()`などNext.jsが内部的にthrowするNavigation APIを、一般的な
  `try-catch`で握りつぶさない。
- dynamic routeには必要な粒度で`loading.tsx`を置き、共有layoutを残したまま遷移状態を示す。
- 内部遷移は`Link`またはNext.jsのNavigation APIを使い、通常のリンクをbuttonのclickだけで
  再現しない。

## 11. UI実装

- 操作にはbutton、移動にはlinkなど、目的に合うHTML要素を使う。
- keyboard操作、focus移動、accessible name、見出し階層をComponentの責務に含める。
- 画像は原則として`next/image`を使い、表示サイズと`alt`を明示する。
- fontは`next/font`からroot layoutまたは共有moduleで読み込み、Componentごとに重複して
  読み込まない。
- 見た目の実装は[CSSコーディング規約](css.md)に従う。

## 12. レビュー時の確認

- Componentがgeneral、layout、page固有の適切な層に置かれているか。
- `page.tsx`または一つのClient Componentへ責務と状態が集中していないか。
- 手書きの共有型が`src/types`、意味を持つ値が適切なscopeの定数になっているか。
- ServerとClientの境界が必要な位置まで狭められているか。
- 主リソースがqueryではなく適切なroute segmentで表現されているか。
- URL、Server data、Client stateに同じ状態を重複して持っていないか。
- 想定内エラーと予期しない例外に、それぞれ回復可能な扱いがあるか。
