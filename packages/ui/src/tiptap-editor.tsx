"use client";

import {
  CodeIcon,
  CodeSquareIcon,
  Heading01Icon,
  Heading02Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  QuoteDownSquareIcon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons-pro/core-solid-rounded";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@userbubble/ui";
import { Icon } from "./icon";

type TiptapEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  className?: string;
  variant?: "default" | "inline";
  placeholder?: string;
};

export function TiptapEditor({
  value,
  onChange,
  onBlur,
  className,
  variant = "default",
  placeholder,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: false,
        strike: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    onBlur,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          variant === "inline"
            ? "min-h-[400px] py-2"
            : "min-h-[300px] px-4 py-3",
          "focus:outline-none",
          className
        ),
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  if (variant === "inline") {
    return (
      <div className="relative">
        {editor && (
          <BubbleMenu
            className="flex items-center gap-0.5 rounded-lg border bg-background/95 px-1 py-1 shadow-lg backdrop-blur-sm"
            editor={editor}
            tippyOptions={{ duration: 150 }}
          >
            <EditorButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Icon icon={TextBoldIcon} size={14} />
            </EditorButton>
            <EditorButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Icon icon={TextItalicIcon} size={14} />
            </EditorButton>
            <EditorButton
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Code"
            >
              <Icon icon={CodeIcon} size={14} />
            </EditorButton>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <EditorButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              title="H2"
            >
              <Icon icon={Heading01Icon} size={14} />
            </EditorButton>
            <EditorButton
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              title="H3"
            >
              <Icon icon={Heading02Icon} size={14} />
            </EditorButton>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <EditorButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <Icon icon={LeftToRightListBulletIcon} size={14} />
            </EditorButton>
            <EditorButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <Icon icon={LeftToRightListNumberIcon} size={14} />
            </EditorButton>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <EditorButton
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              <Icon icon={CodeSquareIcon} size={14} />
            </EditorButton>
            <EditorButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <Icon icon={QuoteDownSquareIcon} size={14} />
            </EditorButton>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-transparent",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      )}
    >
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
      <EditorButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Icon icon={TextBoldIcon} size={16} />
      </EditorButton>
      <EditorButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Icon icon={TextItalicIcon} size={16} />
      </EditorButton>
      <EditorButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        <Icon icon={CodeIcon} size={16} />
      </EditorButton>

      <div className="mx-1 w-px self-stretch bg-border" />

      <EditorButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Icon icon={Heading01Icon} size={16} />
      </EditorButton>
      <EditorButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Icon icon={Heading02Icon} size={16} />
      </EditorButton>

      <div className="mx-1 w-px self-stretch bg-border" />

      <EditorButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <Icon icon={LeftToRightListBulletIcon} size={16} />
      </EditorButton>
      <EditorButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <Icon icon={LeftToRightListNumberIcon} size={16} />
      </EditorButton>

      <div className="mx-1 w-px self-stretch bg-border" />

      <EditorButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        <Icon icon={CodeSquareIcon} size={16} />
      </EditorButton>
      <EditorButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        <Icon icon={QuoteDownSquareIcon} size={16} />
      </EditorButton>
    </div>
  );
}

function EditorButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      className={cn(
        "rounded p-1.5 transition-colors",
        "hover:bg-accent",
        active && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}
