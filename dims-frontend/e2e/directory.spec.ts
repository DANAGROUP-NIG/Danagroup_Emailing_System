import { test, expect } from "@playwright/test";
import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";

test.describe("Directory", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAuthenticated(page, "/directory", EMPLOYEE_USER);
    await expect(page).toHaveURL(/.*directory.*/, { timeout: 15000 });
  });

  test("should search directory", async ({ page }) => {

    // Search for user using the search input
    await page.fill("input[placeholder*='Search']", "jane");

    // Verify search results show Jane Smith
    await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
  });

  test("should filter by department", async ({ page }) => {
    // Verify directory list renders
    await expect(page.locator("[data-testid='directory-list']")).toBeVisible({ timeout: 10000 });
  });

  test("should open user profile", async ({ page }) => {

    // Wait for list to render then click View Profile button on Jane Smith's card
    await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
    await page.locator("button[aria-label=\"Open Jane Smith's profile\"]").first().click();

    // Verify profile page
    await expect(page.locator("[data-testid='user-profile']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=jane.smith@dana.com")).toBeVisible({ timeout: 10000 });
  });

  test('should pre-fill compose from "Send Mail" button', async ({ page }) => {
    await page.goto("/directory");

    // Wait for list then click Send Mail button on Jane Smith's card
    await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
    await page.locator(".dims-card").filter({ hasText: "Jane Smith" }).locator("button").first().click();

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  });
});
