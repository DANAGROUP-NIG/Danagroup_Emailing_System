import { type Page } from "@playwright/test";

/**
 * Builds a minimal unsigned JWT that passes the middleware's decodeJwt check.
 * The middleware only does signature verification when JWT_SECRET is set;
 * in CI / test environments it is absent, so decode-only is enough.
 */
function buildFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = "fakesig";
  return `${header}.${body}.${sig}`;
}

export const EMPLOYEE_USER = {
  id: "user-employee-1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@dana.com",
  role: "employee" as const,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

export const ADMIN_USER = {
  id: "user-admin-1",
  firstName: "Admin",
  lastName: "User",
  email: "admin@dana.com",
  role: "group_admin" as const,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

export const SUBSIDIARY_ADMIN_USER = {
  id: "user-subadmin-1",
  firstName: "Bob",
  lastName: "Johnson",
  email: "bob.johnson@dana.com",
  role: "subsidiary_admin" as const,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

export const JANE_USER = {
  id: "user-jane-1",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@dana.com",
  role: "employee" as const,
  jobTitle: "Engineer",
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  department: { id: "dept-1", name: "Engineering", subsidiaryId: "sub-1", createdAt: "2024-01-01T00:00:00Z" },
};

const MOCK_THREADS = [
  {
    id: "thread-1",
    subject: "Test Thread 1",
    unreadCount: 1,
    isStarred: false,
    updatedAt: new Date().toISOString(),
    latestMessage: {
      id: "msg-1",
      threadId: "thread-1",
      body: "Hello world",
      createdAt: new Date().toISOString(),
      sender: { id: "user-jane-1", email: "jane.smith@dana.com", name: "Jane Smith" },
    },
  },
];

const MOCK_THREAD_DETAIL = {
  threadId: "thread-1",
  messages: [
    {
      id: "msg-1",
      threadId: "thread-1",
      subject: "Test Thread 1",
      body: "Hello world",
      isDraft: false,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sender: { id: "user-jane-1", email: "jane.smith@dana.com", name: "Jane Smith" },
      recipients: [],
      attachments: [],
      isRead: true,
      isStarred: false,
      preview: "Hello world",
    },
  ],
};

const MOCK_USERS = [EMPLOYEE_USER, ADMIN_USER, SUBSIDIARY_ADMIN_USER, JANE_USER];

/**
 * Sets up a fake auth cookie so the middleware lets the browser through to
 * protected routes, and intercepts all backend API calls so CI doesn't need
 * a running backend server.
 */
type MockUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export async function setupAuthMocks(
  page: Page,
  user: MockUser = EMPLOYEE_USER,
): Promise<void> {
  const apiBase = process.env.PLAYWRIGHT_API_URL || "http://localhost:8000/api";

  const exp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
  const token = buildFakeJwt({ sub: user.id, email: user.email, role: user.role, exp });

  // Intercept the backend API before any navigation
  await page.route(`${apiBase}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // POST /auth/login
    if (url.includes("/auth/login") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Set-Cookie": `access_token=${token}; Path=/; HttpOnly`,
        },
        body: JSON.stringify({ success: true, data: { user } }),
      });
    }

    // GET /auth/me
    if (url.includes("/auth/me") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: user }),
      });
    }

    // POST /auth/logout
    if (url.includes("/auth/logout") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    // GET /mail/inbox | /mail/sent | /mail/starred | /mail/trash
    if (url.match(/\/mail\/(inbox|sent|starred|trash)/) && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: MOCK_THREADS,
          pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    }

    // GET /mail/drafts
    if (url.includes("/mail/drafts") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "draft-1",
              threadId: "thread-draft-1",
              subject: "Draft Test",
              body: "",
              isDraft: true,
              createdAt: new Date().toISOString(),
              recipients: [],
              attachments: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    }

    // GET /mail/threads/:id
    if (url.match(/\/mail\/threads\/[^/]+$/) && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_THREAD_DETAIL),
      });
    }

    // POST /mail/send
    if (url.includes("/mail/send") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { id: "msg-new-1" } }),
      });
    }

    // POST /mail/draft
    if (url.includes("/mail/draft") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "draft-new-1" }),
      });
    }

    // GET /users/search
    if (url.includes("/users/search") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_USERS }),
      });
    }

    // GET /users/:id  (single user profile)
    if (url.match(/\/users\/[^/?]+$/) && method === "GET") {
      const id = url.split("/users/")[1]?.split("?")[0];
      const found = MOCK_USERS.find((u) => u.id === id) ?? JANE_USER;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
    }

    // GET /users (list — admin panel + directory)
    if (url.includes("/users") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: MOCK_USERS,
          pagination: { total: MOCK_USERS.length, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    }

    // GET /search
    if (url.includes("/search") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { results: [] } }),
      });
    }

    // GET /departments
    if (url.includes("/departments") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: "dept-1", name: "Engineering", subsidiaryId: "sub-1", createdAt: "2024-01-01T00:00:00Z" }],
        }),
      });
    }

    // GET /subsidiaries
    if (url.includes("/subsidiaries") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ id: "sub-1", name: "Dana Tech", domain: "dana.com", createdAt: "2024-01-01T00:00:00Z" }],
        }),
      });
    }

    // GET /notifications
    if (url.includes("/notifications") && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      });
    }

    // POST /auth/refresh
    if (url.includes("/auth/refresh") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    // POST /files/avatar or any other file upload
    if (url.includes("/files") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { avatarUrl: "" } }),
      });
    }

    // Fallback — return 404 so the page load is never blocked by a hanging request
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "Not found (mock fallback)" }),
    });
  });

  // Inject the cookie so middleware sees the user as authenticated
  await page.context().addCookies([
    {
      name: "access_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

/**
 * Inject auth cookie + Zustand localStorage state then navigate directly to a
 * protected page — no login form interaction required.
 *
 * Works because:
 *  - The middleware reads the `access_token` cookie (injected via addCookies).
 *  - The AppShell/authStore reads `dims-auth` from localStorage (injected here).
 */
export async function navigateAuthenticated(
  page: Page,
  path = "/mail/inbox",
  user: MockUser = EMPLOYEE_USER,
): Promise<void> {
  await setupAuthMocks(page, user);

  // We need a page context to set localStorage — do a quick goto first
  await page.goto("/login");

  // Inject Zustand persisted auth state into localStorage
  await page.evaluate(
    ([u]) => {
      const state = { state: { user: u, isAuthenticated: true }, version: 0 };
      localStorage.setItem("dims-auth", JSON.stringify(state));
    },
    [user] as const,
  );

  // Now navigate to the protected page — cookie + localStorage are both set
  await page.goto(path);
}

/**
 * Logs in through the UI form (uses mocked API responses).
 */
export async function loginViaUI(
  page: Page,
  email = "john.doe@dana.com",
  password = "password123",
): Promise<void> {
  await page.goto("/login");
  await page.fill("input[type='email']", email);
  await page.fill("input[type='password']", password);
  await page.click("button[type='submit']");
}
