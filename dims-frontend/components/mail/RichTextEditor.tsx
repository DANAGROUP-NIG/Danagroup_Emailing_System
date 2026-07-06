'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link2,
  Undo2, Redo2, RemoveFormatting, Heading2, Heading3,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Compose your message...',
  className,
  readOnly = false,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  if (!editor) return null;

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
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt('Enter URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            title={editor.isActive('link') ? 'Remove link' : 'Add link'}
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
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="prose prose-sm dark:prose-invert max-w-none flex-1 px-3 py-2 text-sm outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[inherit]"
      />
    </div>
  );
}
