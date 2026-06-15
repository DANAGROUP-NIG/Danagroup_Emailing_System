import type {
  MailThreadSummary,
  ThreadMessage,
  DraftMessage,
  ThreadDetail,
  MailListMessage,
} from "@/types/mail.types";

export const mockMailListMessage = (
  overrides?: Partial<MailListMessage>
): MailListMessage => ({
  id: "msg-1",
  threadId: "thread-1",
  body: "This is a test message body",
  bodyHtml: "<p>This is a test message body</p>",
  createdAt: new Date().toISOString(),
  sentAt: new Date().toISOString(),
  sender: {
    id: "user-1",
    email: "john.doe@dana.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    avatarUrl: null,
  },
  recipients: [],
  ...overrides,
});

export const mockMailThreadSummary = (
  overrides?: Partial<MailThreadSummary>
): MailThreadSummary => ({
  id: "thread-1",
  subject: "Test Subject",
  unreadCount: 1,
  isStarred: false,
  updatedAt: new Date().toISOString(),
  latestMessage: mockMailListMessage(),
  ...overrides,
});

export const mockThreadMessage = (
  overrides?: Partial<ThreadMessage>
): ThreadMessage => ({
  id: "msg-1",
  threadId: "thread-1",
  subject: "Test Subject",
  body: "This is a test message",
  bodyHtml: "<p>This is a test message</p>",
  isDraft: false,
  sentAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  senderDeletedAt: null,
  sender: {
    id: "user-1",
    email: "john.doe@dana.com",
    name: "John Doe",
  },
  recipients: [
    {
      id: "recip-1",
      type: "to",
      recipientId: "user-2",
      email: "jane.smith@dana.com",
      name: "Jane Smith",
      isRead: false,
      isStarred: false,
      isDeleted: false,
    },
  ],
  attachments: [],
  isRead: false,
  isStarred: false,
  preview: "This is a test message",
  ...overrides,
});

export const mockDraftMessage = (
  overrides?: Partial<DraftMessage>
): DraftMessage => ({
  id: "draft-1",
  threadId: "draft-thread-1",
  subject: "Draft Subject",
  body: "This is a draft message",
  bodyHtml: "<p>This is a draft message</p>",
  isDraft: true,
  createdAt: new Date().toISOString(),
  sentAt: null,
  sender: {
    id: "user-1",
    email: "john.doe@dana.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    avatarUrl: null,
  },
  recipients: [],
  attachments: [],
  ...overrides,
});

export const mockThreadDetail = (
  overrides?: Partial<ThreadDetail>
): ThreadDetail => ({
  threadId: "thread-1",
  messages: [mockThreadMessage()],
  ...overrides,
});

export const mockThreads: MailThreadSummary[] = [
  mockMailThreadSummary(),
  mockMailThreadSummary({
    id: "thread-2",
    subject: "Another Subject",
    unreadCount: 0,
    isStarred: true,
    latestMessage: mockMailListMessage({
      id: "msg-2",
      threadId: "thread-2",
      body: "Second message body",
    }),
  }),
  mockMailThreadSummary({
    id: "thread-3",
    subject: "Meeting Tomorrow",
    unreadCount: 3,
    latestMessage: mockMailListMessage({
      id: "msg-3",
      threadId: "thread-3",
      body: "Let's discuss the project",
      sender: {
        id: "user-3",
        email: "bob@dana.com",
        name: "Bob Johnson",
        firstName: "Bob",
        lastName: "Johnson",
        avatarUrl: null,
      },
    }),
  }),
];

export const mockDrafts: DraftMessage[] = [
  mockDraftMessage(),
  mockDraftMessage({
    id: "draft-2",
    subject: "Another Draft",
    body: "Draft content here",
  }),
];
