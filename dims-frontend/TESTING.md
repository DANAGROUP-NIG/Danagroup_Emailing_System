# DIMS Frontend Testing Guide

This document describes the testing setup and how to run tests for the DIMS frontend application.

## Test Stack

- **Unit Testing Framework**: Vitest
- **Component Testing**: React Testing Library + jsdom
- **API Mocking**: MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Coverage**: v8 (via @vitest/coverage-v8)

## Directory Structure

```
dims-frontend/
├── test/
│   ├── setup.ts              # Vitest setup file
│   └── mocks/
│       ├── browser.ts        # MSW browser setup
│       ├── server.ts         # MSW node server setup
│       ├── handlers.ts       # API mock handlers
│       └── fixtures/         # Test data fixtures
│           ├── users.ts
│           ├── threads.ts
│           └── announcements.ts
├── e2e/                      # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── mail-flow.spec.ts
│   ├── compose-flow.spec.ts
│   ├── directory.spec.ts
│   ├── admin-rbac.spec.ts
│   └── keyboard-nav.spec.ts
├── *.test.ts / *.test.tsx    # Unit and component tests
└── playwright.config.ts     # Playwright configuration
```

## Scripts

### Unit Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:playwright

# Run with UI mode (for debugging)
npx playwright test --ui

# Run specific test file
npx playwright test auth.spec.ts

# Run in headed mode
npx playwright test --headed

# Generate test code
npx playwright codegen
```

## Writing Tests

### Unit Tests

Unit tests for utilities, hooks, and stores:

```typescript
// lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn, timeAgo } from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });
});
```

### Component Tests

Component tests using React Testing Library:

```typescript
// components/ui/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("should handle click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Tests

Hook tests with React Testing Library:

```typescript
// hooks/useDebounce.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial");

    vi.advanceTimersByTime(500);
    expect(result.current).toBe("updated");
  });
});
```

### E2E Tests

Playwright E2E tests:

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to inbox after successful login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "john.doe@dana.com");
    await page.fill("input[type='password']", "password123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*mail\/inbox.*/);
  });
});
```

## MSW (Mock Service Worker)

MSW is used to mock API requests in tests. The handlers are defined in `test/mocks/handlers.ts` and automatically loaded in the test setup.

### Adding New Mock Handlers

1. Add the handler to `test/mocks/handlers.ts`:

```typescript
export const handlers = [
  // ... existing handlers

  http.get(`${API_URL}/your-new-endpoint`, () => {
    return HttpResponse.json(createApiResponse(mockData));
  }),
];
```

2. Add fixtures to `test/mocks/fixtures/` as needed.

## Coverage

Coverage reports are generated in the `coverage/` directory. The thresholds are configured in `vitest.config.ts`:

- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

View the HTML report:

```bash
npm run test:coverage
open coverage/index.html
```

## CI/CD

Tests run automatically on GitHub Actions:

1. **Unit Tests**: Run on every PR and push
2. **Coverage Check**: Run on every PR and push
3. **Playwright E2E Tests**: Run on main/develop branches after unit tests pass

## Best Practices

1. **Test Behavior, Not Implementation**: Test what components do, not how they do it
2. **Use User-Centric Queries**: Prefer `getByRole`, `getByLabelText` over test IDs
3. **Mock External Dependencies**: Use MSW for API calls
4. **Clean Up State**: Reset stores between tests using `beforeEach`
5. **Test Accessibility**: Include a11y checks in component tests
6. **Keep Tests Focused**: One concern per test
7. **Use Meaningful Names**: Describe what the test verifies

## Troubleshooting

### Common Issues

**Tests fail with "Unable to find element"**
- Check that the element is visible (not `display: none`)
- Use `findBy*` queries for async operations
- Check for loading states

**MSW not intercepting requests**
- Verify handler URL matches the actual request
- Check that `server.listen()` is called in test setup
- Ensure `API_URL` environment variable is set correctly

**Coverage not collecting**
- Check that source files are included in `coverage.exclude` config
- Verify test files follow the pattern `*.test.{ts,tsx}`

### Debugging

1. Run tests in UI mode: `npm run test:ui`
2. Add `screen.debug()` to output rendered HTML
3. Use Playwright's trace viewer: `npx playwright show-trace trace.zip`
4. Set `DEBUG=*` environment variable for verbose output

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Playwright Documentation](https://playwright.dev/)
