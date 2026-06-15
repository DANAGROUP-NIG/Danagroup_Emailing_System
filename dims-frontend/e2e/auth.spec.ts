import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to inbox after successful login", async ({ page }) => {
    await page.goto("/login");

    // Fill in login credentials
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");

    // Wait for navigation to inbox
    await expect(page).toHaveURL(/.*mail\/inbox.*/);

    // Verify inbox is displayed
    await expect(page.locator("text=Inbox")).toBeVisible();
  });

  test("should show toast error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.fill("input[type='email']", "test@dana.com");
    await page.fill("input[type='password']", "wrong-password");
    await page.click("button[type='submit']");

    // Verify error toast is displayed
    await expect(
      page.locator("text=Invalid email or password")
    ).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Try to access protected route directly
    await page.goto("/mail/inbox");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });
});
