"use client";

import React, { useState } from "react";
import MailList from "@/components/mail/MailList";
import MailThread from "@/components/mail/MailThread";
import { useMailStore } from "@/store/mailStore";

export default function InboxPage() {
  const [page, setPage] = useState(1);
  const selectedThreadId = useMailStore((state) => state.selectedThreadId);
  const setSelectedThread = useMailStore((state) => state.setSelectedThread);

  return (
    <div className="h-screen flex gap-4">
      {/* Page Header */}
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Inbox
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your emails and team communications
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full mt-32 flex gap-4">
        {/* Left Panel: Mail List */}
        <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
          <MailList
            viewMode="inbox"
            onSelectThread={setSelectedThread}
            selectedThreadId={selectedThreadId}
            page={page}
            onPageChange={setPage}
          />
        </div>

        {/* Right Panel: Thread View */}
        {selectedThreadId ? (
          <div className="flex-1 hidden md:flex flex-col overflow-hidden">
            <MailThread threadId={selectedThreadId} />
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-gray-400 dark:text-gray-600">
            <p>Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}

