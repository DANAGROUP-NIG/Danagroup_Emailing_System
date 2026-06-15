import { test, expect } from "@playwright/test";

test.describe("Admin RBAC", () => {
  test("employee cannot access admin users page", async ({ page }) => {
    // Login as employee
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);

    // Try to access admin page
    await page.goto("/admin/users");

    // Should show access denied
    await expect(page.locator("text=Access Denied")).toBeVisible();
  });

  test("admin can access admin panel", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill("input[type='email']", "admin@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);

    // Navigate to admin
    await page.goto("/admin/users");

    // Should see admin content
    await expect(page.locator("[data-testid='admin-panel']")).toBeVisible();
  });

  test("subsidiary admin can access admin panel", async ({ page }) => {
    // Login as subsidiary admin
    await page.goto("/login");
    await page.fill("input[type='email']", "bob.johnson@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);

    // Navigate to admin
    await page.goto("/admin/users");

    // Should see admin content
    await expect(page.locator("[data-testid='admin-panel']")).toBeVisible();
  });
});
