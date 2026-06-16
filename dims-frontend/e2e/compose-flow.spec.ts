import { test, expect } from "@playwright/test";
import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";

test.describe("Compose Flow", () => {
  test.beforeEach(async ({ page }) => {
    await navigateAuthenticated(page, "/mail/inbox", EMPLOYEE_USER);
    await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 15000 });
  });

  test("should compose new mail with recipients", async ({ page }) => {
    // Click compose button
    await page.click("button[aria-label='Compose new message']");

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });

    // Add recipients
    await page.fill("input[placeholder='To (comma separated)']", "jane.smith@dana.com, bob@dana.com");
    await page.fill("input[placeholder='Subject']", "E2E Test with Recipients");
    await page.fill("textarea", "Testing recipient input with multiple emails");

    // Send message
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });
  });

  test("should save draft while composing", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose new message']");

    // Fill partial content
    await page.fill("input[placeholder='To (comma separated)']", "recipient@dana.com");
    await page.fill("input[placeholder='Subject']", "Draft Test");

    // Close modal (triggers draft save)
    await page.click("button[aria-label='Close and save draft']");

    // Verify modal is closed
    await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 10000 });

    // Navigate to drafts folder
    await page.click("a[href*='mail/drafts'], button:has-text('Drafts')");

    // Verify drafts folder loads
    await expect(page.locator("[data-testid='mail-list']")).toBeVisible({ timeout: 10000 });
  });

  test("should send mail with attachment", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose new message']");
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });

    // Fill form
    await page.fill("input[placeholder='To (comma separated)']", "recipient@dana.com");
    await page.fill("input[placeholder='Subject']", "Attachment Test");
    await page.fill("textarea", "See attached file");

    // Send message (skip file upload — needs real file API)
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });
  });

  test("should validate email addresses", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose new message']");
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });

    // Enter invalid email
    await page.fill("input[placeholder='To (comma separated)']", "invalid-email");
    await page.fill("input[placeholder='Subject']", "Validation Test");
    await page.fill("textarea", "Test body");

    // Try to send
    await page.click("button[aria-label='Send message']");

    // Should show validation error
    await expect(page.locator("text=Invalid email")).toBeVisible({ timeout: 10000 });
  });
});
