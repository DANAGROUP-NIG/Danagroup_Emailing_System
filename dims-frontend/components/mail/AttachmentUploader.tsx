'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { filesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { validateFileSecurity, stripExifMetadata, formatFileSize } from '@/lib/fileValidation';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export interface UploadedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  progress: number;
  isUploading: boolean;
  error?: string;
}

interface AttachmentUploaderProps {
  onChange?: (files: UploadedAttachment[]) => void;
  onError?: (error: string) => void;
}

export default function AttachmentUploader({
  onChange,
  onError,
}: AttachmentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = uploadedFiles.reduce((sum, file) => sum + file.sizeBytes, 0);

  const syncFiles = useCallback(
    (files: UploadedAttachment[]) => {
      onChange?.(files.filter((file) => !file.isUploading && !file.error));
    },
    [onChange],
  );

  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
      // Check total size first (quick check before expensive validation)
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        return `Total attachment size exceeds ${formatFileSize(MAX_TOTAL_SIZE)} limit`;
      }

      // Run comprehensive security validation
      const validation = await validateFileSecurity(file, ALLOWED_TYPES, MAX_FILE_SIZE);
      if (!validation.valid) {
        return validation.error || `Security validation failed: ${file.name}`;
      }

      return null;
    },
    [totalSize],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const tempId = `${Date.now()}-${Math.random()}`;
      const optimisticFile: UploadedAttachment = {
        id: tempId,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: '',
        progress: 0,
        isUploading: true,
      };

      setUploadedFiles((prev) => [...prev, optimisticFile]);

      try {
        // Strip EXIF metadata from images before upload (security/privacy)
        const fileToUpload = await stripExifMetadata(file);

        // Create File object from Blob if EXIF was stripped (images)
        const uploadFile =
          fileToUpload instanceof File
            ? fileToUpload
            : new File([fileToUpload], file.name, { type: file.type });

        const res = await filesApi.upload(uploadFile, (progress: number) => {
          setUploadedFiles((prev) =>
            prev.map((current) =>
              current.id === tempId ? { ...current, progress } : current,
            ),
          );
        });

        const uploaded = res.data.data;
        setUploadedFiles((prev) => {
          const next = prev.map((current) =>
            current.id === tempId
              ? {
                  id: uploaded.id,
                  filename: uploaded.filename,
                  mimeType: uploaded.mimeType,
                  sizeBytes: uploaded.sizeBytes,
                  storageKey: uploaded.storageKey,
                  progress: 100,
                  isUploading: false,
                }
              : current,
          );

          syncFiles(next);
          return next;
        });
      } catch (error: unknown) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const rawMsg = axiosErr?.response?.data?.message;
        const message = Array.isArray(rawMsg) ? rawMsg[0] ?? `Failed to upload ${file.name}` : rawMsg || `Failed to upload ${file.name}`;
        setErrorMessage(message);
        onError?.(message);

        setUploadedFiles((prev) =>
          prev.filter((current) => current.id !== tempId),
        );
      }
    },
    [onError, syncFiles],
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate all files before uploading
      for (const file of fileArray) {
        const validationError = await validateFile(file);
        if (validationError) {
          setErrorMessage(validationError);
          onError?.(validationError);
          return;
        }
      }

      setErrorMessage('');
      for (const file of fileArray) {
        await uploadFile(file);
      }
    },
    [onError, uploadFile, validateFile],
  );

  const removeFile = useCallback(
    async (id: string) => {
      const target = uploadedFiles.find((file) => file.id === id);
      if (!target) {
        return;
      }

      if (!target.isUploading) {
        await filesApi.delete(id);
      }

      setUploadedFiles((prev) => {
        const next = prev.filter((file) => file.id !== id);
        syncFiles(next);
        return next;
      });
    },
    [syncFiles, uploadedFiles],
  );

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'relative rounded-xl border border-dashed p-5 transition-colors',
          isDragging
            ? 'border-dana-blue-500 bg-dana-blue-50'
            : 'border-slate-300 bg-white hover:border-dana-blue-300',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              void addFiles(e.target.files);
            }
          }}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
        />

        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-dana-blue-50 text-dana-blue-700">
            <Paperclip className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 text-left">
            <p className="text-base font-medium text-slate-900">
              Drag & drop files here or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-semibold text-dana-blue-700 hover:text-dana-blue-900 hover:underline"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 20MB each (50MB total)
            </p>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {uploadedFiles.length > 0 ? (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {file.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="w-24">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      file.error ? 'bg-red-500' : file.progress === 100 ? 'bg-green-500' : 'bg-blue-500',
                    )}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>

              {file.isUploading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}

              <button
                type="button"
                onClick={() => void removeFile(file.id)}
                className="text-slate-400 transition-colors hover:text-red-600"
                aria-label={`Remove ${file.filename}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Total: {(totalSize / 1024 / 1024).toFixed(1)}MB / 50MB
      </p>
    </div>
  );
}
