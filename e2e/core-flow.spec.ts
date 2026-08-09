import { expect, test } from "@playwright/test";

const INITIAL_CONTENT =
  "経費が3,000円以上の場合、領収書を添付する。\n紙の領収書は申請後30日間保管する。";
const CHANGED_CONTENT =
  "金額にかかわらず、すべての経費申請に領収書を添付する。\n紙の領収書は申請後30日間保管する。";

test("変更、差分、影響候補、経路、再表示、リセットを完了できる", async ({
  page,
}) => {
  await page.goto("/");
  await resetDemo(page);

  await expect(
    page.getByRole("heading", { name: "領収書提出ルール", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(INITIAL_CONTENT.split("\n")[0])).toBeVisible();
  await expect(page.getByText("v1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /経費規程/ }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "この業務を変更する", exact: true })
    .click();
  await expect(
    page.getByText("このデモの変更内容は、ほかの利用者にも共有されます。"),
  ).toBeVisible();
  await page
    .getByLabel("変更後の内容 必須", { exact: true })
    .fill(CHANGED_CONTENT);
  await page
    .getByLabel("変更理由 任意", { exact: true })
    .fill("少額経費を含めて証憑の確認方法を統一するため");
  await page
    .getByRole("button", { name: "変更前後を確認する", exact: true })
    .click();

  await expect(
    page.getByLabel(`削除: ${INITIAL_CONTENT.split("\n")[0]}`),
  ).toBeVisible();
  await expect(
    page.getByLabel(`追加: ${CHANGED_CONTENT.split("\n")[0]}`),
  ).toBeVisible();
  await expect(
    page.getByLabel(`変更なし: ${CHANGED_CONTENT.split("\n")[1]}`),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "この内容で変更を確定する",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\?change=[0-9a-f-]+$/);

  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("直接 4件", { exact: false })).toBeVisible();
  await expect(page.getByText("2段階先 6件", { exact: false })).toBeVisible();

  const candidateButtons = page.locator("button[aria-pressed]");
  await expect(candidateButtons).toHaveCount(10);
  await expect(
    candidateButtons.filter({ hasText: "会計システム" }),
  ).toHaveCount(0);

  await candidateButtons.filter({ hasText: "立替経費の支払い" }).click();
  const pathPanel = page.getByTestId("impact-path-detail");
  await expect(pathPanel).toBeVisible();
  await expect(
    pathPanel.getByRole("heading", {
      name: "立替経費の支払いまでの関係経路",
      level: 3,
    }),
  ).toBeVisible();
  await expect(pathPanel.getByText("証憑確認", { exact: true })).toBeVisible();
  await expect(
    pathPanel.getByText("立替経費の支払いは証憑確認を前提とする", {
      exact: true,
    }),
  ).toBeVisible();

  const changeResultUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(changeResultUrl);
  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();
  await expect(candidateButtons).toHaveCount(10);

  await resetDemo(page);
  await page.goto(changeResultUrl);
  await expect(
    page.getByText(
      "指定された変更結果は見つかりませんでした。サンプルがリセットされた可能性があります。",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(INITIAL_CONTENT.split("\n")[0])).toBeVisible();
});

async function resetDemo(page: import("@playwright/test").Page) {
  const resetButton = page.getByTestId("reset-demo-button");
  await expect(resetButton).toBeEnabled();
  const dialogHandled = page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await Promise.all([dialogHandled, resetButton.click()]);
  await expect(page).toHaveURL(/\?entity=[0-9a-f-]+$/);
}
