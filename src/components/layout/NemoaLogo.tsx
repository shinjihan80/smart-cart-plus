type Size = 'sm' | 'md' | 'lg';

interface NemoaLogoProps {
  size?:        Size;
  withTagline?: boolean;
  className?:   string;
}

const SIZE_MAP: Record<Size, { box: number; text: string; gap: string; tag: string }> = {
  sm: { box: 28, text: 'text-base',    gap: 'gap-2',    tag: 'text-[9px]' },
  md: { box: 36, text: 'text-[24px]',  gap: 'gap-2.5',  tag: 'text-xs'    },
  lg: { box: 52, text: 'text-[32px]',  gap: 'gap-3',    tag: 'text-xs'    },
};

/**
 * NEMOA 로고 — 빨강·파랑 두 네모가 겹쳐 가운데에 어두운 잉크를 만드는 형태.
 *
 *  - 좌상단: 빨강 정사각 (#EE5454)
 *  - 우하단: 파랑 정사각 (#4263EB)
 *  - 겹침 영역: 잉크 (#1F1F2E)  ← 별도 사각형으로 표현
 *
 * 워드마크는 SUIT font-black + tracking-tight으로 두껍고 단단한 느낌.
 */
export default function NemoaLogo({ size = 'md', withTagline = false, className = '' }: NemoaLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 48 48"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* 좌상단 빨강 네모 */}
        <rect x="3" y="3" width="26" height="26" rx="6" fill="#EE5454"/>
        {/* 우하단 파랑 네모 */}
        <rect x="19" y="19" width="26" height="26" rx="6" fill="#4263EB"/>
        {/* 겹침 영역 — 어두운 잉크 (두 네모의 교집합 좌표: 19,19 ~ 29,29) */}
        <rect x="19" y="19" width="10" height="10" rx="2" fill="#2D2748"/>
      </svg>

      <span className="flex flex-col leading-none">
        <span
          className={`${s.text} text-brand-ink tracking-tighter`}
          style={{ fontWeight: 900, letterSpacing: '-0.04em' }}
        >
          NEMOA
        </span>
        {withTagline && (
          <span className={`${s.tag} text-gray-400 mt-1 tracking-wide`}>
            일상을 반듯하게 모으다
          </span>
        )}
      </span>
    </div>
  );
}
