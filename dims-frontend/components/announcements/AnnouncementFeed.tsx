// TODO: Implement AnnouncementFeed Component
// - Fetches announcements from GET /api/announcements
// - Shows pinned announcements at the top
// - Filter bar: All | Company-wide | By Subsidiary | By Department
// - Renders list of AnnouncementCard components
// - "Post Announcement" button (managers/admins only) opens a modal form
// - Loading skeleton and empty state
//export default function AnnouncementFeed() {
  // TODO: Implement
 // return null;
//}

"use client";

import React, { useMemo, useState } from "react";
import { Announcement, AnnouncementCard, AnnouncementType } from "./AnnouncementCard";

const MOCK: Announcement[] = [
  {
    id: "1",
    title: "System Maintenance",
    body: "Scheduled maintenance on Friday 10PM.",
    author: "IT Admin",
    createdAt: new Date().toISOString(),
    subsidiary: "HQ",
    department: "IT",
    type: "it",
    pinned: true,
  },
  {
    id: "2",
    title: "HR Policy Update",
    body: "New leave policy effective next month.",
    author: "HR Team",
    createdAt: new Date().toISOString(),
    subsidiary: "Lagos",
    department: "HR",
    type: "hr",
  },
];

export default function AnnouncementFeed() {
  const [data] = useState<Announcement[]>(MOCK);
  const [subsidiary, setSubsidiary] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState<"" | AnnouncementType>("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;

  const filtered = useMemo(() => {
    return data.filter((a) => {
      return (
        (!subsidiary || a.subsidiary === subsidiary) &&
        (!department || a.department === department) &&
        (!type || a.type === type)
      );
    });
  }, [data, subsidiary, department, type]);

  const pinned = filtered.filter((a) => a.pinned);
  const others = filtered.filter((a) => !a.pinned);

  const paginated = others.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPages = Math.ceil(others.length / PAGE_SIZE);

  const uniqueSubsidiaries = Array.from(new Set(data.map((d) => d.subsidiary)));
  const uniqueDepartments = Array.from(new Set(data.map((d) => d.department)));

  const totalCount = filtered.length;

  return (
    <div className="w-full space-y-6">
      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Filter Announcements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subsidiary
            </label>
            <select
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={subsidiary}
              onChange={(e) => {
                setSubsidiary(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Subsidiaries</option>
              {uniqueSubsidiaries.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={type}
              onChange={(e) => {
                setType(e.target.value as AnnouncementType | "");
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
        {Math.min(page * PAGE_SIZE, others.length)} of {totalCount} announcements
      </div>

      {/* Pinned Announcements */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
            📌 Pinned Announcements
          </h2>
          <div className="grid gap-3">
            {pinned.map((a) => (
              <AnnouncementCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}

      {/* Main Feed */}
      {paginated.length > 0 ? (
        <div className="space-y-3">
          {paginated.map((a) => (
            <AnnouncementCard key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No announcements found with current filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                  page === num
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
