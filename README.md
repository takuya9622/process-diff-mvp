# process-diff-mvp

業務要素の変更履歴と関係を管理し、差分と影響候補を確認するためのMVPです。

設計の入口は[docs/README.md](docs/README.md)を参照してください。

## 必要な環境

- Docker Desktop
- Docker Compose 2.22以降
- Git

Node.js、npm、PostgreSQLはコンテナ内で実行するため、ホストへの個別インストールは不要です。

## ローカル起動

リポジトリルートで次を実行します。

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
```

本番ビルドは開発サーバーと同じ`.next`を同時に更新しないよう、別コンテナで実行します。

```bash
docker compose run --rm --build --no-deps web npm run build
```

コンテナを常駐させずに確認する場合は、同様に`docker compose run --rm --build --no-deps web`へ
各npm commandを続けて実行できます。

## 環境変数

[.env.example](.env.example)はローカル開発用のダミー値です。値を変更する場合は`.env`へ
コピーし、`.env`はコミットしません。

VercelのPreviewとProductionでは、Vercel上のEnvironment Variablesを使用します。
