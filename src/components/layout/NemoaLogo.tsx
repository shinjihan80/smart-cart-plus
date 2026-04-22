type Size = 'sm' | 'md' | 'lg';

interface NemoaLogoProps {
  size?:        Size;
  withTagline?: boolean;
  className?:   string;
}

const SIZE_MAP: Record<Size, { box: number; text: string; tag: string }> = {
  sm: { box: 32, text: 'text-base',    tag: 'text-[9px]' },
  md: { box: 40, text: 'text-[26px]',  tag: 'text-xs'    },
  lg: { box: 56, text: 'text-[34px]',  tag: 'text-xs'    },
};

/**
 * NEMOA 로고 — 큰 네모 프레임 안에 색이 다른 두 개의 네모가 겹친 형태.
 *
 *  - 외곽: 큰 네모 아웃라인 (brand-primary)
 *  - 내부 A: primary solid (indigo)
 *  - 내부 B: pink 포인트 (겹침 영역에서 Pink가 앞)
 *
 * "네모(프레임) 안에 서로 다른 조각들을 모아(combine)" — 식·의 두 도메인 상징.
 */
export default function NemoaLogo({ size = 'md', withTagline = false, className = '' }: NemoaLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 48 48"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* 외곽 큰 네모 — 프레임 */}
        <rect x="3" y="3" width="42" height="42" rx="10"
              fill="none" stroke="#4F46E5" strokeWidth="2.5"/>

        {/* 내부 네모 A — indigo solid (왼쪽 위) */}
        <rect x="11" y="11" width="18" height="18" rx="4"
              fill="#4F46E5"/>

        {/* 내부 네모 B — pink accent (오른쪽 아래, 겹침) */}
        <rect x="19" y="19" width="18" height="18" rx="4"
              fill="#EC4899" fillOpacity="0.92"/>
      </svg>

      <span className="flex flex-col leading-none">
        <span className={`${s.text} font-black tracking-tight text-gray-900`}>NEMOA</span>
        {withTagline && (
          <span className={`${s.tag} text-gray-400 mt-1 tracking-wide`}>
            일상을 반듯하게 모으다
          </span>
        )}
      </span>
    </div>
  );
}
