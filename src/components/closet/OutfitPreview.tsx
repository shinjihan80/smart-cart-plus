'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FASHION_GROUP, type ClothingItem, type FashionGroup } from '@/types';
import { useProfiles } from '@/lib/profile';
import { usePersistedState } from '@/lib/usePersistedState';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { useToast } from '@/context/ToastContext';
import { haptic } from '@/lib/haptics';
import { springTransition, CARD, CARD_SHADOW } from './shared';

const SLOTS: { key: string; label: string; groups: FashionGroup[]; emoji: string }[] = [
  { key: '상의',     label: '상의',     groups: ['의류'],    emoji: '👕' },
  { key: '하의',     label: '하의',     groups: ['의류'],    emoji: '👖' },
  { key: '신발',     label: '신발',     groups: ['신발'],    emoji: '👟' },
  { key: '액세서리', label: '액세서리', groups: ['액세서리'], emoji: '✨' },
];

export default function OutfitPreview({ items }: { items: ClothingItem[] }) {
  const { profiles } = useProfiles();
  const { outfits, save: saveOutfit, remove: removeOutfit } = useSavedOutfits();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Record<string, string | null>>({
    상의: null, 하의: null, 아우터: null, 신발: null, 액세서리: null,
  });
  // 'all' | 'shared' | profileId
  const [ownerFilter, setOwnerFilter] = usePersistedState<string>(
    'nemoa-outfit-owner', 'all',
    (raw) => typeof raw === 'string' ? raw : null,
  );
  const [saveOpen, setSaveOpen] = useState(false);
  const [outfitName, setOutfitName] = useState('');

  const hasImages = items.filter((i) => i.imageUrl);
  const filtered = useMemo(() => {
    if (ownerFilter === 'all')    return hasImages;
    if (ownerFilter === 'shared') return hasImages.filter((i) => !i.ownerId);
    return hasImages.filter((i) => i.ownerId === ownerFilter);
  }, [hasImages, ownerFilter]);

  if (hasImages.length < 2) return null;

  function getItemsForSlot(key: string): ClothingItem[] {
    switch (key) {
      case '상의':     return filtered.filter((i) => ['상의', '원피스'].includes(i.category));
      case '하의':     return filtered.filter((i) => i.category === '하의');
      case '신발':     return filtered.filter((i) => i.category === '신발');
      case '액세서리': return filtered.filter((i) => FASHION_GROUP[i.category] === '액세서리');
      default:         return [];
    }
  }

  function cycleItem(key: string) {
    const pool = getItemsForSlot(key);
    if (pool.length === 0) return;
    const currentIdx = pool.findIndex((i) => i.id === selected[key]);
    const nextIdx = (currentIdx + 1) % pool.length;
    setSelected((prev) => ({ ...prev, [key]: pool[nextIdx].id }));
  }

  const selectedItems = SLOTS
    .map((s) => {
      const pool = getItemsForSlot(s.key);
      const item = pool.find((i) => i.id === selected[s.key]) ?? pool[0];
      return item ? { ...s, item } : null;
    })
    .filter(Boolean) as { key: string; label: string; emoji: string; item: ClothingItem }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.08 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">👗</span>
          <span className="text-xs text-gray-400 font-medium">코디 미리보기</span>
        </div>
        {profiles.length >= 2 && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setOwnerFilter('all')}
              className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                ownerFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setOwnerFilter(p.id)}
                className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                  ownerFilter === p.id
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setOwnerFilter('shared')}
              className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                ownerFilter === 'shared'
                  ? 'bg-gray-500 text-white'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              공용
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {selectedItems.map(({ key, emoji, item }) => (
          <button
            key={key}
            onClick={() => cycleItem(key)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-brand-primary/30 transition-colors">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">{emoji}</div>
              )}
            </div>
            <span className="text-xs text-gray-400 truncate max-w-[64px]">{item.name}</span>
          </button>
        ))}
      </div>

      {selectedItems.length > 0 ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-300">탭해서 다른 아이템으로 교체</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                // 각 슬롯마다 랜덤 아이템 선택
                const next: Record<string, string | null> = { ...selected };
                for (const slot of ['상의', '하의', '신발', '액세서리']) {
                  const pool = getItemsForSlot(slot);
                  if (pool.length === 0) continue;
                  next[slot] = pool[Math.floor(Math.random() * pool.length)].id;
                }
                setSelected(next);
                haptic('tap');
              }}
              className="text-sm font-semibold text-gray-500 hover:text-brand-primary"
              title="무작위로 코디 조합 생성"
            >
              🎲 섞기
            </button>
            <button
              onClick={() => setSaveOpen(!saveOpen)}
              className="text-sm font-semibold text-brand-primary hover:underline"
            >
              💾 이 코디 저장
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          이 필터에는 미리볼 옷이 없어요. 다른 필터를 선택해보세요.
        </p>
      )}

      {saveOpen && selectedItems.length > 0 && (
        <div className="mt-2 rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-2.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              placeholder="코디 이름 (예: 봄 출근 코디)"
              maxLength={30}
              className="flex-1 text-xs text-gray-800 bg-white border border-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && outfitName.trim()) {
                  const slots: Record<string, string> = {};
                  for (const si of selectedItems) slots[si.key] = si.item.id;
                  saveOutfit(outfitName, slots);
                  haptic('toggle');
                  showToast(`"${outfitName}" 코디 저장했어요.`);
                  setOutfitName('');
                  setSaveOpen(false);
                }
              }}
            />
            <button
              onClick={() => {
                const slots: Record<string, string> = {};
                for (const si of selectedItems) slots[si.key] = si.item.id;
                saveOutfit(outfitName || `코디 ${outfits.length + 1}`, slots);
                haptic('toggle');
                showToast(`코디 저장했어요.`);
                setOutfitName('');
                setSaveOpen(false);
              }}
              className="text-sm font-semibold px-2.5 py-1 rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {outfits.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <p className="text-sm text-gray-400 font-medium mb-1.5">저장된 코디 {outfits.length}</p>
          <div className="flex gap-1 flex-wrap">
            {outfits.slice(-10).map((o) => (
              <div key={o.id} className="flex items-center rounded-full bg-gray-50 border border-gray-100 overflow-hidden">
                <button
                  onClick={() => {
                    setSelected((prev) => ({ ...prev, ...o.slots }));
                    haptic('tap');
                    showToast(`"${o.name}" 불러왔어요.`);
                  }}
                  className="text-sm px-2 py-0.5 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {o.name}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${o.name}" 삭제할까요?`)) removeOutfit(o.id);
                  }}
                  aria-label={`${o.name} 삭제`}
                  className="text-sm px-1.5 py-0.5 text-gray-400 hover:text-brand-warning border-l border-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
