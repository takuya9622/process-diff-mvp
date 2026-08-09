# MVP技術選定

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 現行MVP実装済み・認証基盤は実装前の設計決定 |
| 対象 | MVPのアプリケーション、認証、バックエンド、永続化、UI基盤 |
| 最終更新日 | 2026-08-09 |

### 1.1 文書構成

| 文書 | 読む場面 | 状態 |
|---|---|---|
| この文書 | MVP全体の技術構成と各技術の利用境界を確認するとき | 初期決定 |
| [ローカル開発・デプロイ設計](local-development-and-deployment.md) | Docker環境、環境変数、Vercel Git連携を設定・変更するとき | 初期決定 |
| [Linter・Formatter設計](linting-and-formatting.md) | ESLint、Prettier、VS Code連携を設定・変更するとき | 初期決定 |
| [コーディング規約](coding-standards/README.md) | Next.jsとCSSの責務、配置、コメント、分割基準を確認するとき | 初期決定 |

この文書では、要件定義、論理データフロー、テーブル設計を実装するための技術スタックと
利用境界を定義します。

MVPの検証中に変更できる設計としますが、依存技術を変更するときは、採用理由と影響範囲を
この文書へ反映してから実装を変更します。パッケージの正確なバージョンはプロジェクト作成時に
固定し、この文書では製品名と利用方針を管理します。

## 2. 選定方針

1. 個人・非商用のMVPを無料枠で公開できることを優先する。
2. フロントエンドとバックエンドを一つのNext.jsプロジェクトで管理する。
3. MVPの中核フローを短期間で実装でき、不要な運用対象を増やさない。
4. Server Componentsを基本とし、ブラウザへ送るJavaScriptと実行時依存を抑える。
5. 変更確定時の複数テーブル更新を、データベーストランザクションで整合させる。
6. 特定サービスの無料枠を超えた場合に、責務を分離して移行できる構造にする。

## 3. 採用技術

| 分類 | 採用技術 | 状態 | 主な用途 |
|---|---|---|---|
| ホスティング | Vercel Hobby | 条件付き採用 | Next.jsアプリケーションの公開 |
| Webフレームワーク | Next.js App Router | 採用 | 画面、Server Components、バックエンド |
| 言語 | TypeScript | 採用 | フロントエンドとバックエンドの共通言語 |
| サーバー実行環境 | Vercel上のNode.js Runtime | 採用 | データ取得、変更確定、グラフ探索 |
| CSS | Tailwind CSS | 採用 | レイアウト、テーマ、レスポンシブ表示 |
| アニメーション | Motion | 採用 | 状態遷移、差分、影響経路の視覚表現 |
| データベース | Neon Serverless Postgres | 初期採用 | 現在状態、関係、バージョン、変更単位 |
| ORM・マイグレーション | Drizzle ORM・Drizzle Kit | 初期採用 | 型付きクエリ、スキーマ、SQL migration |
| 認証・組織 | Better Auth・organization plugin | 追加採用 | email/password認証、session、組織、membership、静的権限 |
| パッケージ管理 | npm | 採用 | 依存関係とlockfileの管理 |
| ローカル実行環境 | Docker Compose | 採用 | Next.jsとPostgreSQLの再現可能な開発環境 |
| Linter | ESLint・eslint-config-next | 採用 | Next.js、React、TypeScriptの問題検出 |
| Formatter | Prettier・prettier-plugin-tailwindcss | 採用 | コードと文書の整形、Tailwind classの並び順統一 |
| ローカルテスト | Vitest・React Testing Library・Playwright | 初期採用 | ドメインロジックと中核フローの検証 |

OAuth、SSO、MFA、動的RBAC、別バックエンド、メッセージキュー、キャッシュサーバー、
リアルタイム通信基盤はMVPへ導入しません。

## 4. Vercelの採用条件

### 4.1 Hobbyプランの利用範囲

Vercel Hobbyは無料ですが、[公式ドキュメント](https://vercel.com/docs/plans/hobby)と
[利用規約](https://vercel.com/legal/terms)では、個人・非商用利用に限定されています。

本プロジェクトでは、個人がコンセプトを確認する非商用MVPの間だけHobbyを利用します。
次のいずれかに該当した時点で、Vercel Proへの移行または別ホスティングを再検討します。

- 企業または顧客の業務として利用する。
- 有料サービス、営業活動、継続的な商用検証へ利用する。
- 複数人でVercelプロジェクトを共同管理する必要がある。
- 無料枠の上限または実行時間制限がMVP検証を妨げる。

無料枠の数値は変更される可能性があるため、この文書へ固定値を転載しません。公開前と
利用状況の変化時に、公式のHobbyプランと[Limits](https://vercel.com/docs/limits)を確認します。

### 4.2 デプロイ方式

- 静的書き出しではなく、Vercel上でNext.jsのサーバー機能を利用する。
- GitHubリポジトリとVercelプロジェクトを接続し、`main`を本番デプロイ対象とする。
- `main`への更新をVercelのGit連携で自動デプロイし、別のデプロイ用CIは追加しない。
- Preview DeploymentはPull Requestの画面確認に利用できるが、CIの必須化は行わない。
- Vercel Functionのファイルシステムやプロセスメモリを永続化先として使わない。
- Functionとデータベースは、選択可能な範囲で近いリージョンへ配置する。

Next.jsのサーバー機能を使う理由は、静的書き出しではServer Actionsや動的なRoute Handlersを
利用できないためです。Vercel Functionsではリクエスト間でメモリを共有できず、ファイルへの
永続的な書き込みも前提にできません。

ローカルではDocker Composeを使用し、VercelにはコンテナイメージではなくGitHub上の
Next.jsプロジェクトを直接デプロイします。環境の分担、環境変数、ブランチとデプロイの
対応は[ローカル開発・デプロイ設計](local-development-and-deployment.md)で定義します。

## 5. Next.js内の責務分担

### 5.1 Server Componentsを標準とする

`app`配下の画面とレイアウトは、Next.jsの標準どおりServer Componentsから始めます。
データベースを参照する一覧・詳細・履歴表示は、サーバー側のサービスまたはRepositoryを
直接呼び出します。

Server Componentから同じアプリケーションのRoute HandlerをHTTP経由で呼び出しません。
不要な通信を避け、共通のサービス層を直接利用します。この方針はNext.jsの
[Backend for Frontendガイド](https://nextjs.org/docs/app/guides/backend-for-frontend)に合わせます。

### 5.2 Client Componentsの利用範囲

次の機能だけをClient Componentsとして実装します。

- 業務要素の入力と未確定の変更案
- 変更前後を対話的に確認する差分表示
- 影響候補と関係経路の選択、展開、フォーカス操作
- Motionを使うアニメーション
- ブラウザAPIを必要とする処理

`"use client"`を画面全体へ付けず、操作が必要な末端コンポーネントへ境界を限定します。

### 5.3 更新処理

画面から行う変更確定とサンプルリセットにはServer Actionsを利用します。

1. Server Actionが入力を受け取る。
2. サーバー側で入力値と対象データを検証する。
3. ドメインサービスが変更内容と次のバージョンを決定する。
4. Drizzleを通してPostgresのトランザクションを実行する。
5. 対象画面のデータを再検証し、更新後の表示を返す。

Server Actionsは画面専用の更新境界として使います。外部クライアントから利用するAPIが
必要になった場合だけ、`app/api`配下へRoute Handlersを追加します。画面ごとに同じ処理を
Server ActionとRoute Handlerへ重複実装しません。

### 5.4 App RouterによるSPA遷移

MVPはNext.js App Routerのfile-based routingを使用します。組織を
`/organizations/[organizationSlug]`、業務要素を
`/organizations/[organizationSlug]/entities/[businessEntityId]`、確定済みの変更結果を
`/organizations/[organizationSlug]/changes/[changeSetId]`のdynamic route segmentで表現します。
組織配下の`layout.tsx`を共有アプリケーションシェルとし、`Link`によるclient-side
transitionでページ全体を再読み込みせずに子routeを切り替えます。

SPAであることを理由に、画面全体を一つのClient Componentにしません。routeごとの初期表示と
確定済みデータはServer Componentsで取得し、未確定の変更案、差分確認、ダイアログなど、
操作中だけ必要な範囲をClient Componentsで管理します。dynamic routeには必要に応じて
`loading.tsx`を置き、共有layoutを維持したまま遷移中の状態を示します。

search paramsは絞り込み、並べ替え、表示tabなど、リソースを識別しない任意の表示条件にだけ
使用します。未確定の編集内容はブラウザ内状態だけに保持します。routeと状態の境界、
ブラウザの戻る・進むの扱いは
[MVP画面構成とユーザーフロー](../screens-and-user-flow.md)で定義します。

### 5.5 Better Authの利用境界

Better Auth core、Drizzle adapter、organization pluginを同じNext.js applicationへ追加します。
認証方式はemail/passwordだけを有効にします。認証・組織の詳細は
[認証・組織ワークスペース設計](../authentication-and-organization.md)を正本とします。

- `/api/auth/[...all]/route.ts`だけをBetter AuthのRoute Handlerとして公開する。
- Server ComponentsとServer Actionsは、`headers()`からsessionを検証する。
- organization pluginのmodelを`organizations`と`organization_memberships`へ対応付ける。
- 静的Access Controlで`owner`、`editor`、`viewer`を定義し、動的roleは使用しない。
- protected layoutは画面遷移を制御するが、取得・更新ごとの認可を省略しない。
- `proxy.ts`を使用する場合もcookieによる事前redirectだけとし、認可境界にしない。

Server Componentsは認可後にservice層を直接呼び、認証済み画面から同一applicationのRoute
HandlerをHTTP経由で呼びません。Server Actionsはclientから渡されたuser、role、organization
IDを信頼せず、sessionとmembershipから確定します。

## 6. 永続化とデータ処理

### 6.1 Neon Serverless Postgres

既存の4テーブルは外部キー、一意制約、複数行の原子的更新を必要とするため、PostgreSQLを
採用します。Vercelでは[MarketplaceのNeon integration](https://vercel.com/marketplace/neon)から
接続でき、認証情報を環境変数として設定できます。
NeonにはMVPで利用可能な[無料プラン](https://neon.com/pricing)があります。

採用理由は次のとおりです。

- テーブル設計をそのままリレーショナルモデルとして実装できる。
- 変更確定時に`business_entities`、`entity_versions`、`change_sets`を一つの
  トランザクションで更新できる。
- サーバーレス環境向けの接続方式とスケール・トゥ・ゼロを利用できる。
- Vercel Marketplaceから接続でき、別のバックエンドサービスを運用する必要がない。

無料枠の上限はVercelとは別に管理されます。データベース利用量も公開前に確認します。

### 6.2 Drizzle ORM

Drizzle ORMとDrizzle Kitを使い、次をリポジトリ内で管理します。

- TypeScriptによるテーブルスキーマ
- アプリケーションから使う型付きクエリ
- SQL migrationファイル
- 制約と索引の変更履歴

接続driverには`postgres`（postgres.js）を採用します。ローカルPostgreSQLとNeonで同じ
Drizzle実装を使用でき、変更確定時のtransactionと行lockを一つのsessionで実行できるためです。
サーバーレス環境で接続数を増やさないよう、アプリケーションインスタンスごとの接続上限は
`1`とし、prepared statementは無効にします。

### 6.3 状態の配置

| 状態 | 配置 | ブラウザ更新後 |
|---|---|---|
| 現在の業務グラフ | Neon Postgres | 保持する |
| バージョンと変更単位 | Neon Postgres | 保持する |
| 利用者、session、組織、membership | Neon Postgres | 保持する |
| 未確定の変更案 | Client Componentの状態 | 保持しない |
| 差分 | 変更前後の内容から算出 | 再算出する |
| 影響候補と関係経路 | 確定済みグラフから算出 | 再算出する |
| サンプル初期状態 | リポジトリ内のseed | 必要時に復元する |

確定前の入力はブラウザ更新で失われてもよいものとし、自動保存は追加しません。確定済みの
変更内容と履歴はデータベースへ保存し、ブラウザ更新後も確認できるようにします。

業務グラフ、version、変更単位はorganization IDで分離します。同じ組織の同じ要素への古い
versionを基準とした更新は競合として拒否し、リセット時は現在の組織の履歴だけを削除して
seedから初期状態を再作成します。詳細は
[組織別サンプル状態の管理](../demo-state.md)で定義します。

## 7. CSS選定

### 7.1 Tailwind CSSとEmotionの比較

| 観点 | Tailwind CSS | Emotion |
|---|---|---|
| App Routerとの相性 | 静的CSSを生成し、Server Componentsでそのまま利用できる | CSS-in-JSの実行環境とClient Component境界を考慮する必要がある |
| ブラウザ実行時コスト | CSS生成はビルド時で、スタイル用ランタイムを追加しない | 動的なスタイル生成用ランタイムを追加する |
| 導入経路 | Next.js向けの公式導入ガイドがある | 公式SSR文書は汎用ReactとPages Router中心である |
| 動的表現 | CSS変数、状態クラス、Motionと組み合わせる | propsに基づく動的スタイルを直接記述しやすい |
| 記述の特徴 | classが長くなりやすい | コンポーネントとスタイルを同じファイルへまとめやすい |
| MVPでの追加価値 | レイアウトを速く作り、サーバー描画を保ちやすい | Motionと役割が重なり、導入コストに対する利点が小さい |

Tailwind CSSを採用し、Emotionは導入しません。

Tailwindは[Next.js向け公式ガイド](https://tailwindcss.com/docs/installation/framework-guides/nextjs)が
あり、生成結果はゼロランタイムの静的CSSです。一方、EmotionではNext.js App Routerと
React Server Componentsへの対応要望が、公式リポジトリの
[#2928](https://github.com/emotion-js/emotion/issues/2928)と
[#2978](https://github.com/emotion-js/emotion/issues/2978)で未解決です。

本MVPでは、動的な視覚表現をMotionへ集約できます。Emotionを併用するより、Tailwindで
Server Componentsを維持し、必要な箇所だけMotionのClient Componentにする方が責務を
分けやすいと判断します。

### 7.2 Tailwind CSSの運用方針

- 色、余白、角丸、文字サイズなどの基本値はCSS変数として定義する。
- Tailwindのutility classは、レイアウトと状態が読み取れる範囲で直接記述する。
- 長いclassの組が複数箇所で同じ意味を持つ場合は、React Componentへまとめる。
- 一度しか使わない短いスタイルを、独自classや抽象Componentへ不必要に分割しない。
- class名を不完全な文字列連結で動的生成せず、列挙可能な状態は明示的に対応付ける。
- `globals.css`はデザイントークン、リセット、全体共通の最小限の規則に限定する。

## 8. Motionの利用方針

Motionは状態変化の理解を助ける目的で使います。装飾のために画面全体を常時動かしません。

- 通常のClient Componentでは`motion/react`を使用する。
- React Server Componentsから直接使える箇所では`motion/react-client`を検討する。
- ページ全体ではなく、差分行、選択要素、影響経路など必要な単位へ適用する。
- `prefers-reduced-motion`を尊重し、動きを減らしても情報が失われないようにする。
- 色またはアニメーションだけで、追加・削除・影響候補を区別しない。
- TailwindとMotionが同じ要素の`transform`を競合して管理しないよう、必要に応じて
  ラッパー要素で責務を分ける。

Motionはサーバー生成HTMLと互換性があり、React Server Components向けのimport方法も
[公式ドキュメント](https://motion.dev/docs/react-motion-component)に記載されています。

## 9. LinterとFormatter

品質検査にはESLint、整形にはPrettierを採用し、責務を分離します。Tailwind classの並び順は
`prettier-plugin-tailwindcss`へ統一し、競合するESLintの整形規則は
`eslint-config-prettier`で無効化します。

設定ファイル、VS Code連携、npm script、ローカル確認の詳細は
[Linter・Formatter設計](linting-and-formatting.md)を参照してください。

## 10. テスト方針

GitHub ActionsによるCIは導入しませんが、ローカルで再実行できるテストは用意します。

- Vitestで、関係グラフ探索、重複排除、並び順、バージョン採番などの純粋な
  TypeScriptロジックを単体テストする。
- React Testing Libraryは、入力、差分の識別、キーボード操作など、Client Componentの
  振る舞いを確認する必要がある箇所だけに使う。
- Playwrightで、一覧、編集、差分確認、変更確定、影響候補、リセットまでの中核フローを
  E2Eテストする。
- Playwrightの独立browser contextを使い、サインアップ、サインイン、onboarding、組織分離、
  role別権限をE2Eテストする。
- async Server Componentsは単体テストで無理に再現せず、PlaywrightのE2Eで確認する。
- 大量のsnapshot testは作成せず、利用者が認識する結果と操作を検証する。

Next.jsの[公式テストガイド](https://nextjs.org/docs/app/guides/testing)も、Vitestを単体テスト、
PlaywrightをE2Eテストの選択肢とし、async Server ComponentsにはE2Eを推奨しています。

## 11. 依存関係とバージョンの管理

- プロジェクト作成時点の安定版を使用し、`package-lock.json`で正確なバージョンを固定する。
- Node.jsのバージョンは、採用するNext.jsとVercelが対応するLTSへ固定する。
- `latest`を実行時設定やドキュメント上の固定バージョンとして扱わない。
- メジャーアップデートは機能実装と分け、`chore/`ブランチで互換性を確認する。
- 直接利用しないパッケージや、将来用途だけの状態管理・UIライブラリを追加しない。

## 12. MVPで導入しない技術

- Express、NestJSなどの別バックエンドフレームワーク
- Emotionを含む別のCSS-in-JSランタイム
- Reduxなどのグローバル状態管理ライブラリ
- Redis、メッセージキュー、常駐Worker
- WebSocketを使うリアルタイム同期機能
- 外部IdP、OAuth、SSO、MFA、動的RBAC
- 本格的な監視、分散トレーシング、外部ログ基盤
- GitHub ActionsによるCI
- ESLintと役割が重複するstyle rule集、eslint-plugin-prettier

必要性が確認できた場合だけ、要件と責務を定義してから追加します。

## 13. 実装で確定した事項

- DrizzleからPostgreSQLへの接続にはpostgres.jsを使い、変更確定はtransactionと
  `SELECT ... FOR UPDATE`で直列化する。
- `content`は5,000文字以内のプレーンテキストとし、外部ライブラリを追加せず
  Longest Common Subsequenceに基づく行単位差分を算出する。

これらは中核技術の採用を変えずに実装または検証で判断できるため、現時点では固定しません。
