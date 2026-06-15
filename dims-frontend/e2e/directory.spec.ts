import { test, expect } from "@playwright/test";

test.describe("Directory", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);
  });

  test("should search directory", async ({ page }) => {
    // Navigate to directory
    await page.goto("/directory");

    // Search for user
    await page.fill("[placeholder*='Search']", "jane");

    // Verify search results
    await expect(page.locator("text=Jane Smith")).toBeVisible();
  });

  test("should filter by department", async ({ page }) => {
    await page.goto("/directory");

    // Open department filter
    await page.click("text=Department");
    await page.click("text=Engineering");

    // Verify filtered results
    await expect(page.locator("[data-testid='directory-list']")).toBeVisible();
  });

  test("should open user profile", async ({ page }) => {
    await page.goto("/directory");

    // Click on a user
    await page.click("text=Jane Smith");

    // Verify profile page
    await expect(page.locator("[data-testid='user-profile']")).toBeVisible();
    await expect(page.locator("text=jane.smith@dana.com")).toBeVisible();
  });

  test('should pre-fill compose from "Send Mail" button', async ({ page }) => {
    // Navigate to profile
    await page.goto("/directory");
    await page.click("text=Jane Smith");

    // Click Send Mail button
    await page.click("button:has-text('Send Mail')");

    // Verify compose modal opens with pre-filled recipient
    await expect(page.locator("[role='dialog']")).toBeVisible();
    await expect(
      page.locator("input[value*='jane.smith@dana.com']")
    ).toBeVisible();
  });
});
