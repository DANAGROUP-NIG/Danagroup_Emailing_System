'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link2,
  Undo2, Redo2, RemoveFormatting, Heading2, Heading3,
  Image as ImageIcon, Paperclip, X,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { filesApi } from '@/lib/api/files';
import { useToast } from '@/components/ui/Toast';
import type { NodeViewProps } from '@tiptap/react';

export interface EditorAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  minHeight?: string;
  onAttachmentsChange?: (attachments: EditorAttachment[]) => void;
}

const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-attachment-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          if (!attributes['data-attachment-id']) return {};
          return { 'data-attachment-id': attributes['data-attachment-id'] };
        },
      },
    };
  },
});

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const width = (node.attrs as { width?: number | null }).width ?? 300;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = containerRef.current?.offsetWidth ?? width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.max(60, Math.min(800, startWidth.current + delta));
      updateAttributes({ width: Math.round(newWidth) });
    };

    const onMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes, width]);

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: 'inline-block', position: 'relative', maxWidth: '100%' }}
    >
      <span
        ref={containerRef}
        style={{
          display: 'inline-block',
          position: 'relative',
          width,
          maxWidth: '100%',
          outline: selected ? '2px solid #6366f1' : 'none',
          borderRadius: 4,
        }}
      >
        <img
          src={(node.attrs as { src: string }).src}
          alt={(node.attrs as { alt?: string }).alt ?? ''}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
          draggable={false}
        />
        {selected && (
          <span
            onMouseDown={onMouseDown}
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 14,
              height: 14,
              background: '#6366f1',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 10,
              border: '2px solid white',
            }}
          />
        )}
      </span>
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: 300 },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, ...rest } = HTMLAttributes as { width?: number; src?: string; alt?: string };
    return ['img', mergeAttributes(rest, {
      style: `width:${width ?? 300}px;max-width:100%;height:auto`,
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

interface LinkDialogState {
  open: boolean;
  text: string;
  url: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Compose your message...',
  className,
  readOnly = false,
  minHeight = '120px',
  onAttachmentsChange,
}: RichTextEditorProps) {
  const { showToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<EditorAttachment[]>([]);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({ open: false, text: '', url: '' });
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CustomLink.configure({ openOnClick: false, autolink: true }),
      ResizableImage,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const notifyAttachments = useCallback((next: EditorAttachment[]) => {
    setAttachments(next);
    onAttachmentsChange?.(next);
  }, [onAttachmentsChange]);

  if (!editor) return null;

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const res = await filesApi.upload(file);
      const attachment = res.data.data;
      editor.chain().focus().insertContent({
        type: 'resizableImage',
        attrs: { src: attachment.url, alt: file.name, width: 300 },
      }).run();
    } catch {
      showToast({ title: 'Image upload failed', variant: 'error' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileAttach = async (file: File) => {
    setIsUploadingFile(true);
    try {
      const res = await filesApi.upload(file);
      const data = res.data.data;
      const attachment: EditorAttachment = {
        id: data.id,
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: data.storageKey,
        url: data.url,
      };
      notifyAttachments([...attachments, attachment]);
    } catch {
      showToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeAttachment = (id: string) => {
    notifyAttachments(attachments.filter((a) => a.id !== id));
  };

  const openLinkDialog = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
    );
    setLinkDialog({ open: true, text: selectedText, url: '' });
  };

  const confirmLink = () => {
    const url = linkDialog.url.trim();
    if (!url) {
      setLinkDialog({ open: false, text: '', url: '' });
      return;
    }
    const href = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')
      ? url : `https://${url}`;
    editor.chain().focus().setLink({ href }).run();
    if (linkDialog.text && !editor.state.selection.empty) {
      // text already selected — link is applied
    }
    setLinkDialog({ open: false, text: '', url: '' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const Divider = () => (
    <div className="w-px self-stretch bg-border mx-0.5" />
  );

  const Btn = ({
    icon: Icon,
    isActive,
    onClick,
    title,
    disabled,
  }: {
    icon: React.ComponentType<LucideProps>;
    isActive?: boolean;
    onClick: () => void;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={cn(
        'rounded p-1.5 transition-colors disabled:opacity-40',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className={cn('flex flex-col border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring', className)}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/50 px-2 py-1.5">
          {/* Headings */}
          <Btn
            icon={Heading2}
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          />
          <Btn
            icon={Heading3}
            isActive={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          />
          <Divider />
          {/* Inline formatting */}
          <Btn
            icon={Bold}
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          />
          <Btn
            icon={Italic}
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          />
          <Btn
            icon={UnderlineIcon}
            isActive={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          />
          <Btn
            icon={Strikethrough}
            isActive={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          />
          <Btn
            icon={Code}
            isActive={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline code"
          />
          <Divider />
          {/* Block formatting */}
          <Btn
            icon={List}
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          />
          <Btn
            icon={ListOrdered}
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered list"
          />
          <Btn
            icon={Quote}
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          />
          <Divider />
          {/* Link */}
          <Btn
            icon={Link2}
            isActive={editor.isActive('link')}
            onClick={openLinkDialog}
            title={editor.isActive('link') ? 'Remove link' : 'Insert link'}
          />
          {/* Image */}
          <Btn
            icon={ImageIcon}
            onClick={() => imageInputRef.current?.click()}
            title="Upload image"
            disabled={isUploadingImage}
          />
          {/* Attach file */}
          <Btn
            icon={Paperclip}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={isUploadingFile}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
              e.target.value = '';
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileAttach(file);
              e.target.value = '';
            }}
          />
          <Btn
            icon={RemoveFormatting}
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear formatting"
          />
          <Divider />
          {/* History */}
          <Btn
            icon={Undo2}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
          />
          <Btn
            icon={Redo2}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Ctrl+Y)"
            disabled={!editor.can().redo()}
          />
        </div>
      )}

      {/* Link dialog */}
      {linkDialog.open && (
        <div className="border-b border-input bg-muted/30 px-3 py-2.5 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground">Display text</label>
            <input
              autoFocus
              type="text"
              value={linkDialog.text}
              onChange={(e) => setLinkDialog((p) => ({ ...p, text: e.target.value }))}
              placeholder="Link text (optional)"
              className="h-8 rounded border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setLinkDialog({ open: false, text: '', url: '' }); }}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Web address</label>
            <input
              type="url"
              value={linkDialog.url}
              onChange={(e) => setLinkDialog((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://example.com"
              className="h-8 rounded border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setLinkDialog({ open: false, text: '', url: '' }); }}
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={confirmLink}
              className="h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => setLinkDialog({ open: false, text: '', url: '' })}
              className="h-8 px-3 rounded border border-input text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="prose prose-sm dark:prose-invert max-w-none flex-1 px-3 py-2 text-sm outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[inherit]"
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-input bg-muted/20 px-3 py-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
            >
              <Paperclip size={12} className="shrink-0 text-muted-foreground" />
              <span className="max-w-[160px] truncate font-medium">{att.filename}</span>
              <span className="text-muted-foreground">· {formatFileSize(att.sizeBytes)}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={`Remove ${att.filename}`}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
