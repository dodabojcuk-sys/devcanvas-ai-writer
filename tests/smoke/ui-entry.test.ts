import { expect, test } from "@playwright/test";

const forbiddenInternalWords = [
  /\bsystem\b/i,
  /\bdebug\b/i,
  /\bkernel\b/i,
  /\bgraph\b/i,
  /\bruntime\b/i,
  /\bexecution\b/i,
  /系统/,
  /执行/,
  /调度/,
];

const sourceFixture = [
  "角色：林澈是云港城的夜航员。",
  "地点：云港城悬在潮汐上方，港口里停着失眠的飞艇。",
  "规则：只有持有潮汐钥匙的人才能穿过雾门。",
  "林澈与白芷在旧灯塔重逢。",
  "那天雾门打开之后，城市的影子开始倒流。",
].join("\n");
const uiEntryUrl = process.env.DEVCANVAS_BASE_URL || "http://127.0.0.1:3000";

function expectNoInternalWords(text: string) {
  for (const word of forbiddenInternalWords) {
    expect(text).not.toMatch(word);
  }
}

test.describe("DevCanvas production UI entry", () => {
  test("loads Tianyi, renders Creative Mode, and keeps writing flow usable", async ({ page }) => {
    await page.goto(uiEntryUrl);

    await expect(page.getByLabel("Source reading")).toBeVisible();
    await expect(page.getByLabel("Writing flow")).toBeVisible();

    await page.locator(".dcw-source-field").fill(sourceFixture);
    await page.getByRole("button", { name: /Trace the world/i }).click();

    await expect(page.getByText("Story pulse")).toBeVisible();
    await expect(page.getByText("林澈", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Rules").getByText(/潮汐钥匙/).first()).toBeVisible();

    const writingInput = page.locator("#tianyi-writing-input");
    await expect(writingInput).toBeVisible();
    await writingInput.fill("让林澈继续走进雾门");
    await page.getByRole("button", { name: /Let the scene continue/i }).click();

    await expect(page.getByText(/林澈继续走进雾门/)).toBeVisible();
    expectNoInternalWords(await page.locator("body").innerText());
  });
});
