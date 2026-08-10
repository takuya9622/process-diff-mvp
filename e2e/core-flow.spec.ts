import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const INITIAL_RULE_LINE = "経費が3,000円以上の場合、領収書を添付する。";
const CHANGED_RULE_LINE =
  "金額にかかわらず、すべての経費申請に領収書を添付する。";
const PASSWORD = "process-diff-e2e-password";
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
});

test("登録後、業務を起点に変更せず業務構造を理解できる", async ({ page }) => {
  const fixture = await createWorkspace(page);

  await expect(
    page.getByText(fixture.userName, { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("オーナー", { exact: true })).toBeVisible();
  const primaryNavigation = page.getByRole("navigation", {
    name: "主ナビゲーション",
  });
  for (const itemName of [
    "ダッシュボード",
    "業務を開始",
    "自分の案件",
    "規定・文書",
    "コミュニケーション",
  ]) {
    await expect(
      primaryNavigation.getByRole("link", { name: new RegExp(itemName) }),
    ).toBeVisible();
  }
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
  await expect(page).toHaveURL(fixture.organizationUrl);
  await expect(
    page.getByRole("heading", {
      name: `${fixture.userName}さんの業務`,
      level: 1,
    }),
  ).toBeVisible();

  await resetDemo(page, fixture.organizationSlug);
  await expect(
    page.getByRole("heading", {
      name: `${fixture.userName}さんの業務`,
      level: 1,
    }),
  ).toBeVisible();
  await page.goto(changeResultUrl);
  await expect(
    page.getByRole("heading", {
      name: "指定されたデータは見つかりませんでした",
      level: 1,
    }),
  ).toBeVisible();
});

test("経費申請を差し戻し、再申請、承認、経理完了まで処理できる", async ({
  page,
}) => {
  const fixture = await createWorkspace(page);
  await page.goto(fixture.organizationUrl);

  await expect(
    page.getByRole("heading", {
      name: `${fixture.userName}さんの業務`,
      level: 1,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "新しい経費申請を始める", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "経費申請", level: 1 }),
  ).toBeVisible();

  await page.getByLabel(/経費発生日/).fill("2026-08-10");
  await page.getByLabel(/金額/).fill("12800");
  await page.getByLabel(/用途/).fill("顧客訪問のための交通費");
  await page.getByLabel(/支払先/).fill("東海旅客鉄道");
  await page.getByLabel(/領収書情報/).fill("電子領収書 R-2026-0810");
  await page
    .getByRole("button", { name: "内容を確認して申請", exact: true })
    .click();

  await expect(page).toHaveURL(
    new RegExp(`/organizations/${fixture.organizationSlug}/cases/[0-9a-f-]+$`),
  );
  const caseUrl = page.url();
  await expect(
    page.getByText("申請内容の承認", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("workflow version 1", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "この作業を開く", exact: true }).click();
  await expect(page).toHaveURL(/\/work-items\/[0-9a-f-]+$/);

  const returnReason = "訪問先と商談目的を追記してください。";
  await page.getByLabel("判断理由").fill(returnReason);
  await page.getByRole("button", { name: "差し戻す", exact: true }).click();
  await expect(page).toHaveURL(caseUrl);
  await expect(
    page.getByText("申請内容の修正・再申請", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "この作業を開く", exact: true }).click();
  await expect(page).toHaveURL(/\/work-items\/[0-9a-f-]+$/);
  await expect(
    page.locator("form").getByText(returnReason, { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel(/用途/)
    .fill("株式会社サンプルとの更新商談に伴う顧客訪問の交通費");
  await page
    .getByRole("button", { name: "修正して再申請", exact: true })
    .click();

  await expect(page).toHaveURL(caseUrl);
  await expect(
    page.getByText("承認 1回目 · 差し戻し", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "この作業を開く", exact: true }).click();
  await expect(page).toHaveURL(/\/work-items\/[0-9a-f-]+$/);
  await page.getByLabel("判断理由").fill("規程と領収書情報を確認しました。");
  await page.getByRole("button", { name: "承認する", exact: true }).click();

  await expect(page).toHaveURL(caseUrl);
  await expect(
    page.getByText("経理処理", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "この作業を開く", exact: true }).click();
  await expect(page).toHaveURL(/\/work-items\/[0-9a-f-]+$/);
  await page.getByLabel(/処理日/).fill("2026-08-11");
  await page.getByLabel(/処理参照番号/).fill("ACC-2026-0001");
  await page.getByLabel(/処理結果・証跡/).fill("振込データへ登録済み");
  await page
    .getByRole("button", { name: "経理処理を完了", exact: true })
    .click();

  await expect(page).toHaveURL(caseUrl);
  await expect(
    page.getByText("完了として確定しました", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "経理処理結果と証跡", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("ACC-2026-0001", { exact: true })).toBeVisible();
  await expect(
    page.getByText("振込データへ登録済み", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("承認 2回目 · 承認", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(caseUrl);
  for (const activity of [
    "経費申請を提出しました",
    "申請内容を差し戻しました",
    "申請内容を修正して再申請しました",
    "経費申請を承認しました",
    "経理処理を完了しました",
  ]) {
    await expect(page.getByText(activity, { exact: true })).toBeVisible();
  }
});

test("チャンネルを作成し、メッセージへ案件を添付して業務へ戻れる", async ({
  page,
}) => {
  const fixture = await createWorkspace(page);
  await page.goto(fixture.organizationUrl);
  await page
    .getByRole("link", { name: "新しい経費申請を始める", exact: true })
    .click();
  await page.getByLabel(/経費発生日/).fill("2026-08-10");
  await page.getByLabel(/金額/).fill("4200");
  await page.getByLabel(/用途/).fill("社内打ち合わせ用の備品購入");
  await page.getByLabel(/支払先/).fill("サンプル文具店");
  await page.getByLabel(/領収書情報/).fill("電子領収書 R-2026-CHAT");
  await page
    .getByRole("button", { name: "内容を確認して申請", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/organizations/${fixture.organizationSlug}/cases/[0-9a-f-]+$`),
  );
  const caseUrl = page.url();
  const caseNumber = "EXP-0001";
  await expect(
    page.getByText(caseNumber, { exact: false }).first(),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "主ナビゲーション" })
    .getByRole("link", { name: /コミュニケーション/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "チャンネル", level: 1 }),
  ).toBeVisible();
  await page.getByText("チャンネルを作成", { exact: true }).click();
  await page.getByLabel("チャンネル名").fill("支払い処理相談");
  await page
    .getByLabel("説明")
    .fill("承認後の支払い処理について案件を共有する場所");
  await page.getByRole("button", { name: "作成する", exact: true }).click();
  await expect(page).toHaveURL(/\/communication\?channel=[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "# 支払い処理相談", level: 2 }),
  ).toBeVisible();

  await page
    .getByLabel("メッセージ")
    .fill("この経費申請の支払い予定を確認してください。");
  await page.getByLabel("案件を添付（任意）").selectOption({
    label: `${caseNumber} · 経費申請 · 対応中`,
  });
  await page.getByRole("button", { name: "送信", exact: true }).click();

  await expect(
    page.getByText("この経費申請の支払い予定を確認してください。", {
      exact: true,
    }),
  ).toBeVisible();
  const sharedCase = page.getByRole("link", {
    name: new RegExp(`共有された案件 · ${caseNumber}`),
  });
  await expect(sharedCase).toBeVisible();
  await sharedCase.click();
  await expect(page).toHaveURL(caseUrl);
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
  await expect(page).toHaveURL(/\/organizations\/[^/]+$/);

  const organizationUrl = new URL(page.url());
  const organizationPath = organizationUrl.pathname;
  await page
    .getByRole("navigation", { name: "主ナビゲーション" })
    .getByRole("link", { name: /規定・文書/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "業務ナレッジ", level: 1 }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "経費申請", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(
    new RegExp(`${organizationPath}/entities/[0-9a-f-]+$`),
  );

  return {
    userName,
    email,
    organizationSlug: organizationUrl.pathname.split("/")[2],
    organizationUrl: `${organizationUrl.origin}${organizationPath}`,
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
    new RegExp(`/organizations/${organizationSlug}$`),
  );
}
