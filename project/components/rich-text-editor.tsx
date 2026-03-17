"use client";

import { useEditor, Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Strikethrough } from "lucide-react";
import { useEffect } from "react";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-gray-200 text-black" : "text-gray-500 hover:bg-gray-200 hover:text-black"}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-gray-200 text-black" : "text-gray-500 hover:bg-gray-200 hover:text-black"}`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("strike") ? "bg-gray-200 text-black" : "text-gray-500 hover:bg-gray-200 hover:text-black"}`}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bulletList") ? "bg-gray-200 text-black" : "text-gray-500 hover:bg-gray-200 hover:text-black"}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("orderedList") ? "bg-gray-200 text-black" : "text-gray-500 hover:bg-gray-200 hover:text-black"}`}
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
        // This specific class makes the placeholder behave correctly in Tailwind
        emptyEditorClass:
          "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-gray-400 before:pointer-events-none",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        // Tailwind's reset hides lists by default, so we force them back on here
        class:
          "p-4 min-h-[120px] focus:outline-none text-sm text-black [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 space-y-2",
      },
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. loading existing task data)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-white rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all flex flex-col overflow-hidden relative">
      <MenuBar editor={editor} />
      <div className="flex-1 cursor-text bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
