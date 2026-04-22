type Size = 'sm' | 'md' | 'lg';

interface NemoaLogoProps {
  size?:        Size;
  withTagline?: boolean;
  className?:   string;
}

const SIZE_MAP: Record<Size, { box: number; text: string; tag: string }> = {
  sm: { box: 24, text: 'text-sm',     tag: 'text-[8px]' },
  md: { box: 32, text: 'text-[22px]', tag: 'text-sm'    },
  lg: { box: 44, text: 'text-3xl',    tag: 'text-xs'    },
};

/**
 * NEMOA 로고 — "네모 안에 네모" 동심 배열.
 *
 * 외곽: 둥근 사각형 아웃라인 (brand-primary)
 * 내부: 둥근 사각형 솔리드 (brand-primary) — 중앙 정렬
 *
 * 은유: "데이터를 네모(공간) 안에 모아(수집)" — NEMOA
 */
export default function NemoaLogo({ size = 'md', withTagline = false, className = '' }: NemoaLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 네모 안에 네모 SVG */}
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 48 48"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* 외곽 네모 — 아웃라인 */}
        <rect
          x="4" y="4" width="40" height="40" rx="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-brand-primary"
        />
        {/* 내부 네모 — 솔리드 */}
        <rect
          x="16" y="16" width="16" height="16" rx="4"
          fill="currentColor"
          className="text-brand-primary"
        />
      </svg>

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
