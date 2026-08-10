import { describe, expect, it } from "vitest";

import {
  CHANGE_REASON_MAX_LENGTH,
  CONTENT_MAX_LENGTH,
  CONTENT_MAX_LINES,
} from "@/constants/demo";
import { validateChangeInput } from "@/lib/domain/input-validation";

describe("validateChangeInput", () => {
  it("改行コードと外側の空白を正規化し、内部の改行を保持する", () => {
    expect(validateChangeInput("  一行目\r\n二行目  ", "  理由  ")).toEqual({
      valid: true,
      value: {
        content: "一行目\n二行目",
        reason: "理由",
      },
    });
  });

  it("空白だけの内容を拒否し、空白だけの理由は未入力にする", () => {
    expect(validateChangeInput("　\n ", "理由")).toMatchObject({
      valid: false,
      field: "content",
    });
    expect(validateChangeInput("変更内容", "　 ")).toEqual({
      valid: true,
      value: { content: "変更内容", reason: null },
    });
  });

  it("Unicode code point単位で入力上限を検証する", () => {
    expect(
      validateChangeInput("文".repeat(CONTENT_MAX_LENGTH + 1), ""),
    ).toMatchObject({
      valid: false,
      field: "content",
    });
    expect(
      validateChangeInput("変更", "理".repeat(CHANGE_REASON_MAX_LENGTH + 1)),
    ).toMatchObject({ valid: false, field: "reason" });
    expect(
      validateChangeInput("😀".repeat(CONTENT_MAX_LENGTH), ""),
    ).toMatchObject({
      valid: true,
    });
  });

  it("行単位差分を安全に算出できる行数へ制限する", () => {
    expect(
      validateChangeInput(
        Array.from({ length: CONTENT_MAX_LINES + 1 }, (_, index) =>
          String(index),
        ).join("\n"),
        "",
      ),
    ).toMatchObject({ valid: false, field: "content" });
  });
});
