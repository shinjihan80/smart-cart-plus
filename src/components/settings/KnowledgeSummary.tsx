'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RECIPES } from '@/lib/recipes';
import { SEASONAL_PRODUCE } from '@/lib/seasonalProduce';
import { PARTNERS } from '@/lib/partnerLinks';
import { useSavedOutfits } from '@/lib/savedOutfits';
import { FOOD_EMOJI, FASHION_EMOJI } from '@/types';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

export default function KnowledgeSummary() {
  const [expanded, setExpanded] = useState(false);
  const { outfits } = useSavedOutfits();

  const foodCats    = Object.keys(FOOD_EMOJI).length;
  const fashionCats = Object.keys(FASHION_EMOJI).length;
  const recipes     = RECIPES.length;
  const produce     = SEASONAL_PRODUCE.length;
  const partners    = Object.keys(PARTNERS).length;

  const stats = [
    { emoji: '👨‍🍳', label: '레시피',        value: recipes,     suffix: '개' },
    { emoji: '🌸',    label: '제철 재료',     value: produce,     suffix: '종' },
    { emoji: '🥦',    label: '식품 카테고리', value: foodCats,    suffix: '종' },
    { emoji: '👕',    label: '패션 카테고리', value: fashionCats, suffix: '종' },
    { emoji: '💾',    label: '저장 코디',     value: outfits.length, suffix: '개' },
    { emoji: '🤝',    label: '파트너',        value: partners,    suffix: '개' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.22 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🧠</span>
          <span className="text-xs text-gray-400 font-medium">네모아가 알고 있는 것</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="grid grid-cols-5 gap-2 mt-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">{s.emoji}</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {s.value}
              <span className="text-[10px] text-gray-400 ml-0.5 font-medium">{s.suffix}</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Link
              href="/seasonal"
              className="mt-3 flex items-center justify-between px-3 py-2 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 hover:bg-brand-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🌸</span>
                <span className="text-xs font-semibold text-brand-primary">
                  제철 달력 열기 — 4계절 전체 보기
                </span>
              </div>
              <ChevronRight size={14} className="text-brand-primary/60" />
            </Link>
            <div className="pt-3 mt-3 border-t border-gray-50 flex flex-col gap-2 text-[11px] text-gray-500 leading-relaxed">
              <p>
                <strong className="text-gray-700">레시피 매칭</strong> — 보유 식재료 ∩ 레시피
                키워드로 자동 추천. 소비 임박·제철·단골 시그널 가중치 적용.
              </p>
              <p>
                <strong className="text-gray-700">제철 레지스트리</strong> — 4계절 × {produce}종
                식재료, 피크 계절 구분. 장보기 추천과 카드 뱃지에 사용.
              </p>
              <p>
                <strong className="text-gray-700">파트너 레지스트리</strong> — 쇼핑몰·중고·기부·보관
                {partners}개. Phase 7에 실제 연결 예정 (현재 모두 준비 중).
              </p>
              <p>
                <strong className="text-gray-700">로그</strong> — 조리 기록(cookLog)·착용
                기록(wearLog)으로 개인화 학습. 기기 안에만 저장(localStorage).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
