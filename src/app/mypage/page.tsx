'use client';

import { motion } from 'framer-motion';
import { foodItems, clothingItems, mockCartItems } from '@/data/mockData';
import { calcRemainingDays } from '@/components/FoodTags';
import { ChevronRight } from 'lucide-react';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

function StatRow({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold tabular-nums ${accent ? 'text-brand-primary' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

function StorageBar({ label, emoji, count, total }: { label: string; emoji: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-16 shrink-0">{emoji} {label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springTransition, delay: 0.3 }}
          className="h-full bg-brand-primary rounded-full"
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function MyPage() {
  const urgentCount = foodItems.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const coldCount   = foodItems.filter((f) => f.storageType === '냉장').length;
  const frozenCount = foodItems.filter((f) => f.storageType === '냉동').length;
  const roomCount   = foodItems.filter((f) => f.storageType === '실온').length;

  const menuItems = [
    { label: '알림 설정',       emoji: '🔔', desc: '소비 기한 알림, 코디 추천 알림' },
    { label: '패밀리 관리',     emoji: '👨‍👩‍👧', desc: '가족 구성원 추가 및 공유' },
    { label: '데이터 관리',     emoji: '💾', desc: '내보내기, 초기화' },
    { label: '고객센터',        emoji: '💬', desc: '문의 및 피드백' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">마이페이지</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">통계 및 설정</p>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* 프로필 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={`${CARD} flex items-center gap-4`}
          style={CARD_SHADOW}
        >
          <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">Smart Cart 사용자</p>
            <p className="text-xs text-gray-400 mt-0.5">Pro 플랜 · AI 매니저 활성화</p>
          </div>
        </motion.div>

        {/* 종합 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-2">종합 통계</h3>
          <div className="divide-y divide-gray-50">
            <StatRow emoji="🛍️" label="전체 상품"     value={`${mockCartItems.length}개`} />
            <StatRow emoji="🥦" label="식품"          value={`${foodItems.length}개`} />
            <StatRow emoji="👗" label="의류·액세서리"  value={`${clothingItems.length}개`} />
            <StatRow emoji="⚠️" label="소비 임박"     value={`${urgentCount}개`} accent={urgentCount > 0} />
          </div>
        </motion.div>

        {/* 보관 현황 */}
        {foodItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <h3 className="text-xs text-gray-400 font-medium mb-3">보관 현황</h3>
            <div className="flex flex-col gap-2.5">
              <StorageBar emoji="❄️" label="냉장" count={coldCount}   total={foodItems.length} />
              <StorageBar emoji="🧊" label="냉동" count={frozenCount} total={foodItems.length} />
              <StorageBar emoji="📦" label="실온" count={roomCount}   total={foodItems.length} />
            </div>
          </motion.div>
        )}

        {/* 설정 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-2">설정</h3>
          <div className="divide-y divide-gray-50">
            {menuItems.map((m) => (
              <button key={m.label} className="flex items-center gap-3 w-full py-3 text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl transition-colors">
                <span className="text-base">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* 앱 정보 */}
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
              <span className="text-gray-600 font-medium">Smart Cart Plus v0.5.6</span>
            </div>
            <div className="flex justify-between">
              <span>AI 매니저</span>
              <span className="text-gray-600 font-medium">Claude Sonnet 4.6</span>
            </div>
            <div className="flex justify-between">
              <span>Vision 파서</span>
              <span className="text-gray-600 font-medium">통합 Multimodal</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
