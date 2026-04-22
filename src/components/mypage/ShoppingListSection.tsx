'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { CartItem } from '@/types';
import { useShoppingList } from '@/lib/shoppingList';
import { createFoodItemFromIngredient, inferFoodCategory, getFoodEmoji } from '@/lib/ingredientInference';
import PartnerChip from '@/components/PartnerChip';
import { PARTNERS } from '@/lib/partnerLinks';
import { useSearchShortcut } from '@/lib/useSearchShortcut';
import { springTransition, CARD, CARD_SHADOW } from './shared';

interface ShoppingListSectionProps {
  addItems: (items: CartItem[]) => { added: number; skipped: number };
  showToast: (msg: string) => void;
}

export default function ShoppingListSection({ addItems, showToast }: ShoppingListSectionProps) {
  const shopping = useShoppingList();
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef, () => setQuery(''));

  function handleImport() {
    const lines = importText.split('\n')
      .map((l) => l.replace(/^[\d.\s-·]*/, '').trim())  // "1. 우유", "- 계란" 같은 prefix 제거
      .filter((l) => l.length > 0 && l.length < 50);
    if (lines.length === 0) {
      showToast('가져올 항목이 없어요.');
      return;
    }
    let added = 0;
    for (const name of lines) {
      if (!shopping.has(name)) {
        shopping.add(name, '가져오기');
        added += 1;
      }
    }
    showToast(added > 0 ? `${added}개 가져왔어요.` : '이미 모두 담겨있어요.');
    setImportText('');
    setImportOpen(false);
  }

  // list 비었고 import 패널도 안 열려있으면 아예 숨김 (기존 동작 유지)
  if (shopping.list.length === 0 && !importOpen) return null;

  const filteredList = query.trim()
    ? shopping.list.filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
    : shopping.list;

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
      <div className="flex items-center justify-between mb-2">
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
            onClick={() => setImportOpen(!importOpen)}
            className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
            title="텍스트에서 여러 줄 가져오기"
          >
            📥 가져오기
          </button>
          <button
            onClick={async () => {
              const text = shopping.list.map((it, i) => `${i + 1}. ${it.name}`).join('\n');
              try {
                await navigator.clipboard.writeText(text);
                showToast('쇼핑 리스트를 복사했어요.');
              } catch {
                showToast('복사에 실패했어요.');
              }
            }}
            className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
            title="클립보드에 복사"
          >
            📋 복사
          </button>
          <button
            onClick={handleClear}
            className="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            전체 비우기
          </button>
        </div>
      </div>
      {importOpen && (
        <div className="mb-3 rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-2.5">
          <p className="text-[10px] text-gray-500 mb-1.5">한 줄에 하나씩, 또는 쉼표로 구분해 붙여넣어요</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"우유\n계란 10구\n- 딸기\n1. 김치"}
            rows={4}
            className="w-full text-xs text-gray-800 bg-white border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <div className="flex gap-1 mt-1.5 justify-end">
            <button
              onClick={() => { setImportOpen(false); setImportText(''); }}
              className="text-[10px] text-gray-500 font-medium px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-primary text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              가져오기
            </button>
          </div>
        </div>
      )}
      {shopping.list.length >= 5 && (
        <div className="relative mb-3">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="리스트에서 검색"
            aria-label="쇼핑 리스트 검색 (⌘K)"
            className="w-full pl-7 pr-10 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center text-[8px] text-gray-400 bg-white border border-gray-200 rounded px-1 py-0 font-mono pointer-events-none">⌘K</kbd>
        </div>
      )}
      {(() => {
        // source별 그룹화 — 우선순위 순 + 직접 추가(source 없음)는 마지막
        const SOURCE_ORDER: { key: string; label: string; emoji: string }[] = [
          { key: '임박 재구매', label: '임박 재구매',   emoji: '⚠️' },
          { key: '구매 주기',   label: '주기 기반',     emoji: '🔁' },
          { key: '소진 이력',   label: '소진 재구매',   emoji: '🔄' },
          { key: '제철 놓친 것', label: '놓친 제철',     emoji: '🫥' },
          { key: '제철 추천',   label: '제철 추천',     emoji: '🌸' },
          { key: '제철 재료',   label: '제철 재료',     emoji: '🌱' },
          { key: '',            label: '직접 추가',     emoji: '✏️' },
        ];
        const byKey = new Map<string, typeof shopping.list>();
        for (const it of filteredList) {
          const key = SOURCE_ORDER.find((s) => s.key === (it.source ?? ''))?.key ?? '';
          const bucket = byKey.get(key) ?? [];
          bucket.push(it);
          byKey.set(key, bucket);
        }
        const groups = SOURCE_ORDER
          .map((meta) => ({
            ...meta,
            items: (byKey.get(meta.key) ?? []).sort((a, b) => b.createdAt - a.createdAt),
          }))
          .filter((g) => g.items.length > 0);

        return (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.key || 'direct'}>
                {groups.length > 1 && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{g.emoji}</span>
                    <span className="text-[10px] font-semibold text-gray-500">{g.label}</span>
                    <span className="text-[9px] text-gray-300 tabular-nums">· {g.items.length}</span>
                    {g.items.length >= 2 && (
                      <button
                        onClick={() => {
                          if (!confirm(`${g.label} ${g.items.length}개를 냉장고에 담을까요?`)) return;
                          const foods = g.items.map((it) => createFoodItemFromIngredient(it.name));
                          const { added, skipped } = addItems(foods);
                          for (const it of g.items) shopping.remove(it.id);
                          showToast(
                            skipped > 0
                              ? `${added}개 담았어요 · ${skipped}개는 이미 있었어요.`
                              : `${added}개 담았어요.`,
                          );
                        }}
                        className="ml-auto text-[9px] font-semibold text-brand-success hover:underline"
                      >
                        그룹 담기 →
                      </button>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {g.items.map((it) => {
                    const category = inferFoodCategory(it.name);
                    const emoji    = getFoodEmoji(it.name, category);
                    return (
                      <div key={it.id} className="flex items-center gap-2 py-1.5">
                        <span className="text-sm shrink-0">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{it.name}</p>
                          <p className="text-[9px] text-gray-400 truncate">
                            {category}
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
              </div>
            ))}
          </div>
        );
      })()}
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
