'use client';

interface InstanceMetaEditorProps {
  name:          string;
  emoji:         string;
  emojis:        string[];
  onNameChange:  (name: string) => void;
  onEmojiChange: (emoji: string) => void;
}

export function InstanceMetaEditor({
  name, emoji, emojis, onNameChange, onEmojiChange,
}: InstanceMetaEditorProps) {
  return (
    <div className="flex flex-col gap-2.5 p-3 bg-white rounded-[18px] ring-1 ring-gray-100"
      style={{ boxShadow: '0 1px 4px -2px rgba(31,31,46,0.10)' }}>
      {/* 이름 입력 */}
      <div className="flex items-center gap-2">
        <span className="text-xl shrink-0" aria-hidden>{emoji}</span>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="이름 입력"
          maxLength={14}
          className="flex-1 text-sm font-semibold bg-gray-50 rounded-xl px-3 py-1.5 outline-none ring-1 ring-gray-200 focus:ring-indigo-400 transition-all"
        />
      </div>

      {/* 이모지 선택 */}
      <div className="flex flex-wrap gap-1.5">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onEmojiChange(e)}
            className={[
              'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all',
              e === emoji
                ? 'bg-indigo-100 ring-2 ring-indigo-500'
                : 'bg-gray-100 hover:bg-gray-200',
            ].join(' ')}
            aria-pressed={e === emoji}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
