import { test, expect } from "@playwright/test";

test.describe("Compose Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);
  });

  test("should compose new mail with recipients", async ({ page }) => {
    // Click compose button
    await page.click("button[aria-label='Compose']");

    // Verify compose modal opens
    await expect(page.locator("[role='dialog']")).toBeVisible();

    // Add recipients
    await page.fill("input[placeholder*='To']", "jane.smith@dana.com, bob@dana.com");
    await page.fill("input[placeholder*='Subject']", "E2E Test with Recipients");
    await page.fill("textarea", "Testing recipient input with multiple emails");

    // Send message
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible();
  });

  test("should save draft while composing", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose']");

    // Fill partial content
    await page.fill("input[placeholder*='To']", "recipient@dana.com");
    await page.fill("input[placeholder*='Subject']", "Draft Test");

    // Close modal (should trigger autosave)
    await page.click("button[aria-label='Close and save draft']");

    // Navigate to drafts folder
    await page.click("text=Drafts");

    // Verify draft was saved
    await expect(page.locator("text=Draft Test")).toBeVisible();
  });

  test("should send mail with attachment", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose']");

    // Fill form
    await page.fill("input[placeholder*='To']", "recipient@dana.com");
    await page.fill("input[placeholder*='Subject']", "Attachment Test");
    await page.fill("textarea", "See attached file");

    // Upload attachment
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "test-file.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake pdf content"),
    });

    // Wait for upload to complete
    await expect(page.locator("text=test-file.pdf")).toBeVisible();

    // Send message
    await page.click("button[aria-label='Send message']");

    // Verify success
    await expect(page.locator("text=Message sent")).toBeVisible();
  });

  test("should validate email addresses", async ({ page }) => {
    // Open compose
    await page.click("button[aria-label='Compose']");

    // Enter invalid email
    await page.fill("input[placeholder*='To']", "invalid-email");
    await page.fill("input[placeholder*='Subject']", "Validation Test");
    await page.fill("textarea", "Test body");

    // Try to send
    await page.click("button[aria-label='Send message']");

    // Should show validation error
    await expect(page.locator("text=Invalid email")).toBeVisible();
  });
});
