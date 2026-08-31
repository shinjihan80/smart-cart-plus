'use client';

import { getFashionCategoryTone } from '@/lib/categoryImages';
import type { Outfit } from '@/lib/outfitMatcher';
import type { ClothingItem } from '@/types';

interface OutfitCardProps {
  outfit:  Outfit;
  onClick: () => void;
}

/**
 * 코디 카드 — 슬롯 위계가 보이는 콜라주.
 *
 * 이전엔 2x2 균등 그리드라 반지(액세서리)가 상의·하의와 같은 비중이었다.
 * 이제 골격(원피스/아우터/상의/하의)은 넓은 좌측, 부속(신발/액세서리)은
 * 좁은 우측 열에 작게 → "이 앱은 옷을 안다"로 읽히게. (P1-14)
 *
 * NOTE: 가벼운 <button>+CSS active scale 만 사용. framer-motion gesture 는
 * 캐러셀 안에서 포인터 캡쳐를 유발할 가능성이 있어 의도적으로 생략.
 */
export default function OutfitCard({ outfit, onClick }: OutfitCardProps) {
  const s = outfit.slots;
  // 골격 — 최대 2칸 (원피스는 단독, 아니면 상의+하의 / 아우터+상의)
  const skeleton: ClothingItem[] = (
    s.onepiece ? [s.onepiece, s.outer]
               : [s.outer ?? s.top, s.outer ? s.top : s.bottom]
  ).filter(Boolean).slice(0, 2) as ClothingItem[];
  // 부속 — 신발·액세서리
  const accents: ClothingItem[] = [s.shoes, s.accessory].filter(Boolean).slice(0, 2) as ClothingItem[];

  const names = [...skeleton, ...accents].map((i) => i.name);
  const sublabel = names.length > 0 ? names.slice(0, 3).join(' · ') : '탭하면 상세';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-gray-100 hover:ring-brand-primary/30 transition-all active:scale-[0.97]"
      style={{ touchAction: 'manipulation' }}
      aria-label={`${outfit.label} 코디 상세 보기`}
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: accents.length > 0 ? '3fr 2fr' : '1fr' }}
      >
        <div
          className="grid h-full w-full"
          style={{ gridTemplateRows: `repeat(${Math.max(skeleton.length, 1)}, 1fr)` }}
        >
          {(skeleton.length > 0 ? skeleton : [undefined]).map((item, i) => (
            <SlotBox key={i} item={item} />
          ))}
        </div>
        {accents.length > 0 && (
          <div
            className="grid h-full w-full border-l border-white/50"
            style={{ gridTemplateRows: `repeat(${accents.length}, 1fr)` }}
          >
            {accents.map((item, i) => (
              <SlotBox key={i} item={item} small />
            ))}
          </div>
        )}
      </div>

      {/* 이유 배지 — 좌상단 */}
      {outfit.reasons.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
          {outfit.reasons.slice(0, 2).map((r) => (
            <span
              key={r}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* 라벨 오버레이 — 하단 그라데이션. 시즌 라벨은 한 번, 나머지는 실제 아이템명 */}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/65 to-transparent pointer-events-none">
        <p className="text-xs font-bold text-white truncate text-left">
          {outfit.label}
        </p>
        <p className="text-[10px] text-white/80 truncate text-left">
          {sublabel}
        </p>
      </div>
    </button>
  );
}

function SlotBox({ item, small = false }: { item?: ClothingItem; small?: boolean }) {
  if (!item) {
    return <div className="w-full h-full bg-gray-100" aria-hidden />;
  }
  const tone = getFashionCategoryTone(item.category);
  return (
    <div className={`relative w-full h-full overflow-hidden ${tone.bg} flex items-center justify-center`}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className={small ? 'text-xl' : 'text-3xl'} aria-hidden>{tone.emoji}</span>
      )}
    </div>
  );
}
