import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

// 팀 공용 글쓰기 에디터 (내용은 HTML 글자로 주고받음, 비어 있으면 '')
function TiptapEditor({ value, onChange, placeholder = '', limit = 1000, label }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            CharacterCount.configure({ limit }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        // v3는 기본으로 다시 그리지 않아서, 글자 수와 툴바 선택 표시가 바로 바뀌게 켜 둠
        shouldRerenderOnTransaction: true,
        editorProps: {
            attributes: {
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': label,
                // Tiptap은 띄어쓰기로만 class를 나눠서, 줄바꿈이 섞이면 에러가 남 (한 줄 유지)
                class: 'min-h-48 px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none [&_p]:mb-2 [&_strong]:font-bold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5',
            },
        },
        // 빈 에디터도 <p></p>를 주기 때문에 부모가 빈 칸 검사를 쉽게 하도록 ''로 바꿔 줌
        onUpdate: ({ editor: current }) => {
            onChange(current.isEmpty ? '' : current.getHTML());
        },
    });

    // 부모가 값을 ''로 비우면(등록 완료 뒤) 에디터 안 글도 지움
    useEffect(() => {
        if (editor && value === '' && !editor.isEmpty) {
            editor.commands.clearContent();
        }
    }, [editor, value]);

    if (!editor) return null;

    const tools = [
        { label: '굵게', icon: Bold, name: 'bold', run: () => editor.chain().focus().toggleBold().run() },
        { label: '기울임', icon: Italic, name: 'italic', run: () => editor.chain().focus().toggleItalic().run() },
        { label: '글머리 목록', icon: List, name: 'bulletList', run: () => editor.chain().focus().toggleBulletList().run() },
        { label: '번호 목록', icon: ListOrdered, name: 'orderedList', run: () => editor.chain().focus().toggleOrderedList().run() },
    ];

    return (
        <div>
            <div className="rounded-lg border border-gray-300 focus-within:border-brand">
                <div className="flex gap-1 border-b border-gray-200 px-2 py-1.5">
                    {tools.map(({ label: toolLabel, icon: Icon, name, run }) => (
                        <button
                            key={name}
                            type="button"
                            onClick={run}
                            aria-label={toolLabel}
                            aria-pressed={editor.isActive(name)}
                            className={`rounded p-1.5 ${
                                editor.isActive(name) ? 'bg-brand-light text-brand' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <Icon size={16} aria-hidden="true" />
                        </button>
                    ))}
                </div>
                <EditorContent editor={editor} />
            </div>
            <p className="mt-1 text-right text-xs text-gray-400">
                {editor.storage.characterCount.characters()} / {limit}
            </p>
        </div>
    );
}

export default TiptapEditor;