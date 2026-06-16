# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: directory.spec.ts >> Directory >> should filter by department
- Location: e2e/directory.spec.ts:19:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid=\'directory-list\']')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid=\'directory-list\']')

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
  4  | test.describe("Directory", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await navigateAuthenticated(page, "/directory", EMPLOYEE_USER);
  7  |     await expect(page).toHaveURL(/.*directory.*/, { timeout: 15000 });
  8  |   });
  9  | 
  10 |   test("should search directory", async ({ page }) => {
  11 | 
  12 |     // Search for user using the search input
  13 |     await page.fill("input[placeholder*='Search']", "jane");
  14 | 
  15 |     // Verify search results show Jane Smith
  16 |     await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
  17 |   });
  18 | 
  19 |   test("should filter by department", async ({ page }) => {
  20 |     // Verify directory list renders
> 21 |     await expect(page.locator("[data-testid='directory-list']")).toBeVisible({ timeout: 10000 });
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  22 |   });
  23 | 
  24 |   test("should open user profile", async ({ page }) => {
  25 | 
  26 |     // Wait for list to render then click View Profile button on Jane Smith's card
  27 |     await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
  28 |     await page.locator("button[aria-label=\"Open Jane Smith's profile\"]").first().click();
  29 | 
  30 |     // Verify profile page
  31 |     await expect(page.locator("[data-testid='user-profile']")).toBeVisible({ timeout: 10000 });
  32 |     await expect(page.locator("text=jane.smith@dana.com")).toBeVisible({ timeout: 10000 });
  33 |   });
  34 | 
  35 |   test('should pre-fill compose from "Send Mail" button', async ({ page }) => {
  36 |     await page.goto("/directory");
  37 | 
  38 |     // Wait for list then click Send Mail button on Jane Smith's card
  39 |     await expect(page.locator("text=Jane Smith")).toBeVisible({ timeout: 10000 });
  40 |     await page.locator(".dims-card").filter({ hasText: "Jane Smith" }).locator("button").first().click();
  41 | 
  42 |     // Verify compose modal opens
  43 |     await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
  44 |   });
  45 | });
  46 | 
```