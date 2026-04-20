'use client';

import { motion } from 'framer-motion';
import { FOOD_EMOJI, type CartItem } from '@/types';
import { useShoppingList } from '@/lib/shoppingList';
import { createFoodItemFromIngredient, inferFoodCategory } from '@/lib/ingredientInference';
import PartnerChip from '@/components/PartnerChip';
import { PARTNERS } from '@/lib/partnerLinks';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface ShoppingListSectionProps {
  addItems: (items: CartItem[]) => { added: number; skipped: number };
  showToast: (msg: string) => void;
}

export default function ShoppingListSection({ addItems, showToast }: ShoppingListSectionProps) {
  const shopping = useShoppingList();

  if (shopping.list.length === 0) return null;

  function handleBulkAdd() {
    if (!confirm(`${shopping.list.length}개를 모두 냉장고에 담을까요?`)) return;
    const newFoods = shopping.list.map((it) => createFoodItemFromIngredient(it.name));
    const { added, skipped } = addItems(newFoods);
    shopping.clear();
    showToast(
      skipped > 0
        ? `${added}개 담았어요 · ${skipped}개는 이미 있었어요.`
        : `${added}개 모두 냉장고에 담았어요.`,
    );
  }

  function handleClear() {
    if (confirm('쇼핑 리스트를 모두 비울까요?')) {
      shopping.clear();
      showToast('쇼핑 리스트를 비웠어요.');
    }
  }

  function handleSingleAdd(id: string, name: string) {
    const food = createFoodItemFromIngredient(name);
    const { added, skipped } = addItems([food]);
    shopping.remove(id);
    if (added > 0) showToast(`"${name}" 냉장고에 담았어요.`);
    else if (skipped > 0) showToast(`"${name}" 이미 있어요. 리스트만 제거했어요.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.28 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 font-medium">
          🛒 쇼핑 리스트 <span className="tabular-nums">({shopping.list.length})</span>
        </h3>
        <div className="flex items-center gap-1">
          {shopping.list.length >= 2 && (
            <button
              onClick={handleBulkAdd}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success hover:bg-brand-success/15 transition-colors"
            >
              모두 담기
            </button>
          )}
          <button
            onClick={handleClear}
            className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            전체 비우기
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {shopping.list
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((it) => {
            const category = inferFoodCategory(it.name);
            const emoji    = FOOD_EMOJI[category] ?? '📦';
            return (
              <div key={it.id} className="flex items-center gap-2 py-1.5">
                <span className="text-sm shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{it.name}</p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {category}
                    {it.source && <span> · {it.source}에서 추가</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleSingleAdd(it.id, it.name)}
                  className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-success/10 text-brand-success hover:bg-brand-success/15 transition-colors"
                >
                  담았어요
                </button>
              </div>
            );
          })}
      </div>
      <p className="text-[9px] text-gray-400 mt-2.5 leading-relaxed">
        &ldquo;담았어요&rdquo;를 누르면 네모아가 카테고리·보관 방법을 추론해 냉장고에 자동 추가해요.
      </p>

      {/* 파트너 연결 placeholder — Phase 7 */}
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-[10px] text-gray-400 mb-1.5">🛒 바로 장보기</p>
        <div className="flex gap-1.5 flex-wrap">
          <PartnerChip partner={PARTNERS.coupang} />
          <PartnerChip partner={PARTNERS.kurly} />
          <PartnerChip partner={PARTNERS.naver_shop} />
          <PartnerChip partner={PARTNERS.mart} />
        </div>
      </div>
    </motion.div>
  );
}
