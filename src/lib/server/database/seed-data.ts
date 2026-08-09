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

export const INITIAL_DEMO_ENTITY_KEY = "rule-receipt-requirement";

export const DEMO_ENTITY_SEEDS: DemoEntitySeed[] = [
  {
    key: "process-expense-submission",
    type: "PROCESS",
    name: "経費申請",
    description: "従業員が経費を入力し、承認を依頼する業務",
    content:
      "申請者は利用日、金額、費目、目的を経費申請システムへ入力する。\n領収書提出ルールに従って領収書を添付する。\n入力内容を確認し、承認者へ申請する。",
  },
  {
    key: "process-receipt-review",
    type: "PROCESS",
    name: "証憑確認",
    description: "経理担当が申請内容と領収書を確認する業務",
    content:
      "経理担当は申請内容と領収書の金額、日付、用途を確認する。\n不足または不一致がある場合は申請者へ差し戻す。",
  },
  {
    key: "process-reimbursement-payment",
    type: "PROCESS",
    name: "立替経費の支払い",
    description: "確認済みの経費を支払いデータへ登録する業務",
    content:
      "証憑確認が完了した経費を会計システムへ登録する。\n登録した経費を次回の支払い対象へ反映する。",
  },
  {
    key: INITIAL_DEMO_ENTITY_KEY,
    type: "RULE",
    name: "領収書提出ルール",
    description: "どの経費に領収書が必要かを定めるルール",
    content:
      "経費が3,000円以上の場合、領収書を添付する。\n紙の領収書は申請後30日間保管する。",
  },
  {
    key: "rule-approval-threshold",
    type: "RULE",
    name: "金額別承認ルール",
    description: "金額に応じた確認方法を定めるルール",
    content:
      "50,000円以下の経費は承認者が確認する。\n50,000円を超える経費は承認者の確認後に経理担当も確認する。",
  },
  {
    key: "document-expense-policy",
    type: "DOCUMENT",
    name: "経費規程",
    description: "経費として認める範囲と基本原則を定める文書",
    content:
      "業務上必要で、私的利用を含まない支出だけを経費として認める。\n証憑の提出条件は領収書提出ルールに従う。",
  },
  {
    key: "document-expense-manual",
    type: "DOCUMENT",
    name: "経費申請マニュアル",
    description: "申請者向けの操作と提出手順を説明する文書",
    content:
      "最新の経費規程を確認する。\n経費申請システムへ必要事項を入力する。\n領収書提出ルールに従って証憑を添付し、承認を依頼する。",
  },
  {
    key: "role-applicant",
    type: "ROLE",
    name: "申請者",
    description: "経費を申請する従業員の役割",
    content:
      "経費の内容を正確に入力し、必要な証憑を提出する。\n差し戻された場合は内容を修正して再申請する。",
  },
  {
    key: "role-approver",
    type: "ROLE",
    name: "承認者",
    description: "申請の業務上の妥当性を確認する上長の役割",
    content:
      "経費の業務上の必要性と入力内容を確認する。\n問題がなければ承認し、不明点があれば差し戻す。",
  },
  {
    key: "role-accounting",
    type: "ROLE",
    name: "経理担当",
    description: "証憑確認と支払い登録を担当する役割",
    content: "申請内容と証憑を確認する。\n確認済みの経費を支払い処理へ進める。",
  },
  {
    key: "system-expense",
    type: "SYSTEM",
    name: "経費申請システム",
    description: "申請、領収書添付、承認状況を管理するシステム",
    content: "経費申請、領収書添付、承認、差し戻しの状態を管理する。",
  },
  {
    key: "system-accounting",
    type: "SYSTEM",
    name: "会計システム",
    description: "確認済み経費と支払いデータを管理するシステム",
    content: "確認済み経費の登録と支払いデータを管理する。",
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
