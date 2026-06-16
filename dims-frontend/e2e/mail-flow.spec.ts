import { test, expect } from "@playwright/test";
import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";

test.describe("Mail Flow", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAuthenticated(page, "/mail/inbox", EMPLOYEE_USER);
    await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 15000 });
  });

  test("should open inbox and display mail list", async ({ page }) => {
    // Verify mail list is displayed
    await expect(page.locator("[data-testid='mail-list']")).toBeVisible({ timeout: 10000 });

    // Verify at least one mail item is present
    await expect(page.locator(".mail-list-item").first()).toBeVisible({ timeout: 10000 });
  });

  test("should click thread and display messages", async ({ page }) => {
    // Wait for mail list and click first item
    await expect(page.locator(".mail-list-item").first()).toBeVisible({ timeout: 10000 });
    await page.locator(".mail-list-item button").first().click();

    // Verify thread view is displayed
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible({ timeout: 10000 });
  });

  test("should reply to a message", async ({ page }) => {
    // Click on first mail item to open thread
    await expect(page.locator(".mail-list-item").first()).toBeVisible({ timeout: 10000 });
    await page.locator(".mail-list-item button").first().click();
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible({ timeout: 10000 });

    // Click reply button
    await page.click("button[aria-label='Reply to message']");

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });

    // Type reply
    await page.fill("textarea", "This is a test reply");

    // Send reply
    await page.click("button[aria-label='Send message']");

    // Verify success toast
    await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });
  });

  test("should update sent folder after sending mail", async ({ page }) => {
    // Navigate to compose via TopBar button
    await page.click("button[aria-label='Compose new message']");

    // Fill compose form
    await page.fill("input[placeholder='To (comma separated)']", "jane.smith@dana.com");
    await page.fill("input[placeholder='Subject']", "Test E2E Message");
    await page.fill("textarea", "This is an end-to-end test message");

    // Send message
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });

    // Navigate to sent folder
    await page.click("a[href*='mail/sent'], button:has-text('Sent')");

    // Verify sent folder loads
    await expect(page.locator("[data-testid='mail-list']")).toBeVisible({ timeout: 10000 });
  });
});
