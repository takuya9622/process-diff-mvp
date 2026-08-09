"use server";

import { revalidatePath } from "next/cache";

import { confirmChange } from "@/lib/server/change-service";
import { resetDemoState } from "@/lib/server/database/demo-state";
import type {
  ConfirmChangeInput,
  ConfirmChangeResult,
  ResetDemoResult,
} from "@/types/actions";

export async function confirmChangeAction(
  input: ConfirmChangeInput,
): Promise<ConfirmChangeResult> {
  try {
    const result = await confirmChange(input);

    if (result.status === "success") {
      revalidatePath("/", "page");
    }

    return result;
  } catch (error) {
    console.error("Failed to confirm a demo change.", error);
    return {
      status: "error",
      message:
        "変更を確定できませんでした。入力内容を残したまま、もう一度試してください。",
    };
  }
}

export async function resetDemoAction(): Promise<ResetDemoResult> {
  try {
    const result = await resetDemoState();
    revalidatePath("/", "page");
    return { status: "success", initialEntityId: result.initialEntityId };
  } catch (error) {
    console.error("Failed to reset the demo state.", error);
    return {
      status: "error",
      message:
        "サンプルを初期状態へ戻せませんでした。時間をおいてもう一度試してください。",
    };
  }
}
