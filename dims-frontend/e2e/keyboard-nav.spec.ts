import { test, expect } from "@playwright/test";
import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAuthenticated(page, "/mail/inbox", EMPLOYEE_USER);
    await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 15000 });
  });

  test("C shortcut should open compose", async ({ page }) => {
    // Focus the page body (not an input) and press C to compose
    await page.locator("body").click();
    await page.keyboard.press("c");

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  });

  test("mail list should be visible with items", async ({ page }) => {
    // Verify mail list renders with at least one item
    await expect(page.locator("[data-testid='mail-list']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".mail-list-item").first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking thread should open thread view", async ({ page }) => {
    // Click first mail item via the button inside it
    await expect(page.locator(".mail-list-item").first()).toBeVisible({ timeout: 10000 });
    await page.locator(".mail-list-item button").first().click();

    // Verify thread view is displayed
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible({ timeout: 10000 });
  });

  test("Escape should close compose modal", async ({ page }) => {
    // Open compose modal via TopBar button
    await page.click("button[aria-label='Compose new message']");
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });

    // Press Escape
    await page.keyboard.press("Escape");

    // Verify modal closes
    await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 10000 });
  });
});
