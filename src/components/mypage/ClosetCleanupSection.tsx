'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isClothingItem, type CartItem } from '@/types';
import { FASHION_ICON } from '@/lib/iconMap';
import { useWearLog } from '@/lib/wearLog';
import { findCleanupCandidates } from '@/lib/closetCleanup';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import PartnerChip from '@/components/PartnerChip';
import { PARTNERS } from '@/lib/partnerLinks';
import { usePersistedState } from '@/lib/usePersistedState';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function ClosetCleanupSection({ items }: { items: CartItem[] }) {
  const { log: wearLog } = useWearLog();
  const { removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'nemoa-mypage-cleanup-open', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );

  const clothes = items.filter(isClothingItem);
  const candidates = findCleanupCandidates(clothes, wearLog);

  if (candidates.length === 0) return null;

  const idleCount  = candidates.filter((c) => c.idleDays !== null).length;
  const neverCount = candidates.filter((c) => c.idleDays === null).length;

  // 카테고리별 분포 — 상위 4종만 노출
  const categoryBreakdown = (() => {
    const counts = new Map<string, number>();
    for (const c of candidates) {
      counts.set(c.item.category, (counts.get(c.item.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  })();

  // 처분 경로 분류 — 6개월 이상 미착용 = 기부, 그 외(60일+/미착용) = 중고 판매
  const dispositions = (() => {
    let donate  = 0;
    let resell  = 0;
    for (const c of candidates) {
      if (c.idleDays !== null && c.idleDays >= 180) donate += 1;
      else resell += 1;
    }
    return { donate, resell };
  })();

  function handleRemove(id: string, name: string) {
    if (!confirm(`"${name}"을(를) 옷장에서 정리할까요?`)) return;
    removeItem(id);
    showToast(`"${name}" 정리됐어요.`, undoRemove);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.275 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🧹" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">옷장 정리 제안</span>
          <span className="text-sm px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
            {candidates.length}벌
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {!expanded && (
        <>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            60일 이상 안 입은 옷 {idleCount}벌
            {neverCount > 0 && <span> · 한 번도 안 입은 옷 {neverCount}벌</span>}
            · 탭해서 정리
          </p>
          {categoryBreakdown.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {categoryBreakdown.map(([cat, count]) => {
                const Icon = FASHION_ICON[cat as keyof typeof FASHION_ICON] ?? FASHION_ICON['기타 액세서리'];
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 font-medium tabular-nums"
                  >
                    <Icon size={12} strokeWidth={2} className="text-gray-600" />
                    {cat} {count}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-gray-400 mt-3 mb-2 leading-relaxed">
              네모아가 고른 정리 후보예요. 계속 입을 옷은 &ldquo;유지&rdquo;, 정리할 옷은 &ldquo;정리&rdquo;를 눌러주세요.
            </p>

            {/* 파트너 연결 placeholder — Phase 7 · 정리 경로별 그룹 */}
            <div className="flex flex-col gap-2 mb-3">
              {dispositions.resell > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-500 shrink-0">
                    💰 중고 판매 <span className="text-gray-400 font-normal">· {dispositions.resell}벌</span>
                  </span>
                  <PartnerChip partner={PARTNERS.karrot} />
                </div>
              )}
              {dispositions.donate > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-500 shrink-0">
                    ❤️ 기부 추천 <span className="text-gray-400 font-normal">· {dispositions.donate}벌 (6개월+)</span>
                  </span>
                  <PartnerChip partner={PARTNERS.beautiful} />
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-500 shrink-0">
                  📦 계절 보관 <span className="text-gray-400 font-normal">· 잠깐 빼둘 때</span>
                </span>
                <PartnerChip partner={PARTNERS.storage_svc} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {candidates.slice(0, 12).map(({ item, idleDays, reason }) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (() => {
                      const Icon = FASHION_ICON[item.category] ?? FASHION_ICON['기타 액세서리'];
                      return <Icon size={16} strokeWidth={2} className="text-gray-600" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {reason}
                      {idleDays !== null && idleDays >= 180 && <span className="text-brand-warning ml-1">· 정리 추천</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    className="shrink-0 text-sm font-semibold px-2 py-1 rounded-full bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/15 transition-colors"
                  >
                    정리
                  </button>
                </div>
              ))}
            </div>
            {candidates.length > 12 && (
              <p className="text-sm text-gray-400 text-center mt-2">
                외 {candidates.length - 12}벌 더 있어요
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
