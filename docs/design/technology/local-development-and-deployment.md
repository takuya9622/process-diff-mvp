# ローカル開発・デプロイ設計

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 初期決定 |
| 対象 | Docker Composeによるローカル開発、環境変数、Vercel Git連携CD |
| 最終更新日 | 2026-08-09 |

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

Vercel Hobbyの個人Git連携と組み込みCI/CDを使用します。GitHub ActionsやVercel CLIを使う
別のデプロイworkflowは作成しません。

```text
作業ブランチ ──PR──> develop ──リリースPR──> main
     │                  │                       │
     └ Preview          └ Preview               └ Production
```

- VercelプロジェクトをGitHubリポジトリへ接続する。
- VercelのProduction Branchを`main`に設定する。
- `main`へマージされたcommitをProduction Deploymentとして自動デプロイする。
- `main`以外のブランチはPreview Deploymentとして扱う。
- `main`への直接pushは禁止し、`develop`からのリリースPull Requestだけを取り込む。
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
- `NEXT_PUBLIC_`を付ける変数には、ブラウザへ公開してよい値だけを設定する。
- `.vercel`ディレクトリとVercelのtoken、project IDをコミットしない。

## 6. migrationとデプロイの境界

- ローカルmigrationはDocker Compose上のPostgreSQLへ適用する。
- Production migrationをVercelのbuild commandへ含めない。
- Production migrationは内容を確認したうえで明示的に実行し、実行結果をリリースPull Requestへ
  記録する。
- 既存のProductionアプリケーションと両立しない破壊的変更は、一回のデプロイで行わない。

## 7. ローカル確認

環境構築後は、少なくとも次を確認します。

1. `docker compose config`が成功する。
2. `docker compose up --watch`で`web`と`db`が起動する。
3. ブラウザからNext.jsの画面を表示できる。
4. `web`からPostgreSQLへ接続できる。
5. コンテナ内でlint、format check、buildを再実行できる。
