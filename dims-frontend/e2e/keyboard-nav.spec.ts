import { test, expect } from "@playwright/test";

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);
  });

  test("Cmd+K should open search", async ({ page }) => {
    // Press Cmd+K
    await page.keyboard.press("Meta+KeyK");

    // Verify search modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible();
    await expect(
      page.locator("[placeholder*='Search mail']")
    ).toBeFocused();
  });

  test("J/K should navigate inbox", async ({ page }) => {
    // Focus mail list
    await page.click("[data-testid='mail-list']");

    // Press J to navigate down
    await page.keyboard.press("KeyJ");

    // Verify first item is selected
    const firstItem = page.locator(".mail-list-item.selected").first();
    await expect(firstItem).toBeVisible();

    // Press K to navigate up (should stay on first)
    await page.keyboard.press("KeyK");

    // First item should still be selected
    await expect(firstItem).toBeVisible();
  });

  test("Enter should open selected thread", async ({ page }) => {
    // Focus mail list and select item
    await page.click("[data-testid='mail-list']");
    await page.keyboard.press("KeyJ");

    // Press Enter to open
    await page.keyboard.press("Enter");

    // Verify thread view is displayed
    await expect(page.locator("[data-testid='thread-view']")).toBeVisible();
  });

  test("Escape should close modals", async ({ page }) => {
    // Open compose modal
    await page.click("button[aria-label='Compose']");
    await expect(page.locator("[role='dialog']")).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Verify modal closes
    await expect(page.locator("[role='dialog']")).not.toBeVisible();
  });
});
