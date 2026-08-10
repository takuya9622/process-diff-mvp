import type {
  AccountingInput,
  ExpenseCaseInput,
  WorkflowActionResult,
} from "@/types/workflow";

type InvalidResult = Extract<WorkflowActionResult, { status: "invalid" }>;

export function validateExpenseCaseInput(
  input: ExpenseCaseInput,
): InvalidResult | null {
  if (!isValidDate(input.expenseDate)) {
    return {
      status: "invalid",
      field: "expenseDate",
      message: "経費発生日を正しく入力してください。",
    };
  }

  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) {
    return {
      status: "invalid",
      field: "amount",
      message: "金額は1円以上10,000,000円以下の整数で入力してください。",
    };
  }

  for (const [field, value, label, maximum] of [
    ["purpose", input.purpose, "用途", 500],
    ["payee", input.payee, "支払先", 200],
    ["receiptReference", input.receiptReference, "領収書情報", 500],
  ] as const) {
    const normalizedValue = value.trim();
    if (normalizedValue.length === 0 || normalizedValue.length > maximum) {
      return {
        status: "invalid",
        field,
        message: `${label}は1文字以上${maximum}文字以内で入力してください。`,
      };
    }
  }

  return null;
}

export function validateAccountingInput(
  input: AccountingInput,
): InvalidResult | null {
  if (!isValidDate(input.processedDate)) {
    return {
      status: "invalid",
      field: "processedDate",
      message: "処理日を正しく入力してください。",
    };
  }

  if (
    input.reference.trim().length < 1 ||
    input.reference.trim().length > 200
  ) {
    return {
      status: "invalid",
      field: "reference",
      message: "処理参照番号は1文字以上200文字以内で入力してください。",
    };
  }

  if (input.result.trim().length < 1 || input.result.trim().length > 1000) {
    return {
      status: "invalid",
      field: "result",
      message: "処理結果・証跡は1文字以上1,000文字以内で入力してください。",
    };
  }

  return null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
