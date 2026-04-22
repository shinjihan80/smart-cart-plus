'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { springTransition, CARD, CARD_SHADOW } from './shared';

export default function AppInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.4 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <h3 className="text-xs text-gray-400 font-medium mb-2">앱 정보</h3>
      <div className="flex flex-col gap-1.5 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>버전</span>
          <span className="text-gray-600 font-medium">NEMOA v1.5</span>
        </div>
        <div className="flex justify-between">
          <span>AI 비서</span>
          <span className="text-gray-600 font-medium">Claude Sonnet 4.6</span>
        </div>
        <div className="flex justify-between">
          <span>Vision 파서</span>
          <span className="text-gray-600 font-medium">통합 Multimodal</span>
        </div>
        <div className="flex justify-between">
          <span>데이터 저장</span>
          <span className="text-gray-600 font-medium">로컬 (localStorage)</span>
        </div>
        <div className="flex justify-between">
          <span>식품 카테고리</span>
          <span className="text-gray-600 font-medium tabular-nums">11종</span>
        </div>
        <div className="flex justify-between">
          <span>패션 카테고리</span>
          <span className="text-gray-600 font-medium tabular-nums">13종</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
        <Link
          href="/legal"
          className="text-xs text-gray-500 hover:text-brand-primary hover:underline"
        >
          이용약관 · 개인정보 처리방침 →
        </Link>
        <span className="text-xs text-gray-300">© NEMOA</span>
      </div>
    </motion.div>
  );
}
