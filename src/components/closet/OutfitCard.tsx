'use client';

import { getFashionCategoryTone } from '@/lib/categoryImages';
import type { Outfit } from '@/lib/outfitMatcher';
import type { ClothingItem } from '@/types';

interface OutfitCardProps {
  outfit:  Outfit;
  onClick: () => void;
  /** 'hero' — 오늘 입을 코디의 큰 대표 카드(4:3, 큰 이모지). 'compact' — 그 외 작은 그리드용. */
  size?:   'hero' | 'compact';
}

/**
 * 코디 카드 — 슬롯 위계가 보이는 콜라주.
 *
 * 골격(원피스/아우터/상의/하의)은 넓은 좌측, 부속(신발/액세서리)은
 * 좁은 우측 열에 작게 → "이 앱은 옷을 안다"로 읽히게. (P1-14)
 *
 * NOTE: 가벼운 <button>+CSS active scale 만 사용. framer-motion gesture 는
 * 캐러셀 안에서 포인터 캡쳐를 유발할 가능성이 있어 의도적으로 생략.
 */
export default function OutfitCard({ outfit, onClick, size = 'compact' }: OutfitCardProps) {
  const s = outfit.slots;
  const isHero = size === 'hero';
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
      className="group relative flex flex-col w-full overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-gray-100 hover:ring-brand-primary/30 transition-all active:scale-[0.98]"
      style={{ touchAction: 'manipulation' }}
      aria-label={`${outfit.label} 코디 상세 보기`}
    >
      {/* 콜라주 — 라벨을 이 위에 얹지 않는다. 이전엔 하단 그라데이션 오버레이가
          라벨 가독성을 위해 카드 높이의 45%까지 콜라주를 가렸고, 그래도
          대비가 부족해(실측 최대 2.17:1, 필요 4.5:1) 액세서리 칸의 밝은
          이모지(반지 등) 위에서 글자가 씹혀 보였다(전문단 E3 실측 확인).
          라벨을 아예 별도 불투명 밴드로 분리해 겹침을 구조적으로 없앤다. */}
      <div className={`relative w-full ${isHero ? 'aspect-[4/3]' : 'aspect-square'}`}>
        <div
          className="grid h-full w-full"
          style={{ gridTemplateColumns: accents.length > 0 ? '3fr 2fr' : '1fr' }}
        >
          <div
            className="grid h-full w-full"
            style={{ gridTemplateRows: `repeat(${Math.max(skeleton.length, 1)}, 1fr)` }}
          >
            {(skeleton.length > 0 ? skeleton : [undefined]).map((item, i) => (
              <SlotBox key={i} item={item} hero={isHero} />
            ))}
          </div>
          {accents.length > 0 && (
            <div
              className="grid h-full w-full border-l border-white/50"
              style={{ gridTemplateRows: `repeat(${accents.length}, 1fr)` }}
            >
              {accents.map((item, i) => (
                <SlotBox key={i} item={item} small hero={isHero} />
              ))}
            </div>
          )}
        </div>

        {/* 이유 배지 — 좌상단 */}
        {outfit.reasons.length > 0 && (
          <div className={`absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] ${isHero ? 'top-3 left-3 gap-1.5' : ''}`}>
            {outfit.reasons.slice(0, 2).map((r) => (
              <span
                key={r}
                className={`font-semibold rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm ${isHero ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5'}`}
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 라벨 — 콜라주와 겹치지 않는 불투명 밴드. 시즌 라벨은 한 번, 나머지는
          실제 아이템명. */}
      <div className={`bg-gray-900 ${isHero ? 'px-4 py-3' : 'px-3 py-1.5'}`}>
        <p className={`font-bold text-white truncate text-left ${isHero ? 'text-base' : 'text-xs'}`}>
          {outfit.label}
        </p>
        <p className={`text-white/70 truncate text-left ${isHero ? 'text-xs mt-0.5' : 'text-[10px]'}`}>
          {sublabel}
        </p>
      </div>
    </button>
  );
}

function SlotBox({ item, small = false, hero = false }: { item?: ClothingItem; small?: boolean; hero?: boolean }) {
  if (!item) {
    return <div className="w-full h-full bg-gray-100" aria-hidden />;
  }
  const tone = getFashionCategoryTone(item.category);
  const emojiSize = hero ? (small ? 'text-3xl' : 'text-5xl') : (small ? 'text-xl' : 'text-3xl');
  return (
    <div className={`relative w-full h-full overflow-hidden ${tone.bg} flex items-center justify-center`}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span className={emojiSize} aria-hidden>{tone.emoji}</span>
      )}
    </div>
  );
}
