// TODO: Implement AttachmentList Component
// Props: attachments: Attachment[]
// - Renders a list of file attachments for a message
// - Shows file icon (based on mime type), filename, and size
// - Download button: calls GET /api/files/:id which redirects to pre-signed MinIO URL
// - Preview support for images (png, jpg, jpeg)
//export default function AttachmentList() {
  // TODO: Implement
// return null;
//}

"use client";

import React, { useState } from "react";
import {
  Download,
  X,
  FileText,
  Image as ImageIcon,
  Archive,
} from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface AttachmentListProps {
  attachments?: Attachment[];
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("image")) return ImageIcon;
  if (mimeType.includes("pdf") || mimeType.includes("word"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return Archive;
  return FileText;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export default function AttachmentList({
  attachments = [],
}: AttachmentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  if (!attachments.length) return null;

  const handleDownload = async (id: string, name: string) => {
    setDownloading(id);
    try {
      const response = await fetch(`/api/files/${id}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloading(id);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        Attachments ({attachments.length})
      </h4>

      <div className="space-y-2">
        {attachments.map((attachment) => {
          const IconComponent = getFileIcon(attachment.type);
          const isImage = attachment.type.includes("image");

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(attachment.size)}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {isImage && (
                  <button
                    onClick={() =>
                      setPreviewing(
                        previewing === attachment.id ? null : attachment.id
                      )
                    }
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition text-gray-600 dark:text-gray-400"
                    title="Preview"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDownload(attachment.id, attachment.name)}
                  disabled={downloading === attachment.id}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition text-gray-600 dark:text-gray-400 disabled:opacity-50"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition text-red-600 dark:text-red-400"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewing === attachment.id && isImage && (
                <div className="absolute left-0 right-0 mt-2 max-w-xs mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
                  <img
                    src={`/api/files/${attachment.id}`}
                    alt={attachment.name}
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
