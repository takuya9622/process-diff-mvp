# process-diff-mvp

組織の業務知識を一つのワークスペースで参照・理解し、編集時には差分と影響候補を確認しながら
安全に変更するためのMVPです。

設計の入口は[docs/README.md](docs/README.md)を参照してください。

## 必要な環境

- Docker Desktop
- Docker Compose 2.22以降
- Git

Node.js、npm、PostgreSQLはコンテナ内で実行するため、ホストへの個別インストールは不要です。

## 初回セットアップ

リポジトリルートでPostgreSQLを起動し、migrationを適用します。

```bash
docker compose up -d db
docker compose run --rm --build web npm run db:migrate
```

起動後に新規登録し、組織名を入力すると、その組織専用の架空サンプルが自動作成されます。
サンプルを初期状態へ戻せるのは組織のオーナーだけです。通常は画面右上の「サンプルを初期化」を
使用します。補助スクリプトを使う場合は、対象組織UUIDを明示してください。

```bash
docker compose run --rm -e ORGANIZATION_ID=<organization-uuid> web npm run db:reset
```

## ローカル起動

初回セットアップ後、次を実行します。

```bash
docker compose up --watch
```

起動後に次へアクセスします。

- アプリケーション: <http://localhost:3000>
- Health check: <http://localhost:3000/api/health>

初回はNode.jsとPostgreSQLのイメージ取得、npm依存関係のインストールを行うため時間がかかります。

## 停止

```bash
docker compose down
```

PostgreSQLのデータも削除して初期化する場合だけ、次を実行します。

```bash
docker compose down --volumes
```

## ローカル確認

起動中のコンテナで確認する場合は次を実行します。

```bash
docker compose exec web npm run lint
docker compose exec web npm run format:check
docker compose exec web npm run typecheck
docker compose exec web npm test
docker compose exec web npm run test:integration
```

本番ビルドは開発サーバーと同じ`.next`を同時に更新しないよう、別コンテナで実行します。

```bash
docker compose run --rm --build --no-deps web npm run build
```

コンテナを常駐させずに確認する場合は、同様に`docker compose run --rm --build --no-deps web`へ
各npm commandを続けて実行できます。

中核フローのE2Eテストは、公式Playwrightイメージを使う専用サービスで実行します。

```bash
docker compose --profile test run --rm --build e2e
```

このテストは専用アカウントの登録、組織作成、変更、差分、影響候補、関係経路、サインアウト・
再ログイン、別組織URLの拒否、組織別の再初期化までをChromiumで確認します。

## 環境変数

[.env.example](.env.example)はローカル開発用のダミー値です。値を変更する場合は`.env`へ
コピーし、`.env`はコミットしません。

- `BETTER_AUTH_SECRET`: 32文字以上。Productionでは高entropyのランダム値を使用する
- `BETTER_AUTH_URL`: アプリケーションの公開origin。localとProductionでは必須。Vercel Previewは
  未設定の場合に`VERCEL_BRANCH_URL`または`VERCEL_URL`から自動設定する
- `BETTER_AUTH_TRUSTED_ORIGINS`: 追加で許可するoriginをカンマ区切りで指定する。wildcard不可

VercelのPreviewとProductionでは、Vercel上のEnvironment Variablesを使用します。
