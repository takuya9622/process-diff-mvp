# ローカル開発・デプロイ設計

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | MVP実装済み |
| 対象 | Docker Composeによるローカル開発、環境変数、Vercel Git連携CD、本番DB適用 |
| 最終更新日 | 2026-08-11 |

この文書では、[MVP技術選定](README.md)で採用した技術をローカルとVercelへ配置する方法を
定義します。端末固有の設定や個人の認証情報は扱いません。

## 2. 環境の分担

| 対象 | ローカル開発 | Vercel本番 |
|---|---|---|
| Next.js | Node.jsコンテナ | VercelのNode.js Runtime |
| PostgreSQL | PostgreSQLコンテナ | Neon Serverless Postgres |
| オーケストレーション | Docker Compose | Vercelが管理 |
| ソース | 作業中のローカルファイル | GitHubの`main` |
| 秘密情報 | Git管理外のローカル環境変数 | Vercel Environment Variables |

Dockerは開発環境の再現性を確保する目的で使用します。ローカルのコンテナイメージを
Vercelへ配布せず、VercelではNext.jsのフレームワーク検出とビルドを利用します。

## 3. Docker Composeの方針

- `web`サービスでNode.js LTS、npm、Next.js開発サーバーを実行する。
- `db`サービスで本番と互換性のあるPostgreSQLを実行する。
- コンテナ間の接続では、データベースのhostにComposeのサービス名`db`を使用する。
- PostgreSQLのデータはnamed volumeへ保存し、コンテナ再作成後も保持する。
- `web`は`db`のhealth check成功後に起動する。
- ソース変更はCompose Watchで同期し、`node_modules`と`.next`は同期対象から除外する。
- Node.jsとPostgreSQLはmajor versionを固定し、patch更新はイメージ再構築時に取り込む。
- `.dockerignore`でGit情報、依存関係、ビルド生成物、秘密情報をbuild contextから除外する。

Docker公式の[Next.jsコンテナ化ガイド](https://docs.docker.com/guides/nextjs/)と
[Compose Watchガイド](https://docs.docker.com/compose/how-tos/file-watch/)を初期構成の基準にします。

## 4. Vercelの継続的デプロイ

アプリケーションのbuildとdeployには、Vercel Hobbyの個人Git連携と組み込みCI/CDを使用します。
GitHub Actionsは、リリース前のProduction database適用ゲートだけに使用します。Vercel CLIを
使う別のアプリケーションdeploy workflowは作成しません。

```text
作業ブランチ ──PR──> develop ──リリースPR──> Production data gate ──merge──> main
     │                  │                            │                         │
     └ Preview          └ Preview                    └ migration / seed / verify └ Production
```

- VercelプロジェクトをGitHubリポジトリへ接続する。
- VercelのProduction Branchを`main`に設定する。
- `main`へマージされたcommitをProduction Deploymentとして自動デプロイする。
- `main`以外のブランチはPreview Deploymentとして扱う。
- `main`への直接pushは禁止し、`develop`からのリリースPull Requestだけを取り込む。
- リリースPull Requestのhead commitに対する`Production data gate`が成功するまでmergeしない。
- Vercelのbuild成功はデプロイの条件になるが、GitHub Actionsのrequired checkにはしない。
- デプロイ失敗時は原因を修正した新しいPull Requestを作成し、`main`を書き換えない。

この動作はVercelの[Git連携ドキュメント](https://vercel.com/docs/git)に基づきます。
Hobbyには個人Git連携と組み込みCI/CDが含まれますが、利用条件と上限は変更される可能性が
あるため、公開前に[Vercelのプラン](https://vercel.com/docs/plans)を再確認します。

## 5. 環境変数

- リポジトリにはキー名とダミー値だけを記載した`.env.example`を置く。
- ローカルの実値はGit管理外の`.env.local`またはCompose用のenv fileへ保存する。
- VercelのPreviewとProductionでは、Vercel上のEnvironment Variablesを使用する。
- `DATABASE_URL`はローカルPostgreSQLとNeonで値を分け、アプリケーションコードは共通化する。
- `BETTER_AUTH_SECRET`は32文字以上の高entropy値を環境ごとに分け、`.env.example`には
  ダミー値だけを記載する。
- `BETTER_AUTH_URL`はlocalとProductionの実originを明示する。Previewで未設定の場合は、
  Vercelがbuildとruntimeへ提供する`VERCEL_BRANCH_URL`、または`VERCEL_URL`からHTTPS originを
  組み立てる。trusted originsは追加が必要な実originだけを明示し、wildcardを使用しない。
- `NEXT_PUBLIC_`を付ける変数には、ブラウザへ公開してよい値だけを設定する。
- `.vercel`ディレクトリとVercelのtoken、project IDをコミットしない。

## 6. 本番DB適用ゲート

- ローカルmigrationはDocker Compose上のPostgreSQLへ適用する。
- Production migrationをVercelのbuild commandへ含めない。
- GitHubの`production` Environmentに`PRODUCTION_DATABASE_URL` secretを一度だけ設定する。
- branch protectionでは`Apply migrations, seed, and verify`を`main`のrequired checkにする。
- Production databaseへ接続するworkflowは、`develop`から`main`へのリリースPull Request、または
  障害復旧用の手動実行だけに限定する。
- 既存のProductionアプリケーションと両立しない破壊的変更は、一回のデプロイで行わない。

### 6.1 リリース時の順序

1. migrationをreviewし、現在稼働中のアプリケーションと後方互換な追加変更であることを確認する。
2. `develop`から`main`へのリリースPull Requestを作成する。
3. workflowがリリースPull Requestの40文字のhead commit SHAをcheckoutする。
4. `npm run db:migrate`で未適用migrationだけをProduction databaseへ適用する。
5. `npm run db:seed:all`で全組織の初期業務、経費申請workflow、初期channelの不足分だけを補う。
6. `npm run db:verify`でmigrationの件数・hash・適用時刻と、全組織のseed状態を確認する。
7. gateが成功した同じcommitを`main`へmergeし、VercelのProduction Deploymentを待つ。
8. `/api/health`がHTTP 200を返し、認証後に業務スペースを表示できることを確認する。

`db:seed:all`は冪等かつ追加的に実行し、利用者が変更した業務データを上書きしません。既存組織に
初期業務が存在しないなど安全に補完できない状態では失敗し、リリースを止めます。削除を伴う
`db:reset`は本番適用手順では使用しません。

### 6.2 障害復旧と失敗時

既にコードが公開され、migrationまたはseedだけが未適用の場合は、`Production data gate`を
`workflow_dispatch`から手動実行します。入力には適用対象の完全な40文字commit SHAを指定し、
実行後にdatabase検証と`/api/health`を再確認します。

適用途中で失敗した場合は`main`へmergeしません。databaseを安易に巻き戻さず、失敗原因を修正した
追加migrationまたはseedで前進させます。将来、既存columnやtableの削除が必要になった場合は、
追加・移行・参照切替・削除を複数リリースへ分けるexpand and contract方式を使用します。

## 7. ローカル確認

環境構築後は、少なくとも次を確認します。

1. `docker compose config`が成功する。
2. `docker compose up --watch`で`web`と`db`が起動する。
3. ブラウザからNext.jsの画面を表示できる。
4. `web`からPostgreSQLへ接続できる。
5. コンテナ内でlint、format check、buildを再実行できる。
6. migrationとseedを適用後、Vitestのintegration testを実行できる。
7. 公式Playwrightコンテナから中核フローのE2Eテストを実行できる。
8. 利用者登録、サインイン、onboarding、サインアウトと組織分離を確認できる。
