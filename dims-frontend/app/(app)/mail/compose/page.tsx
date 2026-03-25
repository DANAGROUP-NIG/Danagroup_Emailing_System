// TODO: Implement Compose Page
// - Standalone compose page (for direct URL navigation)
// - Renders ComposeModal in full-page mode
// - Supports query params: to, subject, threadId (for replies)

"use client";

import React from "react";
import ComposeEmail from "@/components/mail/ComposeModal";

export default function ComposePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Compose Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Send emails to team members with file attachments
        </p>
      </div>

      {/* Content Card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8">
          <ComposeEmail />
        </div>
      </div>
    </div>
  );
}

