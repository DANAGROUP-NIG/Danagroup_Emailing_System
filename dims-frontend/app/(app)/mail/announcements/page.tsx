"use client";

import React from "react";
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Announcements
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Stay informed with important company-wide announcements and updates
        </p>
      </div>

      {/* Content Card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8">
          <AnnouncementFeed />
        </div>
      </div>
    </div>
  );
}
