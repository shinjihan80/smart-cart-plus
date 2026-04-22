'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isClothingItem, FASHION_EMOJI, FASHION_GROUP, type CartItem, type ClothingItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth, matchesSeason } from '@/lib/season';
import { PARTNERS } from '@/lib/partnerLinks';
import { springTransition, CARD, CARD_SHADOW } from './shared';

const SEASON_EMOJI = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' } as const;

export default function SeasonalStorageSection({ items }: { items: CartItem[] }) {
  const { updateItem } = useCart();
  const { showToast } = useToast();
  const [stowOpen, setStowOpen]     = useState(false);
  const [unstowOpen, setUnstowOpen] = useState(false);

  const season = currentSeasonByMonth();
  const clothes = items.filter(isClothingItem).filter((c) => FASHION_GROUP[c.category] === '의류');

  // 보관 후보: 보관 중 아님 + 현재 계절과 안 맞는 태그가 있는 옷
  const stowCandidates = clothes.filter((c) => {
    if (c.hibernating) return false;
    const match = matchesSeason(c.weatherTags, season);
    return match === false;  // null(불명)은 제외
  });

  // 꺼낼 후보: 보관 중 + 현재 계절에 맞는 옷
  const unstowCandidates = clothes.filter(
    (c) => c.hibernating && matchesSeason(c.weatherTags, season) === true,
  );

  // 단순 보관 중 목록 (계절 무관 — 꺼내기 일괄 처리용)
  const allStored = clothes.filter((c) => c.hibernating);

  if (stowCandidates.length === 0 && allStored.length === 0) return null;

  function handleStow(item: ClothingItem) {
    updateItem(item.id, { hibernating: true });
    showToast(`"${item.name}" 보관해뒀어요.`);
  }

  function handleStowAll() {
    if (!confirm(`${stowCandidates.length}벌을 모두 보관해둘까요?`)) return;
    stowCandidates.forEach((c) => updateItem(c.id, { hibernating: true }));
    showToast(`${stowCandidates.length}벌 보관됐어요.`);
    setStowOpen(false);
  }

  function handleUnstow(item: ClothingItem) {
    updateItem(item.id, { hibernating: false });
    showToast(`"${item.name}" 꺼냈어요.`);
  }

  function handleUnstowSeasonal() {
    if (unstowCandidates.length === 0) return;
    if (!confirm(`${season}철 옷 ${unstowCandidates.length}벌을 모두 꺼낼까요?`)) return;
    unstowCandidates.forEach((c) => updateItem(c.id, { hibernating: false }));
    showToast(`${unstowCandidates.length}벌 꺼냈어요.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.28 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{SEASON_EMOJI[season]}</span>
        <span className="text-xs text-gray-400 font-medium">계절 보관</span>
        <span className="text-[11px] text-gray-400">· 지금은 {season}</span>
      </div>

      {/* 꺼내라 알림 — 현재 계절에 맞는 보관된 옷 */}
      {unstowCandidates.length > 0 && (
        <div className="rounded-2xl bg-brand-success/5 border border-brand-success/20 px-3 py-2.5 mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-success">
                {SEASON_EMOJI[season]} {season}이(가) 왔어요!
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                보관해뒀던 {season}철 옷 {unstowCandidates.length}벌을 꺼낼 때예요.
              </p>
            </div>
            <button
              onClick={handleUnstowSeasonal}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-success text-white hover:opacity-90 transition-opacity"
            >
              모두 꺼내기
            </button>
          </div>
        </div>
      )}

      {/* 계절 보관 제안 */}
      {stowCandidates.length > 0 && (
        <div className="rounded-2xl border border-gray-100 mb-2">
          <button
            onClick={() => setStowOpen(!stowOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">📦</span>
              <p className="text-xs font-semibold text-gray-700">
                이번 {season} 동안 보관할 옷 {stowCandidates.length}벌
              </p>
            </div>
            <ChevronDown size={14} className={`text-gray-300 shrink-0 transition-transform ${stowOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {stowOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <div className="flex gap-1.5 mb-2">
                    <button
                      onClick={handleStowAll}
                      className="flex-1 text-xs font-semibold py-2 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-opacity"
                    >
                      {stowCandidates.length}벌 모두 앱에서 보관
                    </button>
                    <button
                      disabled={!PARTNERS.storage_box.enabled}
                      title={PARTNERS.storage_box.comingSoon}
                      className="text-xs font-semibold py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 cursor-not-allowed whitespace-nowrap"
                    >
                      📦 업체 보관 <span className="text-[10px] text-gray-300 block leading-none">준비 중</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {stowCandidates.slice(0, 10).map((c) => (
                      <div key={c.id} className="flex items-center gap-2 py-1">
                        <span className="text-sm">{FASHION_EMOJI[c.category] ?? '👕'}</span>
                        <span className="flex-1 text-xs text-gray-700 truncate">{c.name}</span>
                        <span className="text-[10px] text-gray-400">{c.weatherTags?.join(', ')}</span>
                        <button
                          onClick={() => handleStow(c)}
                          className="shrink-0 text-[11px] text-brand-primary font-medium hover:underline"
                        >
                          보관
                        </button>
                      </div>
                    ))}
                    {stowCandidates.length > 10 && (
                      <p className="text-[10px] text-gray-400 text-center mt-1">외 {stowCandidates.length - 10}벌</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 보관 중 목록 */}
      {allStored.length > 0 && (
        <div className="rounded-2xl border border-gray-100">
          <button
            onClick={() => setUnstowOpen(!unstowOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">🗃️</span>
              <p className="text-xs font-semibold text-gray-700">
                보관 중 {allStored.length}벌
              </p>
            </div>
            <ChevronDown size={14} className={`text-gray-300 shrink-0 transition-transform ${unstowOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {unstowOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                  {allStored.slice(0, 12).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 py-1">
                      <span className="text-sm">{FASHION_EMOJI[c.category] ?? '👕'}</span>
                      <span className="flex-1 text-xs text-gray-700 truncate">{c.name}</span>
                      <span className="text-[10px] text-gray-400">{c.weatherTags?.join(', ')}</span>
                      <button
                        onClick={() => handleUnstow(c)}
                        className="shrink-0 text-[11px] text-brand-success font-medium hover:underline"
                      >
                        꺼내기
                      </button>
                    </div>
                  ))}
                  {allStored.length > 12 && (
                    <p className="text-[10px] text-gray-400 text-center mt-1">외 {allStored.length - 12}벌</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
