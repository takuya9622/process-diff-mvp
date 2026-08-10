export const EXPENSE_WORKFLOW_KEY = "expense-request";
export const EXPENSE_REQUEST_STEP_KEY = "request";
export const EXPENSE_APPROVAL_STEP_KEY = "approval";
export const EXPENSE_ACCOUNTING_STEP_KEY = "accounting";
export const EXPENSE_COMPLETION_STEP_KEY = "complete";

export const EXPENSE_WORKFLOW_FIELD_SEEDS = [
  {
    key: "expense_date",
    label: "経費発生日",
    type: "DATE",
    stepKey: EXPENSE_REQUEST_STEP_KEY,
    required: true,
    position: 1,
    description: "支払いが発生した日を入力します。",
  },
  {
    key: "amount",
    label: "金額",
    type: "INTEGER",
    stepKey: EXPENSE_REQUEST_STEP_KEY,
    required: true,
    position: 2,
    description: "税込の支払金額を日本円で入力します。",
  },
  {
    key: "purpose",
    label: "用途",
    type: "TEXT",
    stepKey: EXPENSE_REQUEST_STEP_KEY,
    required: true,
    position: 3,
    description: "業務との関係が分かるように入力します。",
  },
  {
    key: "payee",
    label: "支払先",
    type: "TEXT",
    stepKey: EXPENSE_REQUEST_STEP_KEY,
    required: true,
    position: 4,
    description: "店舗名、会社名、または交通機関を入力します。",
  },
  {
    key: "receipt_reference",
    label: "領収書情報",
    type: "TEXT",
    stepKey: EXPENSE_REQUEST_STEP_KEY,
    required: true,
    position: 5,
    description: "領収書番号や保管場所など、証憑を特定できる情報を入力します。",
  },
  {
    key: "accounting_processed_date",
    label: "処理日",
    type: "DATE",
    stepKey: EXPENSE_ACCOUNTING_STEP_KEY,
    required: true,
    position: 6,
    description: "経理処理を実施した日を入力します。",
  },
  {
    key: "accounting_reference",
    label: "処理参照番号",
    type: "TEXT",
    stepKey: EXPENSE_ACCOUNTING_STEP_KEY,
    required: true,
    position: 7,
    description: "会計伝票番号など、処理結果を追跡できる番号を入力します。",
  },
  {
    key: "accounting_result",
    label: "処理結果・証跡",
    type: "TEXT",
    stepKey: EXPENSE_ACCOUNTING_STEP_KEY,
    required: true,
    position: 8,
    description: "手動処理の結果と確認内容を入力します。",
  },
] as const;

export const EXPENSE_WORKFLOW_STEP_SEEDS = [
  {
    key: EXPENSE_REQUEST_STEP_KEY,
    name: "申請内容の入力",
    type: "INPUT",
    assignedRole: "申請者",
    dueDays: null,
    position: 1,
  },
  {
    key: EXPENSE_APPROVAL_STEP_KEY,
    name: "申請内容の承認",
    type: "APPROVAL",
    assignedRole: "承認者",
    dueDays: 3,
    position: 2,
  },
  {
    key: EXPENSE_ACCOUNTING_STEP_KEY,
    name: "経理処理",
    type: "TASK",
    assignedRole: "経理担当",
    dueDays: 3,
    position: 3,
  },
  {
    key: EXPENSE_COMPLETION_STEP_KEY,
    name: "完了",
    type: "END",
    assignedRole: null,
    dueDays: null,
    position: 4,
  },
] as const;
