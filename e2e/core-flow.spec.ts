import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const INITIAL_RULE_LINE = "経費が3,000円以上の場合、領収書を添付する。";
const CHANGED_RULE_LINE =
  "金額にかかわらず、すべての経費申請に領収書を添付する。";
const PASSWORD = "process-diff-e2e-password";

test("登録後、業務を起点に変更せず業務構造を理解できる", async ({ page }) => {
  const fixture = await createWorkspace(page);

  await expect(
    page.getByText(fixture.userName, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("アクセス権限: オーナー", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("業務を起点に全体像を理解し、必要なときは安全に変更できる", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "経費精算", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "経費申請", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "目的", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("v1", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "変更前後を確認", level: 1 }),
  ).toHaveCount(0);
  await expect(page.getByText("変更履歴", { exact: true })).toHaveCount(0);

  const structure = page.getByRole("region", { name: "業務の構成" });
  for (const groupName of [
    "ルール",
    "使用システム",
    "担当・承認",
    "関連文書",
    "後工程",
  ]) {
    await expect(
      structure.getByRole("heading", { name: groupName, level: 3 }),
    ).toBeVisible();
  }
  for (const entityName of [
    "領収書提出ルール",
    "金額別承認ルール",
    "経費申請システム",
    "申請者",
    "承認者",
    "経費申請マニュアル",
    "証憑確認",
  ]) {
    await expect(
      structure.getByRole("link", { name: new RegExp(entityName) }),
    ).toBeVisible();
  }

  const knowledgeSearch = page.getByRole("searchbox", {
    name: "業務知識を検索",
  });
  await knowledgeSearch.fill("マニュアル");
  await expect(
    page.getByRole("link", { name: "経費申請マニュアル", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "経費申請", exact: true }),
  ).toHaveCount(0);
  await knowledgeSearch.fill("");

  await structure.getByRole("link", { name: /領収書提出ルール/ }).click();
  await expect(
    page.getByRole("heading", { name: "領収書提出ルール", level: 1 }),
  ).toBeVisible();
  const relatedItems = page.getByRole("region", { name: "関連項目" });
  await expect(
    relatedItems.getByRole("heading", {
      name: "関係する業務",
      level: 3,
    }),
  ).toBeVisible();
  await relatedItems
    .getByRole("region", { name: "関係する業務" })
    .getByRole("link", { name: /^経費申請 / })
    .click();
  await expect(page).toHaveURL(fixture.initialEntityUrl);
  await expect(
    page.getByRole("heading", { name: "経費申請", level: 1 }),
  ).toBeVisible();
});

test("業務から変更対象を開き、安全な変更と組織境界を確認できる", async ({
  page,
}) => {
  const fixture = await createWorkspace(page);
  const structure = page.getByRole("region", { name: "業務の構成" });
  await structure.getByRole("link", { name: /領収書提出ルール/ }).click();
  await expect(
    page.getByRole("heading", { name: "領収書提出ルール", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(INITIAL_RULE_LINE)).toBeVisible();
  const changeTargetUrl = page.url();

  await page.getByRole("button", { name: "変更案を作成", exact: true }).click();
  await expect(
    page.getByText("変更案 · ステップ 1 / 2", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("変更内容はこの組織のメンバーだけに共有されます。", {
      exact: false,
    }),
  ).toBeVisible();
  const contentEditor = page.getByLabel("業務知識の本文 必須", {
    exact: true,
  });
  const currentContent = await contentEditor.inputValue();
  await contentEditor.fill(
    currentContent.replace(INITIAL_RULE_LINE, CHANGED_RULE_LINE),
  );
  await page
    .getByLabel("変更案の概要 任意", { exact: true })
    .fill("少額経費を含めて証憑の確認方法を統一するため");
  await page.getByRole("button", { name: "差分を確認", exact: true }).click();

  await expect(
    page.getByText("変更案 · ステップ 2 / 2", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(`削除: ${INITIAL_RULE_LINE}`)).toBeVisible();
  await expect(page.getByLabel(`追加: ${CHANGED_RULE_LINE}`)).toBeVisible();

  await page
    .getByRole("button", {
      name: "変更を反映",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    new RegExp(
      `/organizations/${fixture.organizationSlug}/changes/[0-9a-f-]+$`,
    ),
  );

  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("変更フロー完了", { exact: true })).toBeVisible();
  await expect(
    page.getByText(`${fixture.userName} ·`, { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("直接 4件", { exact: false })).toBeVisible();
  await expect(page.getByText("2段階先 6件", { exact: false })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const graph = page.getByTestId("impact-relation-graph");
  await expect(graph).toBeVisible();
  const mobileOverflow = await page.evaluate(() => {
    const graphElement = document.querySelector<HTMLElement>(
      '[data-testid="impact-relation-graph"]',
    );

    return {
      pageOverflows:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      graphScrolls: graphElement
        ? graphElement.scrollWidth > graphElement.clientWidth
        : false,
    };
  });
  expect(mobileOverflow).toEqual({
    pageOverflows: false,
    graphScrolls: true,
  });

  const candidateButtons = page.locator(
    "button[aria-pressed]:not([aria-label])",
  );
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
  await page.setViewportSize({ width: 1280, height: 720 });

  const changeResultUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(changeResultUrl);
  await expect(
    page.getByText("変更を保存しました", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "現在の業務知識へ戻る", exact: true })
    .click();
  await expect(page).toHaveURL(changeTargetUrl);
  await expect(
    page.getByRole("heading", { name: "目的", level: 2 }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(changeResultUrl);

  await page.goto("/organizations/not-my-organization");
  await expect(
    page.getByRole("heading", {
      name: "指定された業務スペースは見つかりませんでした",
      level: 1,
    }),
  ).toBeVisible();

  await page.goto(changeTargetUrl);
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto(changeTargetUrl);
  await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
  await page.getByLabel("メールアドレス").fill(fixture.email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(fixture.initialEntityUrl);
  await expect(
    page.getByRole("heading", { name: "経費申請", level: 1 }),
  ).toBeVisible();

  await resetDemo(page, fixture.organizationSlug);
  await expect(
    page.getByRole("heading", { name: "経費申請", level: 1 }),
  ).toBeVisible();
  await page.goto(changeResultUrl);
  await expect(
    page.getByRole("heading", {
      name: "指定されたデータは見つかりませんでした",
      level: 1,
    }),
  ).toBeVisible();
});

async function createWorkspace(page: Page) {
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

  return {
    userName,
    email,
    organizationSlug: organizationUrl.pathname.split("/")[2],
    initialEntityUrl: page.url(),
  };
}

async function resetDemo(page: Page, organizationSlug: string) {
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
