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
 * NEMOA 로고 — 앱 아이콘(public/icon.svg)과 동일한 아이소메트릭 블록 두 개.
 * 겹친 잉크(#1F1F2E)·인디고(#4F46E5) 큐브에 각 상단·측면 면을 밝게 틴트해
 * 3D처럼 보이게 한다. 경로는 icon.svg와 동일 — 앱 아이콘·스플래시·인앱 로고가
 * 전부 같은 문법을 쓰도록 (과거엔 이 로고만 납작한 겹친 사각형이라 아이콘·
 * 스플래시와 브랜드 문법이 어긋났음, P1-26).
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
        viewBox="0 0 100 100"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* 잉크 큐브 — 상단·측면 밝게 틴트, 정면 #1F1F2E */}
        <path d="M14 22 L22 14 L64 14 L56 22 Z" fill="#9A9AA1"/>
        <path d="M56 22 L64 14 L64 56 L56 64 Z" fill="#62626D"/>
        <path d="M14 22 L56 22 L56 64 L14 64 Z" fill="#1F1F2E"/>
        {/* 인디고 큐브 — 상단·측면 밝게 틴트, 정면 #4F46E5 */}
        <path d="M40 46 L48 38 L88 38 L80 46 Z" fill="#A7A2F2"/>
        <path d="M80 46 L88 38 L88 78 L80 86 Z" fill="#807AEC"/>
        <path d="M40 46 L80 46 L80 86 L40 86 Z" fill="#4F46E5"/>
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
