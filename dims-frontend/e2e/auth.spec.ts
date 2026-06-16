import { test, expect } from "@playwright/test";
import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";

test.describe("Authentication", () => {
  test("should redirect to inbox after successful login", async ({ page }) => {
    // Use navigateAuthenticated to verify the authenticated state lands on inbox
    await navigateAuthenticated(page, "/mail/inbox", EMPLOYEE_USER);

    // Wait for navigation to inbox
    await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 15000 });

    // Verify inbox heading is displayed
    await expect(page.locator("h2").filter({ hasText: /inbox/i })).toBeVisible({ timeout: 10000 });
  });

  test("should show toast error for invalid credentials", async ({ page }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || "http://localhost:8000/api";

    // Mock login to return 401
    await page.route(`${apiBase}/auth/login`, (route) => {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid email or password" }),
      });
    });

    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill("input[type='email']", "test@dana.com");
    await page.fill("input[type='password']", "wrong-password");
    await page.click("button[type='submit']");

    // Verify "Login failed" toast (use more specific title locator)
    await expect(
      page.locator("[role='region'] li").filter({ hasText: "Login failed" })
    ).toBeVisible({ timeout: 10000 });

    // Should remain on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // No auth cookie set — middleware should redirect to login
    await page.goto("/mail/inbox");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
  });
});
