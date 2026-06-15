import { test, expect } from "@playwright/test";

test.describe("Mail Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each mail flow test
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);
  });

  test("should open inbox and display mail list", async ({ page }) => {
    // Verify mail list is displayed
    await expect(page.locator("[data-testid='mail-list']")).toBeVisible();

    // Verify at least one mail item is present
    await expect(page.locator(".mail-list-item").first()).toBeVisible();
  });

  test("should click thread and display messages", async ({ page }) => {
    // Click on first mail item
    await page.click(".mail-list-item:first-child");

    // Verify thread view is displayed
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible();
  });

  test("should reply to a message", async ({ page }) => {
    // Click on first mail item to open thread
    await page.click(".mail-list-item:first-child");
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible();

    // Click reply button
    await page.click("button[aria-label='Reply']");

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible();

    // Type reply
    await page.fill("textarea", "This is a test reply");

    // Send reply
    await page.click("button[aria-label='Send message']");

    // Verify success toast
    await expect(page.locator("text=Message sent")).toBeVisible();
  });

  test("should update sent folder after sending mail", async ({ page }) => {
    // Navigate to compose
    await page.click("button[aria-label='Compose']");

    // Fill compose form
    await page.fill("input[placeholder*='To']", "jane.smith@dana.com");
    await page.fill("input[placeholder*='Subject']", "Test E2E Message");
    await page.fill("textarea", "This is an end-to-end test message");

    // Send message
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible();

    // Navigate to sent folder
    await page.click("text=Sent");

    // Verify sent message appears in list
    await expect(page.locator("text=Test E2E Message")).toBeVisible();
  });
});
