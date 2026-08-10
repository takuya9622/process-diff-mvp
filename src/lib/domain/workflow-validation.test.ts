import { describe, expect, it } from "vitest";

import {
  validateAccountingInput,
  validateExpenseCaseInput,
} from "@/lib/domain/workflow-validation";

const validExpenseInput = {
  expenseDate: "2026-08-10",
  amount: "12800",
  purpose: "顧客訪問のための交通費",
  payee: "東海旅客鉄道",
  receiptReference: "電子領収書 R-2026-0810",
};

describe("workflow validation", () => {
  it("経費申請の正しい入力を受け付ける", () => {
    expect(validateExpenseCaseInput(validExpenseInput)).toBeNull();
  });

  it.each([
    [{ ...validExpenseInput, expenseDate: "2026-02-30" }, "expenseDate"],
    [{ ...validExpenseInput, amount: "1.5" }, "amount"],
    [{ ...validExpenseInput, purpose: "  " }, "purpose"],
    [{ ...validExpenseInput, payee: "" }, "payee"],
    [{ ...validExpenseInput, receiptReference: "" }, "receiptReference"],
  ])("経費申請の不正な入力を項目単位で拒否する", (input, field) => {
    expect(validateExpenseCaseInput(input)).toMatchObject({
      status: "invalid",
      field,
    });
  });

  it("経理処理の正しい入力を受け付ける", () => {
    expect(
      validateAccountingInput({
        processedDate: "2026-08-11",
        reference: "ACC-2026-0001",
        result: "振込データへ登録済み",
      }),
    ).toBeNull();
  });
});
