import { expect, test } from "@playwright/test";

const INITIAL_CONTENT =
  "経費が3,000円以上の場合、領収書を添付する。\n紙の領収書は申請後30日間保管する。";
const CHANGED_CONTENT =
  "金額にかかわらず、すべての経費申請に領収書を添付する。\n紙の領収書は申請後30日間保管する。";
const PASSWORD = "process-diff-e2e-password";

test("登録、組織作成、変更、再ログイン、組織境界、リセットを完了できる", async ({
  page,
}) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userName = `E2E利用者 ${uniqueSuffix}`;
  const email = `e2e-${uniqueSuffix}@example.com`;

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.getByLabel("名前").fill(userName);
  await page.getByLabel("メールアドレス").fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByLabel("パスワード（確認）").fill(PASSWORD);
  await page.getByRole("button", { name: "新規登録" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("組織名").fill(`E2E組織 ${uniqueSuffix}`);
  await page.getByRole("button", { name: "作成して始める" }).click();
  await expect(page).toHaveURL(/\/organizations\/[^/]+\/entities\/[0-9a-f-]+$/);

  const organizationUrl = new URL(page.url());
  const organizationSlug = organizationUrl.pathname.split("/")[2];
  await expect(page.getByText(userName, { exact: false })).toBeVisible();
  await expect(page.getByText("オーナー", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "領収書提出ルール", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(INITIAL_CONTENT.split("\n")[0])).toBeVisible();
  await expect(page.getByText("v1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /経費規程/ }).first(),
  ).toBeVisible();

  const initialEntityUrl = page.url();
  await page
    .getByRole("link", { name: /経費規程/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "経費規程", level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    new RegExp(`/organizations/${organizationSlug}/entities/[0-9a-f-]+$`),
  );
  await page.goBack();
  await expect(page).toHaveURL(initialEntityUrl);

  await page
    .getByRole("button", { name: "この業務を変更する", exact: true })
    .click();
  await expect(
    page.getByText("変更内容はこの組織のメンバーだけに共有されます。", {
      exact: false,
    }),
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

  await page
    .getByRole("button", {
      name: "この内容で変更を確定する",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/organizations/${organizationSlug}/changes/[0-9a-f-]+$`),
  );

  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(`${userName} ·`, { exact: false })).toBeVisible();
  await expect(page.getByText("直接 4件", { exact: false })).toBeVisible();
  await expect(page.getByText("2段階先 6件", { exact: false })).toBeVisible();

  const candidateButtons = page.locator("button[aria-pressed]");
  await expect(candidateButtons).toHaveCount(10);
  await candidateButtons.filter({ hasText: "立替経費の支払い" }).click();
  const pathPanel = page.getByTestId("impact-path-detail");
  await expect(pathPanel).toBeVisible();
  await expect(
    pathPanel.getByRole("heading", {
      name: "立替経費の支払いまでの関係経路",
      level: 3,
    }),
  ).toBeVisible();

  const changeResultUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(changeResultUrl);
  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();

  await page.goto("/organizations/not-my-organization");
  await expect(
    page.getByRole("heading", {
      name: "指定された業務スペースは見つかりませんでした",
      level: 1,
    }),
  ).toBeVisible();

  await page.goto(initialEntityUrl);
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto(initialEntityUrl);
  await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(initialEntityUrl);

  await resetDemo(page, organizationSlug);
  await page.goto(changeResultUrl);
  await expect(
    page.getByRole("heading", {
      name: "指定されたデータは見つかりませんでした",
      level: 1,
    }),
  ).toBeVisible();
});

async function resetDemo(
  page: import("@playwright/test").Page,
  organizationSlug: string,
) {
  const resetButton = page.getByTestId("reset-demo-button");
  await expect(resetButton).toBeEnabled();
  const dialogHandled = page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await Promise.all([dialogHandled, resetButton.click()]);
  await expect(page).toHaveURL(
    new RegExp(`/organizations/${organizationSlug}/entities/[0-9a-f-]+$`),
  );
}
