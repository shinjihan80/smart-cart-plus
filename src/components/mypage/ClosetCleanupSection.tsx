'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isClothingItem, FASHION_EMOJI, type CartItem } from '@/types';
import { useWearLog } from '@/lib/wearLog';
import { findCleanupCandidates } from '@/lib/closetCleanup';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function ClosetCleanupSection({ items }: { items: CartItem[] }) {
  const { log: wearLog } = useWearLog();
  const { removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const clothes = items.filter(isClothingItem);
  const candidates = findCleanupCandidates(clothes, wearLog);

  if (candidates.length === 0) return null;

  const idleCount  = candidates.filter((c) => c.idleDays !== null).length;
  const neverCount = candidates.filter((c) => c.idleDays === null).length;

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
          <span className="text-base">🧹</span>
          <span className="text-xs text-gray-400 font-medium">옷장 정리 제안</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
            {candidates.length}벌
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {!expanded && (
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          60일 이상 안 입은 옷 {idleCount}벌
          {neverCount > 0 && <span> · 한 번도 안 입은 옷 {neverCount}벌</span>}
          · 탭해서 정리
        </p>
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
            <p className="text-[10px] text-gray-400 mt-3 mb-2 leading-relaxed">
              네모아가 고른 정리 후보예요. 계속 입을 옷은 &ldquo;유지&rdquo;, 정리할 옷은 &ldquo;정리&rdquo;를 눌러주세요.
            </p>
            <div className="flex flex-col gap-2">
              {candidates.slice(0, 12).map(({ item, idleDays, reason }) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">{FASHION_EMOJI[item.category] ?? '👕'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {reason}
                      {idleDays !== null && idleDays >= 180 && <span className="text-brand-warning ml-1">· 정리 추천</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/15 transition-colors"
                  >
                    정리
                  </button>
                </div>
              ))}
            </div>
            {candidates.length > 12 && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                외 {candidates.length - 12}벌 더 있어요
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
