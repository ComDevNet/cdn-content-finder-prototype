
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, Pilcrow, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { Button } from './ui/button';

interface WysiwygEditorProps {
  content: string; // Markdown content
  onChange: (richText: string) => void; // HTML content
}

const WysiwygEditor = ({ content, onChange }: WysiwygEditorProps) => {
  const isContentLoaded = useRef(false);

  // Convert incoming Markdown to HTML for the editor
  const htmlContent = useMemo(() => {
    try {
      // Ensure we don't pass null or undefined to marked
      return content ? marked.parse(content) as string : '';
    } catch (error) {
      console.error("Error converting markdown to html:", error);
      return `<p>${content ? content.replace(/\n/g, '<br>') : ''}</p>`; // Basic fallback
    }
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: htmlContent,
    immediatelyRender: false, // Fix for SSR hydration error
    editorProps: {
      attributes: {
        // We will target the editor content with a dedicated class and style it in globals.css
        class: 'wysiwyg-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Load content into the editor only once after it's initialized
  useEffect(() => {
    if (editor && htmlContent && !isContentLoaded.current) {
        editor.commands.setContent(htmlContent);
        isContentLoaded.current = true;
    }
  }, [editor, htmlContent]);


  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children
   }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
   }) => (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="icon"
      onClick={onClick}
      type="button" // important to prevent form submission
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-md">
      <div className="p-2 border-b border-input flex flex-wrap items-center gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
            <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
            <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
            <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')}>
            <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
            <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
            <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>
            <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
            <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
            <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
