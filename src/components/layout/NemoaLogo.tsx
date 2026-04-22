type Size = 'sm' | 'md' | 'lg';

interface NemoaLogoProps {
  size?:        Size;
  withTagline?: boolean;
  className?:   string;
}

const SIZE_MAP: Record<Size, { box: number; text: string; tag: string }> = {
  sm: { box: 28, text: 'text-sm',     tag: 'text-[8px]' },
  md: { box: 36, text: 'text-[22px]', tag: 'text-sm'    },
  lg: { box: 48, text: 'text-3xl',    tag: 'text-xs'    },
};

/**
 * NEMOA 로고 — 세 개의 네모가 겹쳐 색이 혼합되는 형태.
 *
 * 디자인 의도:
 *  - 세 개의 둥근 사각형이 대각선으로 겹침
 *  - 각 사각형은 brand-primary fill-opacity 0.55
 *  - 겹침 영역은 자연스럽게 더 진해져 혼합 효과
 *  - "데이터를 네모(공간)에 모으다" 은유 강화 — 여러 조각이 합쳐짐
 */
export default function NemoaLogo({ size = 'md', withTagline = false, className = '' }: NemoaLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 48 48"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* 3개의 네모가 대각선으로 겹침. fill-opacity가 자연스럽게 혼합됨 */}
        <rect x="4"  y="14" width="20" height="20" rx="5"
              fill="#4F46E5" fillOpacity="0.55" />
        <rect x="14" y="4"  width="20" height="20" rx="5"
              fill="#4F46E5" fillOpacity="0.55" />
        <rect x="24" y="14" width="20" height="20" rx="5"
              fill="#4F46E5" fillOpacity="0.55" />
      </svg>

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
