# MVPテーブル設計

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | ネイティブ経費申請・コミュニケーションを含む現行MVPへ反映済み |
| 対象 | 現行MVPで永続化している23の認証・組織・業務ドメインテーブル |
| 設計レベル | 論理設計 |
| 最終更新日 | 2026-08-10 |

この文書では、MVPの中核フローに必要なテーブルと、その設計判断を定義します。
論理設計を正本とし、初期の物理実装にはPostgreSQLとDrizzle ORMを使用します。

この設計を現行MVPのmigrationとtransaction実装へ反映済みです。2026-08-10に、API接続なしで
経費申請を開始から承認、差し戻し、再申請、経理完了まで処理する9テーブルを追加しました。
同日に、外部連携なしで組織内の相談と案件共有を行う2テーブルを追加しました。
認証方式、組織権限、
組織分離、移行方針の詳細は
[認証・組織ワークスペース設計](authentication-and-organization.md)を参照してください。

サービスの機能は[要件定義](../requirements/README.md)、データの意味は
[ドメインモデルと影響判定要件](../requirements/domain-and-impact.md)、処理との関係は
[論理データフロー設計](data-flow.md)、物理実装の方針は
[MVP技術選定](technology/README.md)を参照してください。共有状態の競合とリセットは
[公開デモの状態管理](demo-state.md)で定義します。

## 2. 設計状態の区分

| 区分 | 意味 |
|---|---|
| 決定 | MVPの中核概念として、実装方式にかかわらず維持する判断 |
| 暫定 | MVPを単純に実装するための初期判断。実装結果に応じて変更できる |
| 保留 | 技術選定または検証結果がなければ決められない判断 |

## 3. テーブル設計方針

1. 認証はBetter Authの必須テーブル、業務データは業務グラフと変更履歴の4テーブル、
   業務定義と案件実行の9テーブル、コミュニケーションの2テーブルで扱う。
2. 現在状態と履歴を分け、一覧・詳細表示のたびに履歴を復元しなくてよい構造にする。
3. バージョンは変更確定時点の内容をスナップショットとして保持する。
4. 差分と影響候補は、保存済みデータから再現できる算出値として扱う。
5. 未確定の変更案は、保存要件が決まるまで永続化テーブルにしない。
6. 組織を業務データの所有境界とし、変更者だけをMVPの監査情報として記録する。
7. 列挙値はアプリケーションの定数と文字列で始め、変更頻度が分かるまで
   データベース固有の列挙型やマスターテーブルに固定しない。
8. 認証・所属のライフサイクルはBetter Authのcascadeに従い、業務ドメインの参照は
   `restrict`して意図しない削除を防ぐ。
9. 業務定義と公開versionを分け、案件は開始時点のversionへ固定する。
10. 項目値は定義済み項目を参照し、汎用JSONだけへ閉じ込めない。
11. 実担当者と業務上の担当役割をWorkItemに、実行者と業務上の役割をActivityに分けて記録する。
12. 案件配下の項目値、作業、承認、Activityは案件削除時にcascadeし、定義と実行中案件の参照は
    `restrict`する。
13. チャンネルとメッセージを外部providerに依存しない正規データとし、外部IDと同期状態は
    Connector実装時に別境界へ追加する。

方針1、3、4、6、8は決定事項です。現在内容の重複保持と論理データ型は
暫定事項です。

## 4. ER図

![現行MVPテーブルのER図](mvp-er-diagram.drawio.svg)

[mvp-er-diagram.drawio.svg](mvp-er-diagram.drawio.svg)は表示用SVGであると同時に、
draw.ioの編集情報を埋め込んだ図の正本です。VS Codeのdraw.io拡張、またはdraw.io互換の
エディターで直接編集します。

図中はテーブル名、PK・FK・UQ、物理型、列名、カーディナリティに限定します。NULL可否、CHECK、
複合制約と設計判断はこの文書で管理します。

現行ER図には、実装済みの認証・組織・業務ドメインの23テーブルを記載します。算出値、
未確定状態、初期データの供給元はテーブルではないため、本文で補足します。

### 4.1 ER図作成・更新ルール

既存図と追加図で表現が変わらないよう、次の形式を使用します。

- ファイル形式は`.drawio.svg`とし、表示用SVGへdraw.ioの編集情報を埋め込む。一時的な
  `.drawio`や画像だけのSVGを正本としてcommitしない。
- draw.ioが生成するER table shapeを使用し、全テーブルで同じ背景色、罫線、文字色、見出し高、
  行高を使用する。
- 物理型、物理列名、キー欄を分け、キー欄には`PK`、`FK`、`UQ`だけを記載する。
- テーブル名と列名は、Drizzle schemaとmigrationで使うsnake_caseの物理名に合わせる。
- 外部キーを持つ行から参照先の主キー行へ線を引き、FK側を0以上、参照先を必須の1として
  crow's footで表す。複数の外部キーを一本の線へまとめない。
- 図にはテーブル名、PK・FK・UQ、物理型、列名、カーディナリティだけを載せる。NULL可否、
  CHECK、複合一意制約、index、認可規則は本文で管理する。
- 認証、組織、業務ドメインなど責務の近いテーブルを近くに置き、線がテーブルを横切らない
  配置を優先する。線が多い場合も、関係を省略して見た目だけを整えない。
- 更新後はSVGとして表示できること、draw.ioで再編集できること、本文と全テーブル・列・関係が
  一致することを確認する。
- テーブル、列、外部キーを変更するPull Requestでは、schema、migration、この文書、ER図を
  同時に更新する。実装前の提案図は、現行図と混同しないファイル名と文書状態を付ける。

## 5. 論理データ型

| 論理型 | 用途 | PostgreSQL初期型 |
|---|---|---|
| ID | テーブル内で一意な識別子 | `uuid` |
| 文字列 | 種別、名称、短い理由 | `text` |
| 長文 | 業務要素の本文 | `text` |
| 整数 | 要素ごとのバージョン番号 | `integer` |
| 真偽値 | 入力必須などのフラグ | `boolean` |
| 日時 | 作成・更新・変更確定時刻 | `timestamptz` |

MVPの`content`は自由記述として`text`から始め、日時はUTCとして保存します。構造化された
項目単位の編集が必要になった場合に、列追加または`jsonb`への変更を検討します。

## 6. テーブル定義

### 6.1 認証・組織テーブル

Better Auth coreとorganization pluginが管理する次の8テーブルを使用します。列と用途の詳細は
[認証・組織ワークスペース設計](authentication-and-organization.md#91-認証テーブル)を正本とします。

| テーブル | 主な境界・制約 |
|---|---|
| `users` | 利用者。`email`は一意 |
| `sessions` | userとactive organizationを参照。`token`は一意 |
| `accounts` | password hashを保持。`(provider_id, account_id)`は一意 |
| `verifications` | Better Auth共通トークン |
| `organizations` | 業務データの所有組織。`slug`は一意 |
| `organization_memberships` | userとorganizationを関連付け、`owner`、`editor`、`viewer`を保持 |
| `invitations` | plugin必須schema。MVPでは作成権限を与えない |
| `rate_limits` | 認証APIの共有rate limit状態 |

### 6.2 `business_entities`

業務を構成する要素と、その現在内容を保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 業務要素の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `entity_type` | 文字列 | 不可 |  | `PROCESS`、`RULE`、`DOCUMENT`、`ROLE`、`SYSTEM` |
| `name` | 文字列 | 不可 |  | 表示名 |
| `description` | 文字列 | 可 |  | 要素の短い説明 |
| `current_content` | 長文 | 不可 |  | 現在有効な内容 |
| `created_at` | 日時 | 不可 |  | 作成日時 |
| `updated_at` | 日時 | 不可 |  | 現在内容または基本情報の更新日時 |

`current_content`は、画面表示を単純にするための暫定的な重複保持です。同じ内容を
`entity_versions`にもスナップショットとして保存し、変更確定時に一つのトランザクションで
整合させます。

### 6.3 `relations`

二つの業務要素間にある有向の関係を保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 関係の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `source_entity_id` | ID | 不可 | FK | 関係の起点となる業務要素 |
| `target_entity_id` | ID | 不可 | FK | 関係の終点となる業務要素 |
| `relation_type` | 文字列 | 不可 |  | 関係種別 |
| `created_at` | 日時 | 不可 |  | 作成日時 |

関係種別は`REQUIRES`、`REFERENCES`、`GOVERNED_BY`、`USES`、`OWNED_BY`、
`APPROVED_BY`、`PRODUCES`から始めます。関係の向きは影響候補の探索結果に関わるため、
起点と終点を入れ替えて同じ関係とは扱いません。

### 6.4 `entity_versions`

変更確定時点の業務要素の内容を、変更後も書き換えないスナップショットとして保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | バージョンの識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `business_entity_id` | ID | 不可 | FK | 対象となる業務要素 |
| `version_number` | 整数 | 不可 |  | 要素ごとに1から増加する番号 |
| `content` | 長文 | 不可 |  | 確定時点の内容 |
| `created_at` | 日時 | 不可 |  | バージョンの作成日時 |

初期状態も`version_number = 1`として保存します。MVPで変更履歴の対象とするのは`content`です。
名称、種別、説明も変更履歴へ含める必要が生じた場合に、スナップショット範囲を拡張します。

### 6.5 `change_sets`

一回の変更確定を、変更前と変更後のバージョンの組として保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 変更単位の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `changed_by_user_id` | ID | 不可 | FK | 変更を確定した利用者 |
| `business_entity_id` | ID | 不可 | FK | 変更対象の業務要素 |
| `before_version_id` | ID | 不可 | FK | 変更前のバージョン |
| `after_version_id` | ID | 不可 | FK | 変更後のバージョン |
| `reason` | 文字列 | 可 |  | 利用者が入力する変更理由 |
| `created_at` | 日時 | 不可 |  | 変更を確定した日時 |

初期バージョンは変更結果ではないため、対応する`change_sets`を作成しません。変更者は
Client入力ではなく、Server Actionで検証したsession userから決定します。

### 6.6 `workflow_definitions`

一つの業務目的と、根拠となるBusiness GraphのPROCESSを関連付けます。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 業務定義の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `definition_key` | 文字列 | 不可 | UQ | 組織内で安定した業務識別key |
| `name` | 文字列 | 不可 |  | 表示名 |
| `description` | 長文 | 不可 |  | 業務目的の説明 |
| `related_process_entity_id` | ID | 不可 | FK | 関連するPROCESSの`business_entities.id` |
| `created_at` | 日時 | 不可 |  | 作成日時 |

### 6.7 `workflow_versions`

公開時点の実行仕様を不変の版として保持します。案件は開始時のversionへ固定します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 業務versionの識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `workflow_definition_id` | ID | 不可 | FK | 対象の業務定義 |
| `version_number` | 整数 | 不可 | UQ | 定義内で1から増加する番号 |
| `status` | 文字列 | 不可 |  | `DRAFT`、`IN_REVIEW`、`PUBLISHED`、`RETIRED` |
| `published_at` | 日時 | 可 |  | 公開日時 |
| `created_at` | 日時 | 不可 |  | 作成日時 |

### 6.8 `workflow_field_definitions`

versionごとの構造化入力項目を定義します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 項目定義の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `workflow_version_id` | ID | 不可 | FK | 対象の業務version |
| `field_key` | 文字列 | 不可 | UQ | version内で安定した項目key |
| `label` | 文字列 | 不可 |  | 画面表示名 |
| `field_type` | 文字列 | 不可 |  | `TEXT`、`INTEGER`、`DATE` |
| `step_key` | 文字列 | 不可 |  | 入力または表示するstep |
| `is_required` | 真偽値 | 不可 |  | 必須入力か |
| `position` | 整数 | 不可 |  | 表示順。1以上 |
| `description` | 長文 | 可 |  | 入力補足 |

### 6.9 `workflow_step_definitions`

versionごとの実行step、担当役割、期限を定義します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | step定義の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `workflow_version_id` | ID | 不可 | FK | 対象の業務version |
| `step_key` | 文字列 | 不可 | UQ | version内で安定したstep key |
| `name` | 文字列 | 不可 |  | 表示名 |
| `step_type` | 文字列 | 不可 |  | `INPUT`、`TASK`、`APPROVAL`、`END` |
| `assigned_role` | 文字列 | 可 |  | このstepを担う業務役割 |
| `due_days` | 整数 | 可 |  | 作成時刻から期限までの暦日数 |
| `position` | 整数 | 不可 |  | 進行表示順。1以上 |

### 6.10 `workflow_cases`

一回開始された業務と、その現在状態、開始者、適用versionを保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 案件の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `workflow_version_id` | ID | 不可 | FK | 開始時に固定した業務version |
| `case_number` | 整数 | 不可 | UQ | 組織内で1から増加する表示番号 |
| `status` | 文字列 | 不可 |  | `DRAFT`、`RUNNING`、`WAITING`、`COMPLETED`、`REJECTED`、`CANCELLED`、`FAILED` |
| `current_step_key` | 文字列 | 不可 |  | 現在地を表すstep key |
| `initiated_by_user_id` | ID | 不可 | FK | sessionから決定した開始者 |
| `created_at` | 日時 | 不可 |  | 開始日時 |
| `updated_at` | 日時 | 不可 |  | 状態または案件データの最終更新日時 |
| `completed_at` | 日時 | 可 |  | 完了、却下、取消の確定日時 |

### 6.11 `case_field_values`

案件の構造化値を、適用versionの項目定義と対応付けて保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 項目値の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `case_id` | ID | 不可 | FK | 対象案件 |
| `field_definition_id` | ID | 不可 | FK | 値の意味と型を定める項目定義 |
| `value` | 長文 | 不可 |  | 正規化済みの保存値 |
| `updated_by_user_id` | ID | 不可 | FK | 最後に値を確定した利用者 |
| `updated_at` | 日時 | 不可 |  | 最終更新日時 |

初回実装は型ごとの物理列へ分けず、`value`へ文字列表現を保存します。日付は`YYYY-MM-DD`、金額は
10進整数文字列へ正規化し、サービス層がFieldDefinitionの型に基づいて検証します。

### 6.12 `work_items`

人が行う一つの作業と、実担当者、業務上の担当役割、期限を保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 作業の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `case_id` | ID | 不可 | FK | 対象案件 |
| `step_definition_id` | ID | 不可 | FK | 生成元のstep定義 |
| `title` | 文字列 | 不可 |  | 作業名 |
| `assigned_user_id` | ID | 不可 | FK | 実際に操作できる利用者 |
| `assigned_role` | 文字列 | 不可 |  | 案件上の担当役割snapshot |
| `status` | 文字列 | 不可 |  | `READY`、`IN_PROGRESS`、`COMPLETED`、`RETURNED`、`CANCELLED`、`SKIPPED` |
| `due_at` | 日時 | 可 |  | 対応期限 |
| `created_at` | 日時 | 不可 |  | 作成日時 |
| `completed_at` | 日時 | 可 |  | 終了日時 |

### 6.13 `approvals`

承認作業一回ごとの判断状態、理由、判断者を保持します。差し戻し後の再申請は同じ案件に
`attempt`を増やした新しいApprovalとして追加します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | 承認記録の識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `case_id` | ID | 不可 | FK | 対象案件 |
| `work_item_id` | ID | 不可 | FK/UQ | 対応する承認作業 |
| `attempt` | 整数 | 不可 |  | 同一案件内の申請回数。1以上 |
| `status` | 文字列 | 不可 |  | `PENDING`、`APPROVED`、`REJECTED`、`RETURNED`、`CANCELLED` |
| `decided_by_user_id` | ID | 可 | FK | 判断した利用者 |
| `reason` | 長文 | 可 |  | 判断理由 |
| `created_at` | 日時 | 不可 |  | 判断待ち作成日時 |
| `decided_at` | 日時 | 可 |  | 判断確定日時 |

### 6.14 `workflow_activities`

案件画面のActivityとして、利用者に説明する開始、提出、判断、遷移、完了を時系列で保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | Activityの識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `case_id` | ID | 不可 | FK | 対象案件 |
| `actor_user_id` | ID | 可 | FK | 実際の操作主体。システム処理ではNULL可 |
| `actor_role` | 文字列 | 可 |  | 操作時の業務上の役割snapshot |
| `activity_type` | 文字列 | 不可 |  | 機械判定用の操作種別 |
| `summary` | 文字列 | 不可 |  | 利用者向け要約 |
| `detail` | 長文 | 可 |  | 理由または処理結果 |
| `created_at` | 日時 | 不可 |  | 発生日時 |

Activityは利用者向けの業務履歴です。改変防止、認可文脈、前後状態を備えた`AuditEvent`とは
論理的に分け、完全監査が必要になった段階で別テーブルを追加します。

### 6.15 `communication_channels`

組織内で相談や案件共有を行うチャンネルを保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | チャンネルの識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `channel_key` | 文字列 | 不可 | UQ | 組織内で不変の内部key |
| `name` | 文字列 | 不可 |  | 利用者向け名称 |
| `description` | 長文 | 不可 |  | 相談・共有する内容の説明 |
| `created_at` | 日時 | 不可 |  | 作成日時 |
| `updated_at` | 日時 | 不可 |  | チャンネルまたは最終投稿の更新日時 |

`channel_key`はseedとアプリ内作成を識別するための内部値です。Slack channel IDやGoogle Chat
space IDは保存せず、外部連携を実装するときにConnector mappingへ保持します。

### 6.16 `communication_messages`

チャンネル内の本文、投稿主体、任意の案件参照を保持します。

| 列 | 論理型 | NULL | キー | 内容 |
|---|---|---|---|---|
| `id` | ID | 不可 | PK | メッセージの識別子 |
| `organization_id` | ID | 不可 | FK | 所有組織 |
| `channel_id` | ID | 不可 | FK | 投稿先チャンネル |
| `author_user_id` | ID | 可 | FK | ネイティブ投稿を行った認証済み利用者 |
| `author_display_name` | 文字列 | 不可 |  | 投稿時点の表示名snapshot |
| `message_type` | 文字列 | 不可 |  | `TEXT`、`CASE_SHARE`、`SYSTEM` |
| `body` | 長文 | 不可 |  | メッセージ本文 |
| `related_case_id` | ID | 可 | FK | 共有する案件 |
| `created_at` | 日時 | 不可 |  | 投稿日時 |
| `edited_at` | 日時 | 可 |  | 将来の編集日時。初回実装では常にNULL |

ネイティブ投稿では`author_user_id`をsessionから決定します。`author_display_name`は投稿主体を
後から説明できるsnapshotです。`author_user_id`がNULLとなるsystem messageまたは外部投稿は、
Connectorと監査要件を実装した段階で作成可能にします。

## 7. 関係と制約

### 7.1 必須の関係

- 15の業務ドメインテーブルはすべて`organizations.id`を参照する。
- `relations`のsource/targetは、`(organization_id, id)`で同じ組織の
  `business_entities`を参照する。
- `entity_versions`は、`(organization_id, business_entity_id)`で同じ組織の
  `business_entities`を参照する。
- `change_sets`は同じ組織・業務要素に属するbusiness entity、before version、after versionを
  複合外部キーで参照する。
- `change_sets.changed_by_user_id`は`users.id`を参照する。
- `workflow_definitions`は同じ組織のPROCESSを、`workflow_versions`は同じ組織の業務定義を参照する。
- FieldDefinitionとStepDefinitionは同じ組織のWorkflowVersionを参照する。
- Caseは同じ組織のWorkflowVersionと開始者を参照する。
- CaseFieldValue、WorkItem、Approval、Activityは同じ組織のCaseを参照する。
- CaseFieldValueは項目定義と更新者、WorkItemはstep定義と実担当者、Approvalは承認WorkItemと
  判断者、Activityは操作主体を参照する。
- CommunicationMessageは同じ組織のCommunicationChannelを必須参照し、案件共有では同じ組織の
  Caseだけを任意参照する。ネイティブ投稿は認証済みuserを参照する。
- 削除操作を追加するまでは、参照されている行の削除を拒否する。

### 7.2 必須の一意性と検証

- `relations`は`organization_id`、`source_entity_id`、`target_entity_id`、`relation_type`の
  組を一意にする。
- `entity_versions`は`organization_id`、`business_entity_id`、`version_number`の組を
  一意にする。
- `version_number`は1以上とする。
- 関係の起点と終点は異なる業務要素とする。
- 変更前と変更後には異なるバージョンを指定する。
- `organization_memberships.role`は`owner`、`editor`、`viewer`のいずれかとする。
- `workflow_definitions`は`(organization_id, definition_key)`、`workflow_versions`は
  `(organization_id, workflow_definition_id, version_number)`を一意にする。
- FieldDefinitionとStepDefinitionはそれぞれ`(organization_id, workflow_version_id, key)`を
  一意にする。
- `workflow_cases`は`(organization_id, case_number)`、`case_field_values`は
  `(organization_id, case_id, field_definition_id)`、`approvals`は
  `(organization_id, work_item_id)`を一意にする。
- version番号、案件番号、項目とstepの表示順、承認attemptは1以上、期限日数はNULLまたは0以上とする。
- 定義、案件、WorkItem、Approvalの状態と項目型、step型は6章に記載した値だけを許可する。
- `communication_channels`は`(organization_id, channel_key)`を一意にし、message typeは6.16に
  記載した値だけを許可する。

組織横断参照とversionの所属はPostgreSQLの複合外部キーでも拒否します。Server Actionと
サービス層でもsession、membership、organization IDを再検証し、DB制約だけへ依存しません。

### 7.3 暫定の検索索引

次の検索経路は実装時に必要性を確認し、主キー・一意制約で不足する場合だけ索引を追加します。

- `business_entities.entity_type`
- 各業務ドメインテーブルの`organization_id`
- `relations.source_entity_id`
- `relations.target_entity_id`
- `entity_versions.business_entity_id`と`version_number`
- `change_sets.business_entity_id`と`created_at`
- `workflow_definitions.organization_id`
- FieldDefinitionとStepDefinitionの`workflow_version_id`
- `workflow_cases.organization_id`と`status`、`initiated_by_user_id`
- `work_items.organization_id`と`status`、`assigned_user_id`、`case_id`
- `case_field_values.case_id`、`approvals.case_id`、`workflow_activities.case_id`と`created_at`
- `communication_channels.organization_id`と`name`
- `communication_messages.channel_id`と`created_at`、`related_case_id`

## 8. 変更確定時の更新単位

一回の変更確定では、次の処理を一つのトランザクションとして実行します。

1. 対象要素をlockし、現在バージョンが入力された`before_version_id`と一致することを確認する。
2. 変更後の内容を新しい`entity_versions`として追加する。
3. 変更前と変更後、session userを参照する`change_sets`を追加する。
4. `business_entities.current_content`と`updated_at`を更新する。
5. すべて成功した場合だけ確定し、途中で失敗した場合はすべて取り消す。

一致しない場合は何も更新せず、競合を表す型付き結果を返します。これにより、同じversionを
起点とする変更は一つだけが成功します。実装では対象の`business_entities`行を
`SELECT ... FOR UPDATE`でlockし、同一versionからの同時更新をintegration testで検証します。

### 8.1 サンプルリセットの更新単位

リセットでは、認可済みorganization IDに限定してメッセージとチャンネル、案件、項目・step定義、業務version、業務定義、
`change_sets`、`entity_versions`、`relations`、`business_entities`を参照制約に従って削除します。
その後、seedから業務知識、公開済み経費申請version、初期チャンネルを再作成します。削除から再作成までを一つの
トランザクションで実行し、リセット自体はChangeSetやActivityへ記録しません。他組織、利用者、
session、membershipは保持します。

### 8.2 案件操作の更新単位

申請、承認、差し戻し、再申請、却下、取消、経理完了は、対象組織と担当利用者を検証したうえで
案件単位にlockし、Case、CaseFieldValue、WorkItem、Approval、Activityを一つのtransactionで
更新します。処理済みWorkItemの再実行は何も更新せず競合結果を返します。

新規案件番号の採番と公開versionの選択は組織単位にlockします。外部APIを後で追加しても、API成功を
前提にこのtransactionの正規状態を組み立てず、外部同期状態は別境界で扱います。

## 9. 現時点でテーブル化しないデータ

| データ | 扱い | テーブル化する判断条件 |
|---|---|---|
| 影響候補と関係経路 | 関係グラフから都度算出 | 保存結果の再利用や説明履歴が必要になったとき |
| 差分 | 二つのバージョンから都度算出 | 算出コストまたは表示の再現性に問題が出たとき |
| 未確定の変更案 | 画面またはアプリケーション状態 | 更新後の復元や複数端末での継続が要件になったとき |
| サンプル初期状態 | 組織作成時にseedから生成 | 複数のサンプルを利用者が管理する要件が生じたとき |
| 種別マスター | アプリケーション定数 | 利用者による追加・変更が必要になったとき |
| 関係の変更履歴 | MVP対象外 | 関係自体の差分や復元が必要になったとき |
| 改変防止監査イベント | Activityとは分離してMVP対象外 | 前後状態、認可文脈、保持・export要件が確定したとき |
| 添付ファイル本体 | 領収書参照情報だけを項目値として保存 | ファイル容量、保管期間、virus scan、権限要件が確定したとき |
| 組織階層と業務役割割当 | 固定サンプルでは同一memberへ役割を割当 | 複数memberと職務分離を実装するとき |
| 営業日calendar | 期限は暦日で計算 | 休日、締め時刻、timezone別営業日が必要になったとき |

## 10. 流動的な更新のルール

- 実装に必要な最小限の列・制約から追加し、将来用途だけを理由に追加しない。
- 新しい業務要件が現在の15の業務ドメインテーブルで表現できない場合は、列追加、
  テーブル追加、算出処理の
  どれが最も単純かを比較する。
- テーブルまたは関係を変更したときは、この文書とER図を同じPull Requestで更新する。
- 永続データが存在する段階では、スキーマ変更と同時に移行方法も記載する。
- 実装が設計と異なる妥当な理由を持つ場合は、実装へ合わせて設計書を更新し、差を残さない。

## 11. 実装で確定した事項と保留事項

- Better Auth管理テーブルのUUIDはPostgreSQL既定値、業務ドメインのUUIDは
  `crypto.randomUUID()`を使って生成する。
- `content`はLFへ正規化したプレーンテキストとし、差分は行単位で算出する。
- 認証・組織schemaはBetter Auth CLI 1.6.26の生成結果を起点にし、Drizzle schemaとmigrationを
  reviewして物理名・外部キー・制約を確定する。
- 最初の経費申請では、一人の認証済みmemberを申請者、承認者、経理担当の固定サンプル担当にする。
  WorkItemとActivityには実利用者IDと業務役割を別々に保存し、後の再割当へ移行できる境界を保つ。
- 領収書はファイル本体ではなく参照情報から始め、期限はstep作成時刻からの暦日で計算する。
- Activityは画面表示用の業務履歴として実装し、完全なAuditEventとは分離する。
- `case_field_values.value`は文字列から始め、FieldDefinitionに基づくServer側検証を必須にする。
- チャンネルとメッセージはアプリ内の正規データとし、外部providerのID、認証、cursor、retry、
  同期状態は初回schemaへ含めない。

次はMVP後も保留します。

- 削除または無効化を導入する条件
- 複数memberの業務役割割当、上長判定、代理、職務分離
- 分岐、並列承認、待機、営業日、外部同期状態を表現する追加定義
- 関係自体の変更履歴を扱う条件
