# Linter・Formatter設計

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 初期決定 |
| 対象 | ESLint、Prettier、Tailwind class整形、VS Code連携 |
| 最終更新日 | 2026-08-09 |

この文書では、[MVP技術選定](README.md)で採用したLinterとFormatterの構成、責務、
開発時の実行方法を定義します。

## 2. 責務の分離

| 責務 | 採用技術 | 運用方針 |
|---|---|---|
| 品質と不具合の検出 | ESLint | Next.js、React、React Hooks、TypeScriptの規則を検査する |
| コードと設定の整形 | Prettier | TypeScript、TSX、JSON、CSSなどの表記を統一する |
| Tailwind classの並び順 | prettier-plugin-tailwindcss | Tailwind推奨順へ自動整形する |
| ESLintとの競合回避 | eslint-config-prettier | Prettierと競合するESLintの整形規則を無効化する |

ESLintは不具合につながる記述やフレームワーク規約の違反を検出し、Prettierは空白、改行、
引用符などの表記を整えます。同じ整形を二つのツールへ担当させません。

## 3. ESLintの構成

- ESLint CLIとflat config形式の`eslint.config.mjs`を使用する。
- `eslint-config-next/core-web-vitals`を基礎とする。
- TypeScript用の`eslint-config-next/typescript`を併用する。
- `eslint-config-prettier/flat`を設定配列の後方へ追加し、整形規則の競合を防ぐ。
- 初期段階では、用途が重複する包括的なESLint pluginやstyle rule集を追加しない。
- 例外規則はファイル全体へ広げず、必要な理由と最小の対象範囲を明示する。

Next.jsの[公式ESLint構成](https://nextjs.org/docs/app/api-reference/config/eslint)に従い、
`next lint`ではなくESLint CLIを使用します。Next.jsが提供する
`core-web-vitals`と`typescript`の設定を使い、Next.js、React、React Hooks、TypeScriptの
推奨規則を個別に組み直しません。

## 4. Prettierの構成

- PrettierをdevDependencyへ追加し、`package-lock.json`でバージョンを固定する。
- `prettier.config.mjs`を正本とし、個人のVS Code設定へ整形規則を分散させない。
- 初期設定はPrettierの標準設定を基本とし、具体的な必要性がある項目だけ上書きする。
- Tailwind Labsの
  [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)を使い、
  Tailwind classの順序を手作業で管理しない。
- `.prettierignore`では`.next`、`coverage`などの生成物と`docs`を除外する。
- `eslint-plugin-prettier`は導入せず、PrettierをESLintの規則として実行しない。

`docs`はトークン効率を考慮した独自の分割・改行基準を持ち、PrettierによるMarkdown tableの
機械的な再整形が大きな無関係差分を生むため、Prettierの対象外とします。文書は
[設計ドキュメントの管理方針](../../README.md)に従って確認します。

Prettierの[Linter連携ガイド](https://prettier.io/docs/integrating-with-linters.html)は、
整形をPrettier、コード品質をLinterへ分け、競合規則を
`eslint-config-prettier`で無効化する構成を推奨しています。`eslint-plugin-prettier`を
使わないことで、同じ整形処理の二重実行、診断表示の増加、lintの低速化を避けます。

## 5. VS Codeとの連携

実装開始時に、公開リポジトリへ端末非依存の`.vscode/extensions.json`と
`.vscode/settings.json`を追加します。

- 推奨拡張として[Prettier for VS Code](https://github.com/prettier/prettier-vscode)の
  `esbenp.prettier-vscode`と[VS Code ESLint](https://github.com/microsoft/vscode-eslint)の
  `dbaeumer.vscode-eslint`を記載する。
- 既定Formatterを`esbenp.prettier-vscode`とし、保存時整形を有効にする。
- 保存時のcode actionで`source.fixAll.eslint`を`explicit`として実行する。
- VS Code拡張に内蔵されたPrettierではなく、プロジェクトにインストールしたバージョンと
  pluginを使用する。
- 個人の絶対パス、端末名、グローバルPrettierの場所はリポジトリへ記載しない。

これにより、VS CodeのPrettier拡張から保存時に整形した結果と、コマンドで確認した結果を
一致させます。拡張を使用しない開発環境でも、npm scriptから同じ検査を再現できます。

## 6. npm scriptとローカル確認

実装開始時に次のscriptを`package.json`へ定義します。

| script | コマンド | 目的 |
|---|---|---|
| `lint` | `eslint .` | lint違反の検出 |
| `lint:fix` | `eslint . --fix` | 安全に自動修正できるlint違反の修正 |
| `format` | `prettier . --write` | 対象ファイルの整形 |
| `format:check` | `prettier . --check` | ファイルを変更せず整形漏れを検出 |

CIは導入しないため、Pull Requestを作成する前に`npm run lint`と
`npm run format:check`を実行します。機能変更では、対象に応じたテストと`npm run build`も
実行し、結果をPull Requestへ記載します。
