'use client';

import { type WardrobeConfig } from '@/lib/wardrobeModel';

interface RowProps {
  label: string;
  emoji: string;
  options: { value: string | number | boolean; label: string }[];
  current: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}

function SectionRow({ label, emoji, options, current, onChange }: RowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base shrink-0" aria-hidden>{emoji}</span>
      <span className="text-xs font-semibold text-gray-700 w-20 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => {
          const active = opt.value === current;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                active
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface WardrobeSectionPickerProps {
  config:   WardrobeConfig;
  onChange: (config: WardrobeConfig) => void;
}

export function WardrobeSectionPicker({ config, onChange }: WardrobeSectionPickerProps) {
  const set = <K extends keyof WardrobeConfig>(key: K, value: WardrobeConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="flex flex-col gap-3 p-3 bg-white rounded-[18px] ring-1 ring-gray-100"
      style={{ boxShadow: '0 1px 4px -2px rgba(31,31,46,0.10)' }}>
      <SectionRow
        label="걸이 공간"
        emoji="🪝"
        options={[
          { value: 'none',   label: '없음' },
          { value: 'single', label: '1단' },
          { value: 'double', label: '2단' },
        ]}
        current={(config.hangingType as string) === 'standard' ? 'single' : config.hangingType}
        onChange={(v) => set('hangingType', v as WardrobeConfig['hangingType'])}
      />
      <SectionRow
        label="서랍"
        emoji="🗂️"
        options={[
          { value: 0, label: '없음' },
          { value: 1, label: '1단' },
          { value: 2, label: '2단' },
          { value: 3, label: '3단' },
          { value: 4, label: '4단' },
          { value: 5, label: '5단' },
        ]}
        current={config.drawers}
        onChange={(v) => set('drawers', v as WardrobeConfig['drawers'])}
      />
      <SectionRow
        label="작은 서랍"
        emoji="🗂️"
        options={[
          { value: 0, label: '없음' },
          { value: 2, label: '2칸' },
          { value: 3, label: '3칸' },
        ]}
        current={config.splitDrawer ?? 0}
        onChange={(v) => set('splitDrawer', v as WardrobeConfig['splitDrawer'])}
      />
      <SectionRow
        label="신발장"
        emoji="👟"
        options={[
          { value: true,  label: '있음' },
          { value: false, label: '없음' },
        ]}
        current={config.hasShoes}
        onChange={(v) => set('hasShoes', v as boolean)}
      />
      <SectionRow
        label="가방 선반"
        emoji="👜"
        options={[
          { value: true,  label: '있음' },
          { value: false, label: '없음' },
        ]}
        current={config.hasBags}
        onChange={(v) => set('hasBags', v as boolean)}
      />
      <SectionRow
        label="악세서리"
        emoji="✨"
        options={[
          { value: true,  label: '있음' },
          { value: false, label: '없음' },
        ]}
        current={config.hasAccessories}
        onChange={(v) => set('hasAccessories', v as boolean)}
      />
    </div>
  );
}
