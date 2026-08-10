import type { BusinessEntityType } from "@/constants/business-entity";
import type { RelationType } from "@/constants/relation";

export type DemoEntitySeed = {
  key: string;
  type: BusinessEntityType;
  name: string;
  description: string;
  content: string;
};

export type DemoRelationSeed = {
  sourceKey: string;
  type: RelationType;
  targetKey: string;
};

export const INITIAL_DEMO_ENTITY_KEY = "process-expense-submission";
export const CHANGE_TARGET_DEMO_ENTITY_KEY = "rule-receipt-requirement";

export const DEMO_ENTITY_SEEDS: DemoEntitySeed[] = [
  {
    key: "process-expense-submission",
    type: "PROCESS",
    name: "経費申請",
    description: "従業員が経費を入力し、承認を依頼する業務",
    content: `## 目的
従業員が業務上立て替えた経費を、必要な情報と証憑をそろえて承認者へ申請する。

## 開始条件
- 支払いが完了し、利用日と金額が確定している
- 経費規程で申請可能な支出である
- 申請者本人が支出内容を説明できる

## 申請手順
1. 経費申請システムで新しい申請を作成する
2. 利用日、金額、費目、支払先、目的を入力する
3. 部門またはプロジェクトの負担先を指定する
4. 領収書提出ルールに従って証憑を添付する
5. 入力内容と添付ファイルを確認し、承認者へ申請する

### 入力時の注意
- 一つの領収書を複数の申請へ重複して添付しない
- 外貨で支払った場合は支払時の通貨と換算額を記録する
- 会議費や交際費は参加者と目的を補足する

## 完了条件
申請番号が発行され、状態が「承認待ち」になっていること。

> 不備に気づいた場合は、承認前に申請を取り下げて修正する。`,
  },
  {
    key: "process-receipt-review",
    type: "PROCESS",
    name: "証憑確認",
    description: "経理担当が申請内容と領収書を確認する業務",
    content: `## 目的
経費申請の内容と証憑を照合し、会計処理へ進められる状態かを確認する。

## 確認項目
- 申請金額と領収書の合計が一致している
- 利用日、支払先、通貨が読み取れる
- 経費の目的が業務内容と結び付いている
- 費目と負担先が経費規程に沿っている
- 同じ証憑が過去の申請で使用されていない

## 確認手順
1. 経費申請システムで承認済み申請を開く
2. 申請内容と添付された証憑を照合する
3. 金額別承認ルールに沿った承認が完了しているか確認する
4. 問題がなければ「確認済み」に更新する

### 差し戻し
不足または不一致がある場合は、修正が必要な項目を具体的に記載して申請者へ差し戻す。

## 完了条件
申請状態が「確認済み」または「差し戻し」になり、判断理由が記録されていること。`,
  },
  {
    key: "process-reimbursement-payment",
    type: "PROCESS",
    name: "立替経費の支払い",
    description: "確認済みの経費を支払いデータへ登録する業務",
    content: `## 目的
証憑確認が完了した立替経費を会計システムへ登録し、従業員への支払い対象へ反映する。

## 対象
- 経費申請システムで「確認済み」になった申請
- 支払先となる従業員情報が有効な申請
- 支払保留または調査中ではない申請

## 処理手順
1. 当日までに確認済みとなった申請を抽出する
2. 申請番号、費目、負担先、金額を会計システムへ登録する
3. 会計システムの登録結果と件数・合計金額を照合する
4. 次回の支払いデータへ対象明細を追加する
5. 経費申請システムへ連携結果を記録する

### エラー時
- 重複エラーは申請番号を基準に既存登録を確認する
- 負担先エラーは申請を支払保留にして経理担当へ通知する
- 一部失敗時は成功分を再登録しない

## 完了条件
会計伝票番号と支払予定日が申請へ記録されていること。`,
  },
  {
    key: CHANGE_TARGET_DEMO_ENTITY_KEY,
    type: "RULE",
    name: "領収書提出ルール",
    description: "どの経費に領収書が必要かを定めるルール",
    content: `## 目的
経費申請に必要な証憑と保管方法を統一し、申請者と確認者が同じ基準で判断できるようにする。

## 適用範囲
- 国内で発生した立替経費
- 法人カードで決済した経費
- 交通費、会議費、消耗品費、その他の一般経費

## 領収書の提出基準
経費が3,000円以上の場合、領収書を添付する。
領収書には利用日、支払先、金額、購入内容が確認できる情報が必要である。

### 電子領収書
- PDFまたは画像ファイルを経費申請システムへ添付する
- メール本文が証憑の場合は、利用日と金額を含む範囲をPDFとして保存する
- 同じファイルを複数の申請へ重複して添付しない

### 紙の領収書
紙の領収書は申請後30日間保管する。
文字が薄い場合は、内容を読み取れる状態で撮影して添付する。

## 領収書を取得できない場合
公共交通機関など領収書が発行されない支出は、利用区間、利用日、金額を申請へ記載する。
紛失した場合は、紛失理由と支払事実を確認できる資料を添えて承認者へ申告する。

> 領収書がないことだけを理由に自動承認しない。経費規程と金額別承認ルールに従って個別に判断する。

## 差し戻し条件
- 必須項目が読み取れない
- 申請金額と領収書の金額が一致しない
- 業務目的との関係が説明されていない
- 証憑の重複利用が疑われる

## 関連する業務知識
- 経費規程
- 経費申請
- 証憑確認
- 経費申請マニュアル`,
  },
  {
    key: "rule-approval-threshold",
    type: "RULE",
    name: "金額別承認ルール",
    description: "金額に応じた確認方法を定めるルール",
    content: `## 目的
経費金額とリスクに応じて必要な承認者を統一する。

## 基本ルール
- 50,000円以下の経費は承認者が確認する
- 50,000円を超える経費は承認者の確認後に経理担当も確認する
- 200,000円を超える経費は部門責任者の事前承認を必要とする

## 金額にかかわらず追加確認するケース
- 交際費または贈答品に該当する
- 通常と異なる支払方法を利用している
- 領収書を取得できない、または紛失している
- 同一目的の申請が短期間に複数回ある

## 承認者の確認事項
1. 業務上の必要性
2. 金額と内容の妥当性
3. 予算および負担先
4. 必要な証憑の有無

## 差し戻し
判断に必要な情報が不足している場合は、承認せず不足項目を明記して差し戻す。`,
  },
  {
    key: "document-expense-policy",
    type: "DOCUMENT",
    name: "経費規程",
    description: "経費として認める範囲と基本原則を定める文書",
    content: `## 1. 目的
本規程は、業務上必要な支出の範囲と経費処理の基本原則を定める。

## 2. 基本原則
業務上必要で、私的利用を含まない支出だけを経費として認める。
申請者は支出の目的、金額、利用日を正確に記録しなければならない。

## 3. 対象となる経費
- 業務上の移動に必要な交通費
- 顧客または社内の会議に必要な費用
- 業務に必要な消耗品および少額備品
- 事前に承認された出張費

## 4. 対象外の支出
- 私的な飲食、移動、物品購入
- 罰金、延滞金、個人の都合で発生した手数料
- 支出目的を説明できないもの

## 5. 申請と証憑
証憑の提出条件は領収書提出ルールに従う。
承認経路は金額別承認ルールに従い、申請者自身が最終承認者になることはできない。

## 6. 不備への対応
経理担当は、規程に適合しない申請を理由付きで差し戻すことができる。虚偽または重複申請が疑われる場合は支払いを保留する。`,
  },
  {
    key: "document-expense-manual",
    type: "DOCUMENT",
    name: "経費申請マニュアル",
    description: "申請者向けの操作と提出手順を説明する文書",
    content: `## このマニュアルについて
経費を初めて申請する人が、入力から承認依頼までを完了するための操作手順です。

## 申請前の準備
- 最新の経費規程を確認する
- 領収書または支払事実を確認できる資料を用意する
- 費用を負担する部門またはプロジェクトを確認する

## 新しい申請を作成する
1. 経費申請システムへログインする
2. 「新しい経費申請」を選択する
3. 利用日、金額、費目、支払先を入力する
4. 業務上の目的を具体的に入力する
5. 領収書提出ルールに従って証憑を添付する

### 複数明細がある場合
領収書ごとに明細を分ける。同じ目的で連続した交通費は、利用区間が分かるように入力する。

## 承認を依頼する
入力内容と添付ファイルを確認し、「承認を依頼」を選択する。申請後は状態が「承認待ち」になったことを確認する。

## 差し戻された場合
差し戻し理由を確認し、指摘された項目を修正して再申請する。元の申請を複製して新規申請を作らない。

## 困ったとき
- 証憑要件は領収書提出ルールを確認する
- 承認経路は金額別承認ルールを確認する
- システムエラーは申請番号と画面表示を添えて経理担当へ連絡する`,
  },
  {
    key: "role-applicant",
    type: "ROLE",
    name: "申請者",
    description: "経費を申請する従業員の役割",
    content: `## 役割の目的
業務上発生した経費を正確かつ期限内に申請し、確認に必要な情報を提供する。

## 主な責任
- 経費の内容、金額、利用日、負担先を正確に入力する
- 領収書提出ルールに沿って必要な証憑を提出する
- 私的利用や重複申請が含まれていないことを確認する
- 差し戻された場合は内容を修正して再申請する

## 申請前のセルフチェック
1. 経費規程の対象に含まれている
2. 入力金額と証憑が一致している
3. 業務目的が第三者にも理解できる
4. 正しい承認者が設定されている

## 対応期限
原則として支出日から30日以内に申請する。期限を超えた場合は遅延理由を記載する。`,
  },
  {
    key: "role-approver",
    type: "ROLE",
    name: "承認者",
    description: "申請の業務上の妥当性を確認する上長の役割",
    content: `## 役割の目的
申請された経費の業務上の必要性と妥当性を判断し、適切な支出だけを次の確認へ進める。

## 主な責任
- 支出目的が担当業務と関係しているか確認する
- 金額、費目、負担先が妥当か確認する
- 金額別承認ルールに沿って自分が承認者であるか確認する
- 不明点があれば、具体的な確認事項を示して差し戻す

## 承認時の確認順序
1. 業務上の必要性
2. 予算との整合
3. 証憑と申請内容の一致
4. 他の申請との重複がないこと

## 判断の記録
例外を承認する場合は、通常ルールと異なる理由をコメントへ残す。口頭確認だけで判断を完了しない。`,
  },
  {
    key: "role-accounting",
    type: "ROLE",
    name: "経理担当",
    description: "証憑確認と支払い登録を担当する役割",
    content: `## 役割の目的
経費申請が規程と証憑要件を満たすか確認し、正しい会計処理と支払いにつなげる。

## 主な責任
- 申請内容と証憑を照合する
- 費目、税区分、負担先を確認する
- 不備のある申請を理由付きで差し戻す
- 確認済みの経費を支払い処理へ進める
- 重複や不正が疑われる申請を保留する

## 日次業務
1. 承認済み申請の件数と滞留日数を確認する
2. 証憑確認を実施する
3. 差し戻しと問い合わせへ対応する
4. 支払い対象への連携結果を確認する

## エスカレーション
規程だけで判断できない申請は、支払いを保留したうえで部門責任者へ判断を依頼する。`,
  },
  {
    key: "system-expense",
    type: "SYSTEM",
    name: "経費申請システム",
    description: "申請、領収書添付、承認状況を管理するシステム",
    content: `## システムの役割
経費申請の作成から承認、証憑確認までの状態と操作履歴を管理する。

## 主な機能
- 経費明細の入力と一時保存
- 領収書ファイルの添付
- 金額に応じた承認経路の設定
- 承認、差し戻し、取り下げ
- 申請状態と操作履歴の表示
- 会計システムへの連携結果の保持

## 管理する状態
1. 下書き
2. 承認待ち
3. 差し戻し
4. 承認済み
5. 確認済み
6. 支払処理済み

## 入力上の制約
- 申請番号は組織内で一意にする
- 必須項目が不足した状態では承認依頼できない
- 確認済み以降の内容変更は経理担当の取り消し操作を必要とする`,
  },
  {
    key: "system-accounting",
    type: "SYSTEM",
    name: "会計システム",
    description: "確認済み経費と支払いデータを管理するシステム",
    content: `## システムの役割
確認済み経費の会計仕訳と、従業員への支払いデータを管理する。

## 受け取る情報
- 経費申請番号
- 申請者と支払先
- 費目、税区分、負担先
- 金額と通貨
- 支払予定日

## 主な処理
1. 経費申請システムから確認済み明細を受け取る
2. 会計仕訳を作成する
3. 支払い対象を支払日単位で集約する
4. 登録結果と伝票番号を連携元へ返す

## 重複防止
経費申請番号を外部参照キーとして保持し、同じ番号を二重に登録しない。

## エラー時の扱い
不正な負担先、締め済み期間、重複番号は登録せず、理由を含むエラー結果を返す。`,
  },
];

export const DEMO_RELATION_SEEDS: DemoRelationSeed[] = [
  {
    sourceKey: "process-expense-submission",
    type: "GOVERNED_BY",
    targetKey: "rule-receipt-requirement",
  },
  {
    sourceKey: "process-expense-submission",
    type: "GOVERNED_BY",
    targetKey: "rule-approval-threshold",
  },
  {
    sourceKey: "process-expense-submission",
    type: "USES",
    targetKey: "system-expense",
  },
  {
    sourceKey: "process-expense-submission",
    type: "OWNED_BY",
    targetKey: "role-applicant",
  },
  {
    sourceKey: "process-expense-submission",
    type: "APPROVED_BY",
    targetKey: "role-approver",
  },
  {
    sourceKey: "process-expense-submission",
    type: "REFERENCES",
    targetKey: "document-expense-manual",
  },
  {
    sourceKey: "rule-receipt-requirement",
    type: "GOVERNED_BY",
    targetKey: "document-expense-policy",
  },
  {
    sourceKey: "document-expense-manual",
    type: "REFERENCES",
    targetKey: "rule-receipt-requirement",
  },
  {
    sourceKey: "document-expense-manual",
    type: "REFERENCES",
    targetKey: "rule-approval-threshold",
  },
  {
    sourceKey: "process-receipt-review",
    type: "REQUIRES",
    targetKey: "process-expense-submission",
  },
  {
    sourceKey: "process-receipt-review",
    type: "GOVERNED_BY",
    targetKey: "rule-receipt-requirement",
  },
  {
    sourceKey: "process-receipt-review",
    type: "OWNED_BY",
    targetKey: "role-accounting",
  },
  {
    sourceKey: "process-reimbursement-payment",
    type: "REQUIRES",
    targetKey: "process-receipt-review",
  },
  {
    sourceKey: "process-reimbursement-payment",
    type: "USES",
    targetKey: "system-accounting",
  },
  {
    sourceKey: "process-reimbursement-payment",
    type: "OWNED_BY",
    targetKey: "role-accounting",
  },
];
