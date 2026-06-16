import { test, expect } from "@playwright/test";
import {
  navigateAuthenticated,
  EMPLOYEE_USER,
  ADMIN_USER,
  SUBSIDIARY_ADMIN_USER,
} from "./helpers/mock-api";

test.describe("Admin RBAC", () => {
  test("employee cannot access admin users page", async ({ page }) => {
    // Navigate as employee directly to admin — middleware should redirect to inbox
    await navigateAuthenticated(page, "/admin/users", EMPLOYEE_USER);
    await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 10000 });
  });

  test("admin can access admin panel", async ({ page }) => {
    // Navigate as group_admin directly to admin panel
    await navigateAuthenticated(page, "/admin/users", ADMIN_USER);
    await expect(page).toHaveURL(/.*admin\/users.*/, { timeout: 10000 });

    // Should see admin content
    await expect(page.locator("[data-testid='admin-panel']")).toBeVisible({ timeout: 10000 });
  });

  test("subsidiary admin can access admin panel", async ({ page }) => {
    // Navigate as subsidiary_admin directly to admin panel
    await navigateAuthenticated(page, "/admin/users", SUBSIDIARY_ADMIN_USER);
    await expect(page).toHaveURL(/.*admin\/users.*/, { timeout: 10000 });

    // Should see admin content
    await expect(page.locator("[data-testid='admin-panel']")).toBeVisible({ timeout: 10000 });
  });
});
