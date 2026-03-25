// TODO: Implement AnnouncementCard Component
// Props: announcement: Announcement
// - Shows: title, author avatar + name, published date, body (truncated)
// - Shows "Pinned" badge (dana-red) for is_pinned === true
// - Shows subsidiary/department badge for targeted announcements
// - Expand to read full body on click
// - Edit/Delete actions visible to author, managers, and admins
//export default function AnnouncementCard() {
  // TODO: Implement
  //return null;
//}
// ================================
// File: AnnouncementCard.tsx
// ================================

"use client";

import React from "react";

export type AnnouncementType = "general" | "hr" | "it" | "event" | "other";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  subsidiary: string;
  department: string;
  type: AnnouncementType;
  pinned?: boolean;
}

import { Pin, Calendar, User, Building2 } from "lucide-react";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getTypeColor = (type: AnnouncementType) => {
  const colors: Record<AnnouncementType, string> = {
    general: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    hr: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    it: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    event: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    other: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
  };
  return colors[type];
};

export const AnnouncementCard: React.FC<{ a: Announcement }> = ({ a }) => {
  return (
    <div className={`rounded-lg shadow-sm border transition hover:shadow-md ${
      a.pinned
        ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
    }`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">
            {a.title}
          </h3>
          {a.pinned && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-200 dark:bg-yellow-700 rounded-full">
              <Pin className="w-3 h-3" />
              <span className="text-xs font-medium">Pinned</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {a.body}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(a.type)}`}>
            {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
          </span>
          {a.subsidiary && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {a.subsidiary}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(a.createdAt)}
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {a.author}
          </div>
        </div>
      </div>
    </div>
  );
};



