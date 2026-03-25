"use client";

import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import AttachmentUploader from "./AttachmentUploader";
import AttachmentList from "./AttachmentList";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function ComposeEmail() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isValid = to && subject && body;

  const handleSend = async () => {
    if (!isValid) return;

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          attachmentIds: attachments.map((a) => a.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      setSuccess(true);
      setTo("");
      setSubject("");
      setBody("");
      setAttachments([]);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setTo("");
    setSubject("");
    setBody("");
    setAttachments([]);
    setError("");
    setSuccess(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              Error sending email
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Email sent successfully
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
              Your message has been sent to {to}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 space-y-5">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="What is your email about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Message
            </label>
            <textarea
              placeholder="Write your email message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
              rows={6}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none transition"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {body.length} characters
            </p>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Attachments
            </label>
            <AttachmentUploader />
            {attachments.length > 0 && (
              <div className="mt-4">
                <AttachmentList attachments={attachments} />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button
            onClick={handleSend}
            disabled={!isValid || sending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition ${
              isValid && !sending
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send Email"}
          </button>

          <button
            onClick={handleClear}
            disabled={sending}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
          >
            Clear
          </button>

          {isValid && !error && !sending && (
            <div className="ml-auto text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Ready to send
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
