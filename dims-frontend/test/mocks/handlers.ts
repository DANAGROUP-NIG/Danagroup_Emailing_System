import { http, HttpResponse } from "msw";
import type {
  MailThreadSummary,
  DraftMessage,
  ThreadMessage,
  ThreadDetail,
  Announcement,
} from "@/types/mail.types";
import type { User } from "@/types/user.types";
import type { ApiResponse, BackendPageResponse } from "@/types/api.types";
import { mockUsers, mockAdminUser } from "./fixtures/users";
import { mockThreads, mockDrafts, mockThreadMessage } from "./fixtures/threads";
import { mockAnnouncements } from "./fixtures/announcements";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Helper to create paginated response
const createPaginatedResponse = <T>(
  data: T[],
  page = 1,
  limit = 20
): BackendPageResponse<T> => ({
  data,
  total: data.length,
  page,
  limit,
});

// Helper to create API envelope response
const createApiResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  message: "Success",
  data,
});

export const handlers = [
  // ─── Auth Handlers ─────────────────────────────────────────────────────────

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.password === "wrong-password") {
      return HttpResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user =
      mockUsers.find((u) => u.email === body.email) || mockUsers[0];
    if (!user) {
      return HttpResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(
      createApiResponse({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(createApiResponse(mockUsers[0]));
  }),

  // ─── Mail Handlers ─────────────────────────────────────────────────────────

  http.get(`${API_URL}/mail/inbox`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json(createPaginatedResponse(mockThreads, page));
  }),

  http.get(`${API_URL}/mail/sent`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json(
      createPaginatedResponse(
        mockThreads.map((t) => ({ ...t, unreadCount: 0 })),
        page
      )
    );
  }),

  http.get(`${API_URL}/mail/drafts`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json(createPaginatedResponse(mockDrafts, page));
  }),

  http.get(`${API_URL}/mail/starred`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const starred = mockThreads.filter((t) => t.isStarred);
    return HttpResponse.json(createPaginatedResponse(starred, page));
  }),

  http.get(`${API_URL}/mail/trash`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json(createPaginatedResponse([], page));
  }),

  http.get(`${API_URL}/mail/threads/:threadId`, ({ params }) => {
    const threadId = params.threadId as string;
    const thread = mockThreads.find((t) => t.id === threadId);

    if (!thread) {
      return HttpResponse.json(
        { success: false, message: "Thread not found" },
        { status: 404 }
      );
    }

    const detail: ThreadDetail = {
      threadId,
      messages: [mockThreadMessage({ threadId })],
    };

    return HttpResponse.json(createApiResponse(detail));
  }),

  http.get(`${API_URL}/mail/messages/:messageId`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.post(`${API_URL}/mail/send`, async ({ request }) => {
    const body = await request.json();
    const message = mockThreadMessage({
      subject: (body as any).subject || "No Subject",
      body: (body as any).body || "",
    });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.post(`${API_URL}/mail/draft`, async ({ request }) => {
    const body = await request.json();
    const draft = mockDrafts[0];
    return HttpResponse.json(createApiResponse(draft));
  }),

  http.patch(`${API_URL}/mail/messages/:messageId/read`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId, isRead: true });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.patch(`${API_URL}/mail/messages/read`, async ({ request }) => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.patch(`${API_URL}/mail/threads/:threadId/read`, ({ params }) => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.patch(`${API_URL}/mail/:messageId/star`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId, isStarred: true });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.delete(`${API_URL}/mail/:messageId`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.patch(`${API_URL}/mail/:messageId/restore`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.delete(`${API_URL}/mail/trash/empty`, () => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.delete(`${API_URL}/mail/messages/:messageId/permanent`, ({ params }) => {
    const messageId = params.messageId as string;
    const message = mockThreadMessage({ id: messageId });
    return HttpResponse.json(createApiResponse(message));
  }),

  http.get(`${API_URL}/mail/recipients/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const suggestions = mockUsers
      .filter(
        (u) =>
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.firstName.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName.toLowerCase().includes(query.toLowerCase())
      )
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        avatarUrl: u.avatarUrl,
      }));
    return HttpResponse.json(createApiResponse(suggestions));
  }),

  // ─── User Handlers ─────────────────────────────────────────────────────────

  http.get(`${API_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    return HttpResponse.json(createPaginatedResponse(mockUsers, page, limit));
  }),

  http.get(`${API_URL}/users/:userId`, ({ params }) => {
    const userId = params.userId as string;
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(user));
  }),

  http.get(`${API_URL}/users/me/profile`, () => {
    return HttpResponse.json(createApiResponse(mockUsers[0]));
  }),

  http.patch(`${API_URL}/users/me/profile`, async ({ request }) => {
    const body = await request.json();
    const updatedUser = { ...mockUsers[0], ...(body as Partial<User>) };
    return HttpResponse.json(createApiResponse(updatedUser));
  }),

  // ─── Department Handlers ───────────────────────────────────────────────────

  http.get(`${API_URL}/departments`, ({ request }) => {
    return HttpResponse.json(
      createApiResponse([
        { id: "dept-1", name: "Engineering", subsidiaryId: "sub-1" },
        { id: "dept-2", name: "Sales", subsidiaryId: "sub-1" },
        { id: "dept-3", name: "Marketing", subsidiaryId: "sub-2" },
      ])
    );
  }),

  // ─── Announcement Handlers ─────────────────────────────────────────────────

  http.get(`${API_URL}/announcements`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    return HttpResponse.json(
      createPaginatedResponse(mockAnnouncements, page, limit)
    );
  }),

  http.get(`${API_URL}/announcements/:announcementId`, ({ params }) => {
    const announcementId = params.announcementId as string;
    const announcement = mockAnnouncements.find((a) => a.id === announcementId);

    if (!announcement) {
      return HttpResponse.json(
        { success: false, message: "Announcement not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(announcement));
  }),

  http.post(`${API_URL}/announcements`, async ({ request }) => {
    const body = await request.json();
    const newAnnouncement: Announcement = {
      id: "new-ann-1",
      authorId: mockAdminUser().id,
      title: (body as any).title || "New Announcement",
      body: (body as any).body || "",
      target: (body as any).target || "all",
      isPinned: (body as any).isPinned || false,
      createdAt: new Date().toISOString(),
      ...(body as Partial<Announcement>),
    };
    return HttpResponse.json(createApiResponse(newAnnouncement));
  }),

  http.patch(`${API_URL}/announcements/:announcementId`, async ({ params, request }) => {
    const announcementId = params.announcementId as string;
    const body = (await request.json()) as Partial<Announcement>;
    const announcement = mockAnnouncements.find((a) => a.id === announcementId);

    if (!announcement) {
      return HttpResponse.json(
        { success: false, message: "Announcement not found" },
        { status: 404 }
      );
    }

    const updated: Announcement = { ...announcement, ...body };
    return HttpResponse.json(createApiResponse(updated));
  }),

  http.delete(`${API_URL}/announcements/:announcementId`, ({ params }) => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  // ─── Notification Handlers ─────────────────────────────────────────────────

  http.get(`${API_URL}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    return HttpResponse.json(
      createPaginatedResponse(
        [
          {
            id: "notif-1",
            userId: mockUsers[0]?.id ?? "mock-user-1",
            type: "new_mail" as const,
            title: "New message from Jane",
            body: "You have a new message",
            isRead: false,
            referenceId: "msg-2",
            createdAt: new Date().toISOString(),
          },
        ],
        page
      )
    );
  }),

  http.patch(`${API_URL}/notifications/:notificationId/read`, ({ params }) => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  http.patch(`${API_URL}/notifications/read-all`, () => {
    return HttpResponse.json(createApiResponse(undefined));
  }),

  // ─── Search Handlers ─────────────────────────────────────────────────────

  http.get(`${API_URL}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    return HttpResponse.json(
      createApiResponse([
        {
          type: "mail" as const,
          id: "thread-1",
          title: "Test Subject",
          subtitle: "From John Doe",
          url: "/mail/inbox/thread-1",
        },
        {
          type: "user" as const,
          id: "user-1",
          title: "John Doe",
          subtitle: "john.doe@dana.com",
          url: "/directory/user-1",
        },
      ])
    );
  }),

  // ─── File Handlers ─────────────────────────────────────────────────────────

  http.post(`${API_URL}/files/upload`, async ({ request }) => {
    return HttpResponse.json(
      createApiResponse({
        id: "file-1",
        filename: "test.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        storageKey: "uploads/test.pdf",
        createdAt: new Date().toISOString(),
      })
    );
  }),

  http.get(`${API_URL}/files/:fileId/download`, ({ params }) => {
    return HttpResponse.json(
      createApiResponse({
        url: "https://example.com/download/test.pdf",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    );
  }),
];
