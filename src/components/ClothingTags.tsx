import { ClothingItem } from '@/types';

interface Props {
  item: ClothingItem;
  wide?: boolean;
}

const THICKNESS_BADGE: Record<ClothingItem['thickness'], { label: string; className: string }> = {
  얇음:  { label: '🌬️ 얇음',  className: 'bg-sky-50 text-sky-600' },
  보통:  { label: '👕 보통',  className: 'bg-slate-100 text-slate-600' },
  두꺼움: { label: '🧥 두꺼움', className: 'bg-purple-50 text-purple-600' },
};

/**
 * ClothingTags — 하이엔드 에디토리얼 스타일
 *
 * 사이즈를 text-3xl font-bold로 크게 표시해 핵심 데이터를 시각적 포인트로 강조.
 */
export default function ClothingTags({ item, wide }: Props) {
  const thickness = THICKNESS_BADGE[item.thickness];

  return (
    <div className={`flex items-end justify-between gap-3 mt-3 ${wide ? 'mt-4' : ''}`}>
      {/* 왼쪽: 사이즈 (핵심 데이터 강조) */}
      <div className="flex flex-col gap-0.5">
        <span className={`font-bold leading-none tracking-tight text-gray-900 ${wide ? 'text-4xl' : 'text-3xl'}`}>
          {item.size}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {item.material}
        </span>
      </div>

      {/* 오른쪽: 두께 배지 */}
      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${thickness.className}`}>
        {thickness.label}
      </span>
    </div>
  );
}
