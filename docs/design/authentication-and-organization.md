# 認証・組織ワークスペース設計

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | file-based routing構造は実装済み・認証と組織境界は実装前 |
| 対象 | Better Authによるパスワード認証、組織、権限、組織別データ分離 |
| 最終更新日 | 2026-08-09 |

この文書は、認証と組織ワークスペースを追加する次期MVPの設計正本です。現行実装との差分を
明確にするため、実装済みの4テーブルを記録する[MVPテーブル設計](table-design.md)とは
分けて管理します。file-based routingと共有layoutは先行して実装済みです。認証・組織境界の
実装時は、要件と画面導線を同じPull Requestで関連文書へ反映します。

## 2. 解決する課題

現行アプリケーションは、誰でも同じ共有デモを操作できます。そのため、利用者が操作中に
次のことを理解しにくい状態です。

- 自分がどの組織の、どの立場で操作しているか
- 変更した内容が誰の業務データに属するか
- 誰が変更を確定したか
- このサービスが、どの担当者のどの判断を便利にするか

次期MVPでは、主な利用者を「組織内で業務ルールや手順の変更を担当する業務改善担当者・
業務オーナー」と定めます。提供価値は、次の一文を画面上でも理解できる状態にします。

> 自分の組織の業務ルールを変えたとき、確認が必要な文書・業務・システムを洗い出せる。

## 3. 用語と境界

| 用語 | 意味 |
|---|---|
| 利用者 | Better Authで認証される個人。`users`で識別する |
| 組織 | 業務データを所有する境界。画面では「業務スペース」と表現する |
| 組織ロール | 業務スペースに対する`owner`、`editor`、`viewer`のアクセス権限 |
| 業務上の役割 | 申請者や承認者など、業務グラフ内の`BusinessEntity`の一種である`ROLE` |

組織ロールと業務上の役割は別概念です。画面では前者を「アクセス権限」、後者を「業務上の
役割」と表記し、同じ「役割」だけで表現しません。

## 4. MVPの設計決定

### 4.1 採用範囲

- Better Authのemail/password認証を使用する。
- Better Authのorganization pluginを使用し、組織、所属、active organizationを管理する。
- 認証・組織テーブルも既存のPostgreSQLとDrizzle ORMで管理する。
- UUIDを全テーブルの識別子へ使用する。
- 一つの組織に属する業務グラフ、変更履歴、サンプルリセットをほかの組織から分離する。
- 変更確定時に認証済み利用者を`ChangeSet`の変更者として記録する。
- 組織ロールは静的な`owner`、`editor`、`viewer`とし、動的ロールは導入しない。

利用者が提示した`users`、`organizations`、`organization_memberships`を中核にしますが、
Better Authがセッションとパスワード資格情報を安全に管理するために必要なテーブルと列を
追加します。パスワードは`users`へ保存せず、Better Authの`accounts`へハッシュとして保存します。

### 4.2 MVPで扱わない範囲

- メールアドレス確認
- パスワード再設定とメール送信
- OAuth、SSO、passkey、MFA
- 組織への招待、メンバー管理、ロール変更の画面
- 複数組織の作成・切り替え画面
- チーム、動的ロール、課金
- 組織の削除
- 変更者以外を含む完全な監査ログ

メール送信基盤がない状態で確認・再設定を形だけ追加しません。MVPでは未確認メールでも
サインインでき、パスワードを失うと復旧できない制約を明示します。外部評価の範囲を広げる
前に、メール確認とパスワード再設定を必須の次段階として実装します。

### 4.3 段階的な実装状態

file-based routingへの移行を認証・schema変更より先に実施します。現段階では
`/organizations/shared-demo`を一時的な組織routeとし、entity route、change route、共有layout、
Not Found境界を実装します。

`shared-demo`は現在の共有サンプルをrouteへ載せるための固定slugであり、認可済み組織を意味しません。
業務データも引き続き一つの共有状態です。Better Authと組織schemaを追加する段階で、固定slugの
判定をsessionとmembershipによる組織解決へ置き換え、Repositoryをorganization IDで限定します。

## 5. 認証と初回セットアップ

### 5.1 認証設定

| 項目 | 決定 |
|---|---|
| 認証方式 | email/passwordのみ |
| サインアップ | 公開。名前、メールアドレス、パスワード、確認入力を必須にする |
| パスワード長 | 12文字以上128文字以下 |
| サインアップ後 | 自動サインインし、組織セットアップへ移動する |
| メール確認 | 無効。`email_verified`はfalseのまま扱う |
| パスワード再設定 | MVPでは提供しない |
| レート制限 | Better Authの組み込み制限を有効にし、PostgreSQLへ状態を保存する |

ログイン失敗時は、メールアドレスの存在を推測しにくい共通メッセージを表示します。重複
メールのサインアップは再ログインを案内しますが、内部エラーや資格情報は表示しません。

### 5.2 初回セットアップを分ける理由

認証アカウント作成と、組織・所属・サンプル業務の作成は別の処理です。`/sign-up`成功後に
`/onboarding`へ進め、組織名を入力させます。これにより、組織作成だけが失敗しても認証
アカウントを重複作成せず、セットアップを再開できます。

### 5.3 初回セットアップの処理

1. セッションを検証し、利用者に組織所属がないことを確認する。
2. 組織名からURL用slug候補を生成し、一意になるまで短いランダムsuffixを付ける。
3. organization pluginで組織と`owner`所属を作成する。
4. 作成した組織をactive organizationへ設定する。
5. その組織だけのサンプル業務、関係、初期versionを作成する。
6. `/organizations/<organizationSlug>`へ移動する。

組織作成とseed作成は、再実行しても二重seedにならないよう冪等にします。Better Authの組織
作成と既存ドメインseedを完全に同一トランザクションへ統合できない場合は、組織に
`workspace_status = provisioning | ready | failed`相当の状態を持たせるのではなく、seedの
存在確認から再開できる処理にします。追加状態列が本当に必要かは実装検証で判断します。

一人の利用者が作成できる組織はMVPでは一つです。organization pluginの作成許可を、所属が
ない利用者にだけ与えます。複数組織のデータ構造は維持しますが、画面と操作は追加しません。

## 6. 画面とURL

### 6.1 URL設計

| URL | 公開範囲 | 内容 |
|---|---|---|
| `/sign-in` | 未認証 | メールアドレスとパスワードでサインイン |
| `/sign-up` | 未認証 | 名前、メールアドレス、パスワードで登録 |
| `/onboarding` | 認証済み | 初回の組織名入力と業務スペース作成 |
| `/organizations/[organizationSlug]` | 所属者 | 組織別workspaceの入口。初期業務要素へ移動、またはデータなし状態を表示 |
| `/organizations/[organizationSlug]/entities/[businessEntityId]` | 所属者 | 組織内の業務要素を参照・編集 |
| `/organizations/[organizationSlug]/changes/[changeSetId]` | 所属者 | 組織内の確定済み変更結果を参照 |
| `/api/auth/[...all]` | Better Auth | 認証Route Handler |
| `/api/health` | 公開 | 秘密情報を返さない稼働確認 |

`/`は入口判定だけを行います。未認証なら`/sign-in`、所属なしなら`/onboarding`、所属が
一つならその組織へ移動します。組織routeは基準業務要素があればそのentity routeへ移動し、
データがなければworkspaceのデータなし状態を表示します。将来複数所属を許可したときだけ
組織選択画面を追加します。

主リソースの識別はqueryではなくApp Routerのdynamic route segmentへ置きます。search paramsは
将来の絞り込み、並べ替え、表示tabなど、リソースを識別しない任意の表示条件にだけ使用します。
編集内容、変更理由、差分確認、ダイアログ開閉は未確定のClient stateとし、URLへ含めません。

```text
src/app/
├── (auth)/
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── onboarding/page.tsx
└── organizations/[organizationSlug]/
    ├── layout.tsx
    ├── page.tsx
    ├── loading.tsx
    ├── not-found.tsx
    ├── entities/[businessEntityId]/
    │   ├── page.tsx
    │   └── loading.tsx
    └── changes/[changeSetId]/
        ├── page.tsx
        └── loading.tsx
```

URLのslugやクライアントから渡されたorganization IDは認可根拠にしません。サーバーで組織を
解決し、ログイン利用者のmembershipを確認してからデータを取得します。存在する別組織のURLを
開いた場合も、組織の存在を漏らさないようNot Foundとして扱います。

### 6.2 アプリケーションシェル

`organizations/[organizationSlug]/layout.tsx`を組織ワークスペースの共有境界とします。layoutで
sessionとmembershipを検証し、ヘッダーと業務要素ナビゲーションを表示します。子routeの
Server Componentは認可済みorganization IDで対象リソースを取得します。layoutの検証だけを
更新処理の認可根拠にはせず、Server Actionでもsession、membership、permissionを再検証します。

ヘッダーへ次を常時表示します。

- 組織名と「業務スペース」ラベル
- `あなた: <利用者名>`
- `アクセス権限: オーナー / 編集者 / 閲覧者`
- 「業務ルールを変えたとき、確認が必要な文書・業務・システムを洗い出す」という価値説明
- サインアウト操作

変更結果には変更者名と変更日時を表示します。サンプルは架空データであることを示しますが、
「全員で共有される」という現行の警告は削除します。

## 7. 権限設計

Better Auth organization pluginの静的Access Controlへ、業務スペース用resourceを追加します。
クライアント側の表示制御は操作性のために使い、認可の正本は必ずサーバー側に置きます。

| 操作 | `owner` | `editor` | `viewer` |
|---|:---:|:---:|:---:|
| 業務要素・関係・変更履歴の参照 | 可 | 可 | 可 |
| 業務要素の変更確定 | 可 | 可 | 不可 |
| 組織サンプルのリセット | 可 | 不可 | 不可 |
| 組織設定・メンバー管理 | 将来可 | 不可 | 不可 |

Access Controlのresource/actionは次から始めます。

- `workspace: read, change, reset`
- `organization: manage`

`owner`はすべて、`editor`は`workspace.read`と`workspace.change`、`viewer`は
`workspace.read`だけを持ちます。Better Auth既定のorganization権限が必要な`owner`には、
既定statementも統合します。動的Access Control用テーブルは作成しません。

MVPの画面から作成される最初の利用者は全員`owner`です。`editor`と`viewer`は将来の招待機能
に備えた権限境界として実装し、integration testではfixture membershipで検証します。

## 8. サーバー側の認証・認可境界

### 8.1 Next.js内の責務

- `app/api/auth/[...all]/route.ts`でBetter AuthのGET/POST handlerを公開する。
- Server ComponentsとServer Actionsでは、request headersからセッションを検証する。
- 組織layoutで未認証・未セットアップ状態を振り分け、organization slugからmembershipを検証する。
- entity pageとchange pageは、非同期の`params`を`await`して識別子を取得する。
- Server Componentは、認可済みorganization IDをサービス層へ渡してPostgreSQLを直接読む。
- 変更確定とリセットは、Server Action内でセッション、membership、permissionを再検証する。
- 存在しない、または所属者から参照できない組織・業務要素・変更結果は`notFound()`で扱う。
- `redirect()`と`notFound()`は一般的な`try-catch`で握りつぶさない。
- `proxy.ts`を追加する場合も事前redirectだけに使い、セキュリティ境界にはしない。

共通関数の責務は次のとおりです。

| 関数 | 責務 |
|---|---|
| `requireSession()` | セッションを検証し、認証済みuserを返す |
| `requireOrganizationMembership(slug)` | 組織を解決し、membershipとroleを返す |
| `requireOrganizationPermission(slug, permission)` | membership確認後に必要権限を検証する |

Client Componentから`user_id`、`role`、`organization_id`を渡しても信頼しません。変更者は
検証済みsessionから、組織は検証済みmembershipから決定します。

### 8.2 データアクセス規則

- 一覧、詳細、履歴、影響探索は、必ずorganization IDを入力として受け取る。
- ID単独でdomain rowを取得するRepository関数を公開しない。
- 別組織のIDが渡された場合は、存在しない場合と同じ結果を返す。
- 変更確定トランザクション内でも、対象要素とversionのorganization IDを再検証する。
- リセットは現在の組織のdomain rowだけを削除し、利用者、membership、ほかの組織へ作用しない。

## 9. 論理テーブル設計

### 9.1 認証テーブル

Better Authのmodel名とfield名を既存の複数形・snake_caseへ対応付けます。CLIで生成したDrizzle
schemaを起点にし、手書きで必須列を省略しません。

| テーブル | 主な列 | 用途 |
|---|---|---|
| `users` | `id`, `name`, `email`, `email_verified`, `image`, `created_at`, `updated_at` | 利用者プロフィール。`email`は一意 |
| `sessions` | `id`, `user_id`, `token`, `expires_at`, `active_organization_id`, `ip_address`, `user_agent`, timestamps | ログインセッション |
| `accounts` | `id`, `user_id`, `account_id`, `provider_id`, `password`, token関連列, timestamps | password資格情報。`provider_id = credential` |
| `verifications` | `id`, `identifier`, `value`, `expires_at`, timestamps | 将来の確認・再設定を含むBetter Auth共通トークン |
| `rate_limits` | `id`, `key`, `count`, `last_request` | serverless環境でも共有する認証rate limit |

`accounts.password`はBetter Authが生成・検証するハッシュだけを保持します。平文パスワードを
ログ、エラー、`users`、独自テーブルへ保存しません。

### 9.2 組織テーブル

独自実装でBetter Authと二重管理せず、organization pluginのschemaを次の物理名へ対応付けます。

| テーブル | 主な列 | 用途 |
|---|---|---|
| `organizations` | `id`, `name`, `slug`, `logo`, `metadata`, `created_at` | 業務データの所有境界。`slug`は一意 |
| `organization_memberships` | `id`, `organization_id`, `user_id`, `role`, `created_at` | 利用者の所属と静的ロール |
| `invitations` | `id`, `organization_id`, `email`, `role`, `status`, `expires_at`, `inviter_id` | plugin必須schema。MVPでは操作・送信しない |

`organization_memberships`は`(organization_id, user_id)`を一意にします。組織削除、招待、
メンバー管理のendpointはMVP画面から公開せず、組織削除はplugin設定でも無効にします。

### 9.3 業務ドメインテーブルの変更

| テーブル | 追加列 | 目的 |
|---|---|---|
| `business_entities` | `organization_id` | 業務要素の所有組織 |
| `relations` | `organization_id` | 組織をまたぐ関係を禁止し、安全に探索する |
| `entity_versions` | `organization_id` | version取得を組織内へ限定する |
| `change_sets` | `organization_id`, `changed_by_user_id` | 変更履歴の組織分離と変更者表示 |

4テーブルすべてへ`organization_id NOT NULL`を持たせます。`business_entities`だけへ持たせて
毎回joinする最小案は、検索条件の付け忘れが別組織データの漏えいにつながるため採用しません。

各テーブルは`(organization_id, id)`を一意にし、次の複合外部キーで同一組織を強制します。

- relationのsource/targetからbusiness entity
- entity versionからbusiness entity
- change setからbusiness entity、before version、after version

`change_sets.changed_by_user_id`は`users.id`を参照し、MVPの変更確定ではNULLを許可しません。
利用者削除は対象外とし、参照中のuser削除を拒否します。

### 9.4 次期ER図

認証・組織追加後の関係は
[編集可能な次期ER図](authentication-and-organization.drawio.svg)を正本と
します。実装時にDrizzle schemaとmigrationが確定した段階で、現行の
`mvp-er-diagram.drawio.svg`を置き換え、列・制約の差を残しません。

## 10. 組織別サンプル状態

- 初回セットアップ時に、組織専用の12業務要素、15関係、各初期versionを作成する。
- 別組織は同じ架空シナリオを持てますが、IDと変更履歴は共有しない。
- 同一組織内の変更競合は、現行どおり`before_version_id`とrow lockで検出する。
- `owner`だけが現在の組織を初期状態へリセットできる。
- リセットは組織内のdomain rowだけを削除・再作成し、認証・所属は保持する。
- E2E testは専用組織を作成し、グローバルなproduction dataをresetしない。

## 11. 現行データの移行

現行productionの業務データは、個人や組織へ帰属しない架空seedです。帰属先を推測して既存
userへ割り当てることはできないため、次の移行を採用します。

1. expansion migrationで認証・組織テーブルを追加し、domain tableへNULL可の新しい列を追加する。
2. 新アプリケーションをデプロイし、organization IDがない現行rowを画面とqueryから除外する。
3. cleanup migrationで現行4 domain tableのデモ行を削除する。
4. `organization_id`と`changed_by_user_id`をNOT NULLにし、複合外部キーを追加する。
5. 以後は初回セットアップ時に組織別seedを作成する。

この移行により、現行のentity/change URLとデモ変更履歴は失効します。実装時にはproduction
migration前に、架空デモ履歴を破棄してよいことをもう一度確認し、実行結果をリリースPull
Requestへ記録します。認証テーブルや実在データを同じreset処理で削除しません。

## 12. セキュリティ設計

- `BETTER_AUTH_SECRET`は32文字以上の高entropy値を環境ごとに設定し、commitしない。
- `BETTER_AUTH_URL`とtrusted originsをlocal、Preview、Productionごとに明示する。
- wildcard origin、CSRF check無効化、origin check無効化は使用しない。
- ProductionではHTTPS、secure、httpOnly、sameSite cookieを維持する。
- rate limitはProductionで有効にし、PostgreSQL storageを使用する。
- auth errorへSQL、token、secret、password hashを含めない。
- sessionまたはmembershipが失効したServer Actionは更新せず、再サインインを促す。

## 13. 失敗時の扱い

| 状況 | 画面・処理 |
|---|---|
| 未認証でprotected URLへアクセス | サインイン後の戻り先を保持して`/sign-in`へ移動 |
| 認証済みだが所属なし | `/onboarding`へ移動 |
| 別組織のURLまたはrow ID | 存在を漏らさずNot Found |
| 権限不足の変更・reset | 更新せず、権限不足の型付き結果を表示 |
| onboardingのseed失敗 | 組織を二重作成せず、再試行できる画面を表示 |
| session失効 | 入力を可能な範囲で残し、再サインインを案内 |

## 14. テスト方針

### 14.1 認証

- サインアップ、サインイン、サインアウト、session復元
- 不正な資格情報、重複email、password長の検証
- 未認証のprotected routeとServer Action拒否

### 14.2 組織と権限

- onboardingでorganization、owner membership、組織別seedが一度だけ作成される
- `owner`、`editor`、`viewer`の許可・拒否が表どおりになる
- Client側でroleやorganization IDを改ざんしてもServer Actionが拒否する
- 非memberが組織URLの存在を判別できない

### 14.3 組織分離

- user Aがuser Bのorganizationの一覧、詳細、履歴を取得できない
- 別組織のentity/version/change IDで変更を確定できない
- entity routeとchange routeのURLを直接入力しても、同じ組織内だけで復元できる
- 一組織のresetが別組織のdomain row、user、session、membershipへ影響しない
- ChangeSetへsession userが変更者として記録・表示される

Playwrightでは二つの独立browser contextと二組織を使い、URL直接入力とServer Actionの改ざんを
含めて検証します。integration testでは複合外部キーが組織横断参照を拒否することも確認します。

## 15. 実装順序

1. Better Auth core、Drizzle adapter、organization plugin、環境変数検証を追加する。
2. 認証・組織schemaを生成し、命名mappingとexpansion migrationをreviewする。
3. auth Route Handler、auth client、server-side guardを追加する。
4. sign-up、sign-in、onboarding、sign-outを実装する。
5. domain tableへorganization IDと変更者を追加し、全Repositoryを組織scopeへ変更する。
6. 組織layout、entity/change route、ヘッダー、変更者表示、role別UIを追加する。
7. 組織別seed・reset、cleanup migration、constraint追加を実装する。
8. 認証、権限、組織分離、既存中核フローをE2Eで検証する。

手順5の前に公開画面を認証必須へ切り替えません。認証済みでもdomain queryがglobalのままになる
中間状態を、本番へデプロイしないためです。

## 16. 実装時に確定する事項

次は設計方針を変えない、ライブラリ生成物や実装検証で確定する詳細です。

- Better AuthとDrizzle adapterの導入時点の正確なversion
- 生成schemaにおけるindex・外部キー名
- onboarding再試行の実装に追加状態列が必要か
- Vercel Previewごとのtrusted origin設定方法
- 認証rate limitのpath別閾値

## 17. 参照する公式仕様

- [Better Auth Database](https://better-auth.com/docs/concepts/database)
- [Better Auth Drizzle ORM Adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next)
- [Better Auth Email & Password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth Rate Limit](https://better-auth.com/docs/concepts/rate-limit)
- [Better Auth Security](https://better-auth.com/docs/reference/security)
