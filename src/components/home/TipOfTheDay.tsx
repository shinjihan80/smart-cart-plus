'use client';

import { motion } from 'framer-motion';

const TIPS = [
  { emoji: '📸', text: '식품 라벨이나 의류 태그를 사진으로 찍으면 네모아가 자동 분석해요.' },
  { emoji: '⬅️', text: '카드를 왼쪽으로 밀면 소진/삭제 처리, 되돌리기도 가능해요.' },
  { emoji: '⚡', text: '빠른 추가로 자주 사는 상품을 원탭으로 등록할 수 있어요.' },
  { emoji: '📊', text: '마이페이지에서 JSON/CSV로 데이터를 내보낼 수 있어요.' },
  { emoji: '🔍', text: '홈 검색바에서 모든 상품을 한 번에 찾을 수 있어요.' },
  { emoji: '👗', text: '옷 사진을 등록하면 네모아가 코디 조합을 미리 보여드려요.' },
  { emoji: '🧊', text: '냉장고 카드의 프로그레스 바로 신선도를 한눈에 파악하세요.' },
];

export default function TipOfTheDay() {
  const tip = TIPS[new Date().getDate() % TIPS.length];
  return (
    <div className="col-span-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/10"
      >
        <span className="text-base shrink-0 mt-0.5">{tip.emoji}</span>
        <p className="text-xs text-gray-600 leading-relaxed">{tip.text}</p>
      </motion.div>
    </div>
  );
}
