# 組織別サンプル状態の管理

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 実装前の追加設計 |
| 対象 | 認証後MVPの組織別サンプル、競合、リセット |
| 最終更新日 | 2026-08-09 |

この文書では、認証・組織追加後のサンプル状態の所有単位と、変更競合、サンプルリセットを
定義します。永続化する構造は[MVPテーブル設計](table-design.md)、認証と権限の境界は
[認証・組織ワークスペース設計](authentication-and-organization.md)、画面上の操作は
[MVP画面構成とユーザーフロー](screens-and-user-flow.md)を参照してください。

## 2. 状態の所有単位

次期MVPでは、一つの共有サンプル状態を終了し、組織ごとに独立した状態を保持します。

- `BusinessEntity`、`Relation`、`EntityVersion`、`ChangeSet`は必ず一つの組織に属する。
- 別組織は同じ架空シナリオから開始しても、row ID、現在状態、履歴を共有しない。
- 利用者はmembershipを持つ組織の状態だけを参照・更新できる。
- 変更確定は同じ組織のほかの所属者から見えるが、別組織からは見えない。
- サンプルリセットは現在の組織の業務データだけへ作用する。

組織名、利用者名、アクセス権限をヘッダーへ表示し、利用者が状態の所有者と自分の立場を
常に確認できるようにします。

## 3. 初期状態の作成

初回onboardingで組織を作成した後、
[サンプル業務と検証シナリオ](sample-business-scenario.md)の初期状態をその組織へ作成します。

- 12件の業務要素
- 15件の関係
- 各業務要素の`version_number = 1`
- 変更確定前のため`ChangeSet`は0件

seedの各rowには作成対象organization IDを設定します。固定するのはサンプル内の論理的な
対応だけで、組織間で同じUUIDを使い回しません。

onboardingの再試行で二重作成しないよう、組織内に初期業務要素が存在するかを確認してから
作成します。一部だけ作成された状態を残さないよう、4 domain tableのseedは一つの
PostgreSQL transactionで作成します。

## 4. 入力制限

認証済みであっても、更新境界へ無制限の入力を渡しません。Server Actionで次を検証します。

| 入力 | 最大長 | 補足 |
|---|---|---|
| `content` | 5,000文字 | 空文字と現在内容と同一の値も拒否する |
| `reason` | 500文字 | 任意入力。空白だけの場合は未入力として扱う |

改行コードをLFへ統一し、文字列全体の前後にあるUnicode空白だけを除去してから、Unicode
code point単位で文字数を数えます。文字列内部の空白と改行は保持します。HTMLを実行せず、
`content`と`reason`はプレーンテキストとして表示します。

## 5. 変更競合

同じ組織の所属者が同じ業務要素を同時に変更した場合、古い内容を上書きしません。

1. 編集開始時の`before_version_id`を未確定の変更案とともに保持する。
2. Server Actionがsession、membership、`workspace.change`権限を検証する。
3. 対象要素と`before_version_id`が現在の組織に属することを検証する。
4. transaction内で対象の`business_entities`行をlockする。
5. 現在の最新versionが`before_version_id`と一致することを確認する。
6. 一致する場合だけ、新version、変更者を含む`ChangeSet`、現在内容を更新する。
7. 一致しない場合は何も更新せず、競合を表す型付き結果を返す。

競合時は「ほかの変更が反映されています。最新内容を確認してから、もう一度変更してください」
と表示します。利用者が入力した変更案はClient stateへ残し、最新内容と比較できるようにします。

異なる組織の変更は完全に独立します。同じ組織でも異なる業務要素への変更は、それぞれ独立した
transactionとして許可します。

## 6. サンプルリセット

### 6.1 権限と対象

`owner`だけがリセットできます。対象は現在の組織に属する次のrowです。

- 現在の`BusinessEntity`
- `Relation`
- 初期versionを含む`EntityVersion`
- すべての`ChangeSet`

次は削除しません。

- `User`、`Session`、`Account`
- `Organization`、`OrganizationMembership`
- ほかの組織の業務データと変更履歴

### 6.2 実行規則

1. 利用者へ、現在の組織の変更内容と変更履歴が削除されることを確認する。
2. Server Actionがsession、membership、`workspace.reset`権限を再検証する。
3. transaction内で、現在のorganization IDに一致する変更履歴、version、関係、業務要素を
   参照制約に従う順序で削除する。
4. 同じorganization IDを設定したseedから、業務要素、関係、初期versionを再作成する。
5. すべて成功した場合だけcommitする。

リセット自体を`ChangeSet`として記録せず、リセット前の履歴は保持しません。リセットによって
削除された`BusinessEntity`または`ChangeSet`のURLを開いた場合は、対象が利用できないことを
表示し、現在の組織の初期選択へ戻れる操作を示します。

## 7. 変更確定とリセットの同時実行

変更確定とリセットは、途中状態が見えないよう、どちらもdatabase transactionで実行します。
リセットは現在のorganization IDに属する対象だけを直列化し、別組織の更新を待たせません。

要件は次のとおりです。

- 変更確定の一部だけがリセット後に残らない。
- リセット途中の空状態を別requestが現在状態として取得しない。
- リセット完了後は、その組織に初期version以外の履歴が存在しない。
- 競合またはlock待ちの失敗を部分成功として扱わない。
- 別組織のrowをlock、削除、再作成しない。

具体的なtransaction lockの方式は、既存のrow lockを組織scopeへ拡張し、integration testで
確定します。

## 8. テストと運用

- E2E testごとに専用利用者と専用組織を作り、ほかのtestや公開状態をresetしない。
- 初回作成後に12業務要素、15関係、各初期versionが組織内に存在することを確認する。
- onboardingを再試行してもseedが重複しないことを確認する。
- 同じ`before_version_id`から二つの変更を確定した場合、一方だけが成功することを確認する。
- 一組織のリセット中も、別組織の一覧・変更履歴が変化しないことを確認する。
- `editor`と`viewer`がリセットを要求しても、UIとServer Actionの両方で拒否する。
- 別組織のrow IDを入力へ混ぜても、取得・変更・リセットできないことを確認する。

## 9. 現行共有状態からの移行

現行の共有状態は架空seedであり、利用者・組織との対応を持ちません。帰属先を推測せず、
認証・組織用migrationの適用時に現行domain rowを破棄します。その後はonboardingから組織別に
再作成します。

この移行は既存のentity/change URLとデモ履歴を失効させます。productionで実行する直前に
破棄対象を確認し、migration結果をリリースPull Requestへ記録します。
