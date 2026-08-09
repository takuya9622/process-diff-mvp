# サンプル業務と検証シナリオ

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書状態 | 初期決定 |
| 対象 | MVPで使用するサンプル業務、seed、デモとE2Eの基準シナリオ |
| 最終更新日 | 2026-08-10 |

この文書では、MVPの初期状態として使用するサンプル業務と、変更、差分、影響候補を確認する
基準シナリオを定義します。影響候補の算出規則は
[影響候補の探索仕様](impact-search.md)、画面上の操作順は
[MVP画面構成とユーザーフロー](screens-and-user-flow.md)を参照してください。

## 2. 題材の決定

MVPのサンプル業務は「経費精算」とします。

経費精算は、多くの利用者が概要を想像しやすく、次の業務要素を一つの短いシナリオに
含められるためです。

- 申請、確認、支払いという複数の業務
- 金額や領収書に関するルール
- 規程と操作マニュアル
- 申請者、承認者、経理担当という役割
- 経費申請システムと会計システム

実在企業の規程、画面、名称は使用せず、検証用の架空データとして作成します。

## 3. 業務要素

seedとテストでは、次の`seed_key`を安定した識別名として使用します。データベースのUUIDは
別に生成し、表示やテストをUUIDの固定値へ依存させません。`seed_key`はseed定義内の識別子で
あり、MVPのデータベース列には追加しません。

| `seed_key` | 種類 | 表示名 | 説明 |
|---|---|---|---|
| `process-expense-submission` | `PROCESS` | 経費申請 | 従業員が経費を入力し、承認を依頼する業務 |
| `process-receipt-review` | `PROCESS` | 証憑確認 | 経理担当が申請内容と領収書を確認する業務 |
| `process-reimbursement-payment` | `PROCESS` | 立替経費の支払い | 確認済みの経費を支払いデータへ登録する業務 |
| `rule-receipt-requirement` | `RULE` | 領収書提出ルール | どの経費に領収書が必要かを定めるルール |
| `rule-approval-threshold` | `RULE` | 金額別承認ルール | 金額に応じた確認方法を定めるルール |
| `document-expense-policy` | `DOCUMENT` | 経費規程 | 経費として認める範囲と基本原則を定める文書 |
| `document-expense-manual` | `DOCUMENT` | 経費申請マニュアル | 申請者向けの操作と提出手順を説明する文書 |
| `role-applicant` | `ROLE` | 申請者 | 経費を申請する従業員の役割 |
| `role-approver` | `ROLE` | 承認者 | 申請の業務上の妥当性を確認する上長の役割 |
| `role-accounting` | `ROLE` | 経理担当 | 証憑確認と支払い登録を担当する役割 |
| `system-expense` | `SYSTEM` | 経費申請システム | 申請、領収書添付、承認状況を管理するシステム |
| `system-accounting` | `SYSTEM` | 会計システム | 確認済み経費と支払いデータを管理するシステム |

### 3.1 初期内容

初期の`current_content`は、実務で扱う複数節のページを想定したプレーンテキストで作成します。
各要素は目的、対象、手順、注意事項、完了条件などを8〜40行程度で持ちます。通常画面では次の
限定した記号を文書構造として表示し、変更画面と差分では元の文字列をそのまま扱います。

- `##`は節見出し
- `###`は小見出し
- `-`は箇条書き
- `1.`は番号付き手順
- `>`は注記

基準要素`rule-receipt-requirement`は、目的、適用範囲、提出基準、電子領収書、紙の領収書、
領収書を取得できない場合、差し戻し条件、関連する業務知識を持つ長文ページとします。
12要素の正確な初期文字列は`src/lib/server/database/seed-data.ts`を実装上の正本とします。

## 4. 関係

関係の向きは`source → target`で表します。利用者向けにはenumをそのまま表示せず、
[影響候補の探索仕様](impact-search.md)で定義する文章へ変換します。

| Source | Relation | Target |
|---|---|---|
| `process-expense-submission` | `GOVERNED_BY` | `rule-receipt-requirement` |
| `process-expense-submission` | `GOVERNED_BY` | `rule-approval-threshold` |
| `process-expense-submission` | `USES` | `system-expense` |
| `process-expense-submission` | `OWNED_BY` | `role-applicant` |
| `process-expense-submission` | `APPROVED_BY` | `role-approver` |
| `process-expense-submission` | `REFERENCES` | `document-expense-manual` |
| `rule-receipt-requirement` | `GOVERNED_BY` | `document-expense-policy` |
| `document-expense-manual` | `REFERENCES` | `rule-receipt-requirement` |
| `document-expense-manual` | `REFERENCES` | `rule-approval-threshold` |
| `process-receipt-review` | `REQUIRES` | `process-expense-submission` |
| `process-receipt-review` | `GOVERNED_BY` | `rule-receipt-requirement` |
| `process-receipt-review` | `OWNED_BY` | `role-accounting` |
| `process-reimbursement-payment` | `REQUIRES` | `process-receipt-review` |
| `process-reimbursement-payment` | `USES` | `system-accounting` |
| `process-reimbursement-payment` | `OWNED_BY` | `role-accounting` |

## 5. 基準となる変更シナリオ

初期表示では`rule-receipt-requirement`を選択し、この要素をデモの変更対象とします。

### 5.1 長文内の変更前行

```text
経費が3,000円以上の場合、領収書を添付する。
```

### 5.2 長文内の変更後行

```text
金額にかかわらず、すべての経費申請に領収書を添付する。
```

変更理由の入力例は、次とします。

```text
少額経費を含めて証憑の確認方法を統一するため
```

ページ全体は保持したまま対象の1行だけを置き換えます。差分では対象行が削除と追加として
識別でき、長い変更なし区間は変更箇所の前後を残して折りたためることを基準とします。
単語単位の強調はMVPの必須条件にはしません。

## 6. 期待する影響候補

最大2段階の探索により、次の候補を表示します。候補になったことは影響の断定ではなく、
利用者へ確認を促す結果です。

### 6.1 直接関係する候補

| 候補 | 理由の要点 |
|---|---|
| 経費申請 | 経費申請は領収書提出ルールに従う |
| 証憑確認 | 証憑確認は領収書提出ルールに従う |
| 経費規程 | 領収書提出ルールは経費規程に従う |
| 経費申請マニュアル | 経費申請マニュアルは領収書提出ルールを参照する |

### 6.2 2段階先の候補

| 候補 | 代表経路 |
|---|---|
| 立替経費の支払い | 領収書提出ルール ← 証憑確認 ← 立替経費の支払い |
| 金額別承認ルール | 領収書提出ルール ← 経費申請 → 金額別承認ルール |
| 経費申請システム | 領収書提出ルール ← 経費申請 → 経費申請システム |
| 経理担当 | 領収書提出ルール ← 証憑確認 → 経理担当 |
| 承認者 | 領収書提出ルール ← 経費申請 → 承認者 |
| 申請者 | 領収書提出ルール ← 経費申請 → 申請者 |

`system-accounting`は変更元から3段階先となるため、MVPの結果へ表示しません。これを探索深度の
境界を確認するテストケースとして使用します。

## 7. 中核フローの受け入れシナリオ

1. 初期表示で、領収書提出ルールと直接関係する要素を確認できる。
2. 領収書提出ルールの1行目を基準どおり変更できる。
3. 確定前に、変更前の1行と変更後の1行を識別できる。
4. 変更を確定すると、新しい`EntityVersion`と`ChangeSet`が保存される。
5. 変更結果に、直接関係する4件と2段階先の6件が重複なく表示される。
6. 任意の候補を選択し、変更元から候補までの関係経路を確認できる。
7. `system-accounting`が探索深度を超える候補として表示されない。
8. ブラウザを更新しても、確定済みの変更結果をURLから再表示できる。
9. サンプルをリセットすると、この文書の初期状態へ戻る。

このシナリオを、domain logicのunit test、Playwrightの中核E2E、第三者へ説明するデモ手順の
共通基準とします。

## 8. サンプル変更のルール

- seedの要素、関係、初期内容を変更した場合は、この文書と期待する影響候補を同時に更新する。
- 影響探索の期待値を変更した場合は、[影響候補の探索仕様](impact-search.md)とテストを同時に
  更新する。
- 実在企業の名称、規程、画面、非公開情報を追加しない。
- 要素数を増やす場合は、中核フローの理解に必要であることを確認し、単に現実へ近づけることを
  目的に追加しない。
