import { describe, expect, it } from "vitest";

import {
  validateChannelInput,
  validateMessageInput,
} from "@/lib/domain/communication-validation";

describe("communication validation", () => {
  it("チャンネル名と説明をtrimして受け入れる", () => {
    expect(validateChannelInput("  経費相談  ", "  申請の相談窓口  ")).toEqual({
      status: "valid",
      value: { name: "経費相談", description: "申請の相談窓口" },
    });
  });

  it("短すぎるチャンネル名と長すぎる説明を拒否する", () => {
    expect(validateChannelInput("経", "")).toMatchObject({
      status: "invalid",
      field: "name",
    });
    expect(validateChannelInput("経費相談", "あ".repeat(121))).toMatchObject({
      status: "invalid",
      field: "description",
    });
  });

  it("空のメッセージを拒否し、本文をtrimする", () => {
    expect(validateMessageInput("   ")).toMatchObject({
      status: "invalid",
      field: "body",
    });
    expect(validateMessageInput("  確認をお願いします。  ")).toEqual({
      status: "valid",
      value: { body: "確認をお願いします。" },
    });
  });
});
