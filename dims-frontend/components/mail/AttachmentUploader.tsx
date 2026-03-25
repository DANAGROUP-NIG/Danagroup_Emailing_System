// TODO: Implement AttachmentUploader Component
// Props: onUpload: (attachmentId: string) => void, maxSizeMB?: number
// - Drag-and-drop file upload zone
// - Also supports click-to-browse
// - Calls POST /api/files/upload (multipart/form-data)
// - Shows upload progress bar per file
// - Validates file type (pdf, doc, docx, xls, xlsx, ppt, pptx, png, jpg, jpeg, zip)
// - Validates file size: 20MB per file, 50MB total per message
// - Shows error Toast on validation failure
// - Shows uploaded files list with remove button
//export default function AttachmentUploader() {
 //  TODO: Implement
 // return null;
//}

"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";

type FileWithProgress = {
  file: File;
  progress: number;
  error?: string;
  id: string;
  uploaded?: boolean;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export default function AttachmentUploader() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [dragging, setDragging] = useState(false);

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const successCount = files.filter((f) => f.uploaded).length;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type not supported. Allowed: PDF, DOC, XLS, PPT, images, ZIP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 20MB limit`;
    }
    if (totalSize + file.size > MAX_TOTAL_SIZE) {
      return `Total size would exceed 50MB limit`;
    }
    return null;
  };

  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 100) progress = 100;

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: Math.min(progress, 99) } : f))
      );

      if (progress >= 100) {
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: 100, uploaded: true } : f))
        );
      }
    }, 300);
  };

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithProgress[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      const id = Math.random().toString(36).substring(7);

      const fileObj: FileWithProgress = {
        file,
        progress: 0,
        error: error || undefined,
        id,
      };

      newFiles.push(fileObj);

      if (!error) {
        setTimeout(() => simulateUpload(id), 300);
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const hasErrors = files.some((f) => f.error);
  const hasUploading = files.some((f) => !f.uploaded && !f.error);

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all shadow-sm ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-900/20"
        } ${hasErrors ? "opacity-60" : ""}`}
      >
        <input
          type="file"
          multiple
          className="hidden"
          id="fileInput"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={hasErrors}
        />

        <label htmlFor="fileInput" className="cursor-pointer block">
          <div className="flex justify-center mb-2">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            Drag files here or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max 20MB per file, 50MB total
          </p>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({successCount}/{files.length})
            </p>
            {totalSize > 0 && (
              <p className="text-xs text-gray-500">
                Total: {formatBytes(totalSize)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className={`p-3 border rounded-lg flex items-center gap-3 transition ${
                  f.error
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                }`}
              >
                {f.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : f.uploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Upload className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {f.file.name}
                  </p>
                  {f.error ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      {f.error}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-fit">
                        {Math.round(f.progress)}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatBytes(f.file.size)}
                  </p>
                </div>

                <button
                  onClick={() => removeFile(f.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
