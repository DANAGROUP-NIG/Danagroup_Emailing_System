'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Link2, Undo2, Redo2, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Compose your message...',
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    icon: Icon,
    isActive,
    onClick,
    title,
  }: {
    icon: React.ComponentType<LucideProps>;
    isActive?: boolean;
    onClick: () => void;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded p-1.5 transition-colors',
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className={cn('flex flex-col border border-input rounded-md', className)}>
      {!readOnly && (
        <div className="flex flex-wrap gap-1 border-b border-input bg-gray-50 p-2">
          <ToolbarButton
            icon={Bold}
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          />
          <ToolbarButton
            icon={Italic}
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          />
          <div className="w-px bg-gray-300" />
          <ToolbarButton
            icon={List}
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          />
          <ToolbarButton
            icon={Link2}
            isActive={editor.isActive('link')}
            onClick={() => {
              const url = window.prompt('Enter URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            title="Add link"
          />
          <div className="w-px bg-gray-300" />
          <ToolbarButton
            icon={Undo2}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          />
          <ToolbarButton
            icon={Redo2}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          />
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none flex-1 p-3 text-sm outline-none"
      />
    </div>
  );
}
