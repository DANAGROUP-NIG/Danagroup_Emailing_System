import type { Announcement } from "@/types/mail.types";

export const mockAnnouncement = (
  overrides?: Partial<Announcement>
): Announcement => ({
  id: "ann-1",
  authorId: "admin-1",
  title: "Company Announcement",
  body: "This is an important company announcement.",
  target: "all",
  isPinned: false,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const mockPinnedAnnouncement = (
  overrides?: Partial<Announcement>
): Announcement =>
  mockAnnouncement({
    id: "ann-pinned",
    title: "Pinned Announcement",
    body: "This is a pinned announcement.",
    isPinned: true,
    ...overrides,
  });

export const mockAnnouncements: Announcement[] = [
  mockAnnouncement(),
  mockPinnedAnnouncement(),
  mockAnnouncement({
    id: "ann-2",
    title: "Department Update",
    body: "Updates for the engineering department.",
    target: "department",
    departmentId: "dept-1",
  }),
  mockAnnouncement({
    id: "ann-3",
    title: "Subsidiary News",
    body: "News from the subsidiary.",
    target: "subsidiary",
    subsidiaryId: "sub-1",
  }),
];
