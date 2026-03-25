"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { TeamMember } from "@/types";
import tippy, { Instance, Props } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

interface MentionItem {
  id: string;
  name: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

// MENTION DROPDOWN UI
const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [prevItems, setPrevItems] = useState(props.items);

  if (props.items !== prevItems) {
    setPrevItems(props.items);
    setSelectedIndex(0);
  }

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command({ id: item.id, label: item.name });
  };

  const upHandler = () =>
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  const downHandler = () => setSelectedIndex((selectedIndex + 1) % props.items.length);
  const enterHandler = () => selectItem(selectedIndex);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 w-48 z-50">
      {props.items.length > 0 ? (
        props.items.map((item: MentionItem, index: number) => (
          <button
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
              index === selectedIndex
                ? "bg-gray-100 text-black font-bold"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.name}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-gray-400 italic">No members found</div>
      )}
    </div>
  );
});
MentionList.displayName = "MentionList";

// RICH TEXT EDITOR
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  teamMembers?: TeamMember[];
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  teamMembers = [],
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
        emptyEditorClass: "is-editor-empty",
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "bg-blue-100 text-blue-700 font-bold px-1 py-0.5 rounded-xl",
        },
        suggestion: {
          items: ({ query }) => {
            return teamMembers
              .map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName || ""}`.trim() }))
              .filter((item) => item.name.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer;
            let popup: Instance<Props>[];

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                if (!props.clientRect) return;
                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup[0].setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
              },
              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }
                return (component.ref as MentionListRef | null)?.onKeyDown(props) || false;
              },
              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert" +
          "max-w-none " +
          "focus:outline-none min-h-[80px] p-3 text-black dark:text-zinc-100 " +
          "[&_p]:text-sm [&_p]:m-0 [&_p]:leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-zinc-600 transition-all">
      <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive("bold") ? "bg-gray-200 text-black" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive("italic") ? "bg-gray-200 text-black" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
        >
          <Italic size={14} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive("bulletList") ? "bg-gray-200 text-black" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition-colors ${editor.isActive("orderedList") ? "bg-gray-200 text-black" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <EditorContent editor={editor} className="max-h-[200px] overflow-y-auto cursor-text" />
    </div>
  );
}
