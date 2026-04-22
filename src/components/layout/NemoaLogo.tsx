import { Square } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

interface NemoaLogoProps {
  size?:        Size;
  withTagline?: boolean;
  className?:   string;
}

const SIZE_MAP: Record<Size, { wrap: string; back: number; front: number; text: string; tag: string }> = {
  sm: { wrap: 'w-5 h-5',  back: 18, front: 14, text: 'text-sm',        tag: 'text-[8px]'  },
  md: { wrap: 'w-7 h-7',  back: 24, front: 18, text: 'text-[22px]',    tag: 'text-[11px]' },
  lg: { wrap: 'w-10 h-10', back: 36, front: 28, text: 'text-3xl',       tag: 'text-xs'    },
};

/**
 * NEMOA 브랜드 로고 — 두 개의 부드러운 사각형이 겹친 아이콘 + wordmark.
 * 뒤쪽 사각형은 tint, 앞쪽 사각형은 primary solid로 "네모 속 네모 = 모이는 데이터"를 은유.
 */
export default function NemoaLogo({ size = 'md', withTagline = false, className = '' }: NemoaLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 겹침형 아이콘 */}
      <span className={`relative ${s.wrap} shrink-0`} aria-hidden="true">
        <Square
          size={s.back}
          strokeWidth={2.4}
          className="absolute -left-0.5 -top-0.5 text-brand-primary/25 rotate-[-8deg]"
          fill="currentColor"
          style={{ borderRadius: 8 }}
        />
        <Square
          size={s.front}
          strokeWidth={2.6}
          className="absolute right-0 bottom-0 text-brand-primary"
          fill="currentColor"
        />
      </span>

      {/* 워드마크 + 태그라인 */}
      <span className="flex flex-col leading-none">
        <span className={`${s.text} font-extrabold tracking-tight text-gray-900`}>NEMOA</span>
        {withTagline && (
          <span className={`${s.tag} text-gray-400 mt-0.5 tracking-wide`}>
            일상을 반듯하게 모으다
          </span>
        )}
      </span>
    </div>
  );
}
