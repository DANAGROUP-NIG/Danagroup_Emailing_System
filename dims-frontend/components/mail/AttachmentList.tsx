'use client';

import { FileText, Image, File, X } from 'lucide-react';
import { Attachment } from '@/types/mail.types';
import { cn } from '@/lib/utils';

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  readonly?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-4 w-4 text-blue-600" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-4 w-4 text-red-600" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="h-4 w-4 text-blue-600" />;
  }
  return <File className="h-4 w-4 text-gray-600" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function AttachmentList({
  attachments,
  onRemove,
  readonly = false,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">
        Attachments ({attachments.length})
      </h3>
      <div className="space-y-1.5">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getFileIcon(attachment.mimeType)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">
                  {attachment.filename}
                </p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(attachment.sizeBytes)}
                </p>
              </div>
            </div>
            {!readonly && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
