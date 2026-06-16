# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-rbac.spec.ts >> Admin RBAC >> subsidiary admin can access admin panel
- Location: e2e/admin-rbac.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/admin/users", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - generic [ref=e6]:
        - generic [ref=e7]:
          - img "Dana Group logo" [ref=e8]
          - generic [ref=e9]: Dana Group
        - generic [ref=e10]:
          - paragraph [ref=e11]: Internal Communication. Reimagined.
          - paragraph [ref=e12]: DIMS keeps every message, announcement, and conversation across Dana Group subsidiaries in one secure place.
        - paragraph [ref=e13]: © 2026 Dana Group. All rights reserved.
    - generic [ref=e17]:
      - generic [ref=e18]:
        - heading "Welcome back" [level=1] [ref=e19]
        - paragraph [ref=e20]: Sign in to your DIMS account to continue.
      - form "Sign in to DIMS" [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Email address
          - textbox "Email address" [ref=e25]:
            - /placeholder: you@danagroup.internal
        - generic [ref=e27]:
          - generic [ref=e28]: Password
          - generic [ref=e29]:
            - textbox "Password" [ref=e30]:
              - /placeholder: Enter your password
            - button "Show password" [ref=e31] [cursor=pointer]:
              - img [ref=e32]
        - generic [ref=e35]:
          - generic [ref=e36] [cursor=pointer]:
            - checkbox "Remember me" [ref=e37]
            - text: Remember me
          - link "Forgot password?" [ref=e38] [cursor=pointer]:
            - /url: /forgot-password
        - button "Sign in" [ref=e39] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  241 |       });
  242 |     }
  243 | 
  244 |     // GET /users (list — admin panel + directory)
  245 |     if (url.includes("/users") && method === "GET") {
  246 |       return route.fulfill({
  247 |         status: 200,
  248 |         contentType: "application/json",
  249 |         body: JSON.stringify({
  250 |           data: MOCK_USERS,
  251 |           pagination: { total: MOCK_USERS.length, page: 1, limit: 20, totalPages: 1 },
  252 |         }),
  253 |       });
  254 |     }
  255 | 
  256 |     // GET /search
  257 |     if (url.includes("/search") && method === "GET") {
  258 |       return route.fulfill({
  259 |         status: 200,
  260 |         contentType: "application/json",
  261 |         body: JSON.stringify({ data: { results: [] } }),
  262 |       });
  263 |     }
  264 | 
  265 |     // GET /departments
  266 |     if (url.includes("/departments") && method === "GET") {
  267 |       return route.fulfill({
  268 |         status: 200,
  269 |         contentType: "application/json",
  270 |         body: JSON.stringify({
  271 |           data: [{ id: "dept-1", name: "Engineering", subsidiaryId: "sub-1", createdAt: "2024-01-01T00:00:00Z" }],
  272 |         }),
  273 |       });
  274 |     }
  275 | 
  276 |     // GET /subsidiaries
  277 |     if (url.includes("/subsidiaries") && method === "GET") {
  278 |       return route.fulfill({
  279 |         status: 200,
  280 |         contentType: "application/json",
  281 |         body: JSON.stringify({
  282 |           data: [{ id: "sub-1", name: "Dana Tech", domain: "dana.com", createdAt: "2024-01-01T00:00:00Z" }],
  283 |         }),
  284 |       });
  285 |     }
  286 | 
  287 |     // GET /notifications
  288 |     if (url.includes("/notifications") && method === "GET") {
  289 |       return route.fulfill({
  290 |         status: 200,
  291 |         contentType: "application/json",
  292 |         body: JSON.stringify({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
  293 |       });
  294 |     }
  295 | 
  296 |     // Fallback — pass through (shouldn't hit in CI)
  297 |     return route.continue();
  298 |   });
  299 | 
  300 |   // Inject the cookie so middleware sees the user as authenticated
  301 |   await page.context().addCookies([
  302 |     {
  303 |       name: "access_token",
  304 |       value: token,
  305 |       domain: "localhost",
  306 |       path: "/",
  307 |       httpOnly: true,
  308 |       sameSite: "Strict",
  309 |     },
  310 |   ]);
  311 | }
  312 | 
  313 | /**
  314 |  * Inject auth cookie + Zustand localStorage state then navigate directly to a
  315 |  * protected page — no login form interaction required.
  316 |  *
  317 |  * Works because:
  318 |  *  - The middleware reads the `access_token` cookie (injected via addCookies).
  319 |  *  - The AppShell/authStore reads `dims-auth` from localStorage (injected here).
  320 |  */
  321 | export async function navigateAuthenticated(
  322 |   page: Page,
  323 |   path = "/mail/inbox",
  324 |   user: MockUser = EMPLOYEE_USER,
  325 | ): Promise<void> {
  326 |   await setupAuthMocks(page, user);
  327 | 
  328 |   // We need a page context to set localStorage — do a quick goto first
  329 |   await page.goto("/login");
  330 | 
  331 |   // Inject Zustand persisted auth state into localStorage
  332 |   await page.evaluate(
  333 |     ([u]) => {
  334 |       const state = { state: { user: u, isAuthenticated: true }, version: 0 };
  335 |       localStorage.setItem("dims-auth", JSON.stringify(state));
  336 |     },
  337 |     [user] as const,
  338 |   );
  339 | 
  340 |   // Now navigate to the protected page — cookie + localStorage are both set
> 341 |   await page.goto(path);
      |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  342 | }
  343 | 
  344 | /**
  345 |  * Logs in through the UI form (uses mocked API responses).
  346 |  */
  347 | export async function loginViaUI(
  348 |   page: Page,
  349 |   email = "john.doe@dana.com",
  350 |   password = "password123",
  351 | ): Promise<void> {
  352 |   await page.goto("/login");
  353 |   await page.fill("input[type='email']", email);
  354 |   await page.fill("input[type='password']", password);
  355 |   await page.click("button[type='submit']");
  356 | }
  357 | 
```