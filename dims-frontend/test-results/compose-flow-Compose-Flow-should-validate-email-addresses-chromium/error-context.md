# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: compose-flow.spec.ts >> Compose Flow >> should validate email addresses
- Location: e2e/compose-flow.spec.ts:67:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*mail\/inbox.*/
Received string:  "http://localhost:3000/login?redirect=%2Fmail%2Finbox"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × unexpected value "http://localhost:3000/login?redirect=%2Fmail%2Finbox"

```

```yaml
- img "Dana Group logo"
- text: Dana Group
- paragraph: Internal Communication. Reimagined.
- paragraph: DIMS keeps every message, announcement, and conversation across Dana Group subsidiaries in one secure place.
- paragraph: © 2026 Dana Group. All rights reserved.
- heading "Welcome back" [level=1]
- paragraph: Sign in to your DIMS account to continue.
- form "Sign in to DIMS":
  - text: Email address
  - textbox "Email address":
    - /placeholder: you@danagroup.internal
  - text: Password
  - textbox "Password":
    - /placeholder: Enter your password
  - button "Show password":
    - img
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot password?":
    - /url: /forgot-password
  - button "Sign in"
- region "Notifications (F8)":
  - list
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateAuthenticated, EMPLOYEE_USER } from "./helpers/mock-api";
  3  | 
  4  | test.describe("Compose Flow", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await navigateAuthenticated(page, "/mail/inbox", EMPLOYEE_USER);
> 7  |     await expect(page).toHaveURL(/.*mail\/inbox.*/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  8  |   });
  9  | 
  10 |   test("should compose new mail with recipients", async ({ page }) => {
  11 |     // Click compose button
  12 |     await page.click("button[aria-label='Compose new message']");
  13 | 
  14 |     // Verify compose modal opens
  15 |     await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  16 | 
  17 |     // Add recipients
  18 |     await page.fill("input[placeholder='To (comma separated)']", "jane.smith@dana.com, bob@dana.com");
  19 |     await page.fill("input[placeholder='Subject']", "E2E Test with Recipients");
  20 |     await page.fill("textarea", "Testing recipient input with multiple emails");
  21 | 
  22 |     // Send message
  23 |     await page.click("button[aria-label='Send message']");
  24 | 
  25 |     // Verify success
  26 |     await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });
  27 |   });
  28 | 
  29 |   test("should save draft while composing", async ({ page }) => {
  30 |     // Open compose
  31 |     await page.click("button[aria-label='Compose new message']");
  32 | 
  33 |     // Fill partial content
  34 |     await page.fill("input[placeholder='To (comma separated)']", "recipient@dana.com");
  35 |     await page.fill("input[placeholder='Subject']", "Draft Test");
  36 | 
  37 |     // Close modal (triggers draft save)
  38 |     await page.click("button[aria-label='Close and save draft']");
  39 | 
  40 |     // Verify modal is closed
  41 |     await expect(page.locator("[role='dialog']")).not.toBeVisible({ timeout: 10000 });
  42 | 
  43 |     // Navigate to drafts folder
  44 |     await page.click("a[href*='mail/drafts'], button:has-text('Drafts')");
  45 | 
  46 |     // Verify drafts folder loads
  47 |     await expect(page.locator("[data-testid='mail-list']")).toBeVisible({ timeout: 10000 });
  48 |   });
  49 | 
  50 |   test("should send mail with attachment", async ({ page }) => {
  51 |     // Open compose
  52 |     await page.click("button[aria-label='Compose new message']");
  53 |     await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  54 | 
  55 |     // Fill form
  56 |     await page.fill("input[placeholder='To (comma separated)']", "recipient@dana.com");
  57 |     await page.fill("input[placeholder='Subject']", "Attachment Test");
  58 |     await page.fill("textarea", "See attached file");
  59 | 
  60 |     // Send message (skip file upload — needs real file API)
  61 |     await page.click("button[aria-label='Send message']");
  62 | 
  63 |     // Verify success
  64 |     await expect(page.locator("text=Message sent")).toBeVisible({ timeout: 10000 });
  65 |   });
  66 | 
  67 |   test("should validate email addresses", async ({ page }) => {
  68 |     // Open compose
  69 |     await page.click("button[aria-label='Compose new message']");
  70 |     await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  71 | 
  72 |     // Enter invalid email
  73 |     await page.fill("input[placeholder='To (comma separated)']", "invalid-email");
  74 |     await page.fill("input[placeholder='Subject']", "Validation Test");
  75 |     await page.fill("textarea", "Test body");
  76 | 
  77 |     // Try to send
  78 |     await page.click("button[aria-label='Send message']");
  79 | 
  80 |     // Should show validation error
  81 |     await expect(page.locator("text=Invalid email")).toBeVisible({ timeout: 10000 });
  82 |   });
  83 | });
  84 | 
```