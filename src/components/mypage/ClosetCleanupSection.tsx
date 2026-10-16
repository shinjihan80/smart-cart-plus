'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Banknote, Heart, Package, Link2 } from 'lucide-react';
import { isClothingItem, type CartItem } from '@/types';
import { FASHION_ICON } from '@/lib/iconMap';
import { getFashionCategoryTone } from '@/lib/categoryImages';
import { useWearLog } from '@/lib/wearLog';
import { findCleanupCandidates } from '@/lib/closetCleanup';
import { josa } from '@/lib/korean';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import PartnerChip from '@/components/PartnerChip';
import { useMergedCatalog } from '@/lib/useMergedCatalog';
import { usePersistedState } from '@/lib/usePersistedState';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function ClosetCleanupSection({ items }: { items: CartItem[] }) {
  const { partners: PARTNERS } = useMergedCatalog();
  const { log: wearLog } = useWearLog();
  const { removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'nemoa-mypage-cleanup-open', false,
    (raw) => typeof raw === 'boolean' ? raw : null,
  );
  // 아이템별 처분 옵션 메뉴 열림 상태
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
    if (!confirm(`${josa(`"${name}"`, '을/를')} 옷장에서 정리할까요?`)) return;
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
        {/* 리디자인(옵션 B) — 개수 배지가 amber였는데, 이 섹션은
            경고가 아니라 제안(suggestion)이라 범주색을 침범하고
            있었다(P2-56과 동일 패턴) — 중립으로. */}
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={2} className="text-gray-600" aria-hidden />
          <span className="text-xs text-gray-400 font-medium">옷장 정리 제안</span>
          <span className="text-sm px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
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

            {/* 파트너 연결 — Phase 7 · 정리 경로별 그룹 (각 그룹별 다중 파트너) */}
            <div className="flex flex-col gap-2 mb-3">
              {dispositions.resell > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-500 shrink-0 inline-flex items-center gap-1">
                    <Banknote size={13} strokeWidth={2} aria-hidden /> 중고 판매 <span className="text-gray-400 font-normal">· {dispositions.resell}벌</span>
                  </span>
                  <PartnerChip partner={PARTNERS.karrot} />
                  <PartnerChip partner={PARTNERS.bunjang} />
                  <PartnerChip partner={PARTNERS.kream} />
                </div>
              )}
              {dispositions.donate > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gray-500 shrink-0 inline-flex items-center gap-1">
                    <Heart size={13} strokeWidth={2} aria-hidden /> 기부 추천 <span className="text-gray-400 font-normal">· {dispositions.donate}벌 (6개월+)</span>
                  </span>
                  <PartnerChip partner={PARTNERS.beautiful} />
                  <PartnerChip partner={PARTNERS.goodwill} />
                  <PartnerChip partner={PARTNERS.otcan} />
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-500 shrink-0 inline-flex items-center gap-1">
                  <Package size={13} strokeWidth={2} aria-hidden /> 계절 보관 <span className="text-gray-400 font-normal">· 잠깐 빼둘 때</span>
                </span>
                <PartnerChip partner={PARTNERS.thelaundry} />
                <PartnerChip partner={PARTNERS.darak} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {candidates.slice(0, 12).map(({ item, idleDays, reason }) => {
                const isMenuOpen = activeMenuId === item.id;
                const isLongIdle = idleDays !== null && idleDays >= 180;
                return (
                  <div key={item.id} className="border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 py-1.5">
                      {(() => {
                        const tone = getFashionCategoryTone(item.category);
                        return (
                          <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${tone.bg}`}>
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-base" aria-hidden>{tone.emoji}</span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {reason}
                          {isLongIdle && <span className="text-info ml-1">· 정리 추천</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : item.id)}
                        aria-label={`${item.name} 처분 옵션`}
                        className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                          isMenuOpen
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Link2 size={13} strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id, item.name)}
                        className="shrink-0 text-sm font-semibold px-2 py-1 rounded-full bg-danger/10 text-danger hover:bg-danger/15 transition-colors"
                      >
                        정리
                      </button>
                    </div>
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-2 pl-11 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-gray-400 mr-1 inline-flex items-center gap-0.5"><Banknote size={11} strokeWidth={2} aria-hidden /> 팔기</span>
                              <PartnerChip partner={PARTNERS.karrot} query={item.name} />
                              <PartnerChip partner={PARTNERS.bunjang} query={item.name} />
                              <PartnerChip partner={PARTNERS.kream} query={item.name} />
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-gray-400 mr-1 inline-flex items-center gap-0.5"><Heart size={11} strokeWidth={2} aria-hidden /> 기부</span>
                              <PartnerChip partner={PARTNERS.beautiful} />
                              <PartnerChip partner={PARTNERS.goodwill} />
                              <PartnerChip partner={PARTNERS.otcan} />
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-gray-400 mr-1 inline-flex items-center gap-0.5"><Package size={11} strokeWidth={2} aria-hidden /> 보관</span>
                              <PartnerChip partner={PARTNERS.thelaundry} />
                              <PartnerChip partner={PARTNERS.darak} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
