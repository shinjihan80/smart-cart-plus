'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { foodItems, clothingItems, mockCartItems } from '@/data/mockData';
import { isFoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { ChevronRight } from 'lucide-react';

// ── 디자인 토큰 ──────────────────────────────────────────────────────────────
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

// ── Mock 주문 데이터 ──────────────────────────────────────────────────────────
const MOCK_ORDERS: { id: string; store: string; storeColor: string; price: number }[] = [
  { id: 'f1', store: '쿠팡',    storeColor: 'bg-purple-500', price: 4900 },
  { id: 'c1', store: '무신사',   storeColor: 'bg-orange-500', price: 59000 },
  { id: 'f2', store: '쿠팡',    storeColor: 'bg-purple-500', price: 15900 },
  { id: 'f3', store: '마켓컬리', storeColor: 'bg-violet-500', price: 3200 },
  { id: 'c3', store: '유니클로', storeColor: 'bg-red-500',    price: 49900 },
];

// ── 스켈레톤 ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="px-4 py-5 grid grid-cols-2 gap-4">
      <div className="col-span-2 h-[130px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="col-span-2 h-[160px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="col-span-2 h-[200px] rounded-[32px] bg-gray-100 animate-pulse" />
    </div>
  );
}

// ── 위젯 공통 래퍼 (Spring) ──────────────────────────────────────────────────
function Widget({
  children,
  className = '',
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${CARD} ${className}`}
      style={CARD_SHADOW}
    >
      {children}
    </motion.div>
  );
}

// ── [A] 데일리 브리핑 ─────────────────────────────────────────────────────────
function DailyBriefing() {
  const recommend = clothingItems.find(
    (c) => c.weatherTags?.includes('봄') || c.weatherTags?.includes('여름'),
  );

  return (
    <Link href="/closet" className="col-span-2 block">
      <Widget index={0} className="relative overflow-hidden min-h-[130px]">
        {/* CSS 날씨 일러스트 */}
        <div className="absolute -right-4 -top-2 opacity-30 select-none pointer-events-none">
          <div className="text-[80px] leading-none">🌤️</div>
        </div>
        {/* 콘텐츠 */}
        <div className="relative z-10">
          <p className="text-xs text-gray-400 font-medium mb-2">오늘의 브리핑</p>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            현재 18도, 바람이 차가워요 🌬️
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            얇은 가디건을 챙기세요.
            {recommend && (
              <>
                {' '}추천: <span className="font-semibold text-indigo-600">{recommend.name}</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight size={16} className="absolute right-5 top-5 text-gray-300" />
      </Widget>
    </Link>
  );
}

// ── [B] 냉장고 카루셀 카드 (개별 스와이프) ────────────────────────────────────
function FridgeCard({
  name,
  dDay,
  storageType,
  emoji,
  onDiscard,
  onReorder,
}: {
  name: string;
  dDay: number;
  storageType: string;
  emoji: string;
  onDiscard: () => void;
  onReorder: () => void;
}) {
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x,
    [-100, -30, 0, 30, 100],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)', 'rgb(253,253,255)', 'rgb(238,242,255)'],
  );
  const discardOpacity = useTransform(x, [-100, -30], [1, 0]);
  const reorderOpacity = useTransform(x, [30, 100], [0, 1]);

  const isUrgent  = dDay <= 2;
  const isWarning = dDay <= 5;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) onDiscard();
    else if (info.offset.x > 60) onReorder();
  }

  return (
    <div className="relative shrink-0 w-[140px] h-[140px] rounded-3xl overflow-hidden">
      {/* 뒤 레이어 */}
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
        <motion.span style={{ opacity: reorderOpacity }} className="text-lg">🔄</motion.span>
        <motion.span style={{ opacity: discardOpacity }} className="text-lg">🗑️</motion.span>
      </div>
      {/* 앞 레이어 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.15}
        style={{ x, backgroundColor: bgColor }}
        onDragEnd={handleDragEnd}
        className="relative z-10 w-full h-full rounded-3xl border border-gray-100 p-4 flex flex-col justify-between cursor-grab"
      >
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className={`text-3xl font-extrabold tracking-tight ${
            isUrgent ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-gray-900'
          }`}>
            {dDay <= 0 ? '만료' : `D-${dDay}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{name}</p>
          <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 mt-1">
            {storageType === '냉장' ? '❄️ 냉장' : storageType === '냉동' ? '🧊 냉동' : '📦 실온'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function FridgeCarousel({ onToast }: { onToast: (msg: string) => void }) {
  const sorted = foodItems
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .sort((a, b) => a.dDay - b.dDay);

  const EMOJI: Record<string, string> = { 냉장: '🥦', 냉동: '🥩', 실온: '🍞' };

  return (
    <div className="col-span-2">
      <Widget index={1} className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧊</span>
            <span className="text-xs text-gray-400 font-medium">스마트 냉장고</span>
          </div>
          <Link href="/fridge" className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-5 pt-1 scrollbar-hide">
          {sorted.map((item) => (
            <FridgeCard
              key={item.id}
              name={item.name}
              dDay={item.dDay}
              storageType={item.storageType}
              emoji={EMOJI[item.storageType] ?? '📦'}
              onDiscard={() => onToast(`"${item.name}" 소진 처리됐어요.`)}
              onReorder={() => onToast(`"${item.name}" 재구매 목록에 추가했어요!`)}
            />
          ))}
        </div>
      </Widget>
    </div>
  );
}

// ── [C] 최근 쇼핑 내역 ────────────────────────────────────────────────────────
function RecentOrders() {
  const orders = mockCartItems.map((item) => {
    const mock = MOCK_ORDERS.find((o) => o.id === item.id);
    return {
      ...item,
      store:      mock?.store ?? '기타',
      storeColor: mock?.storeColor ?? 'bg-gray-400',
      price:      mock?.price ?? 0,
    };
  });

  return (
    <div className="col-span-2">
      <Widget index={2}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400 font-medium">최근 쇼핑 내역</span>
        </div>
        <div className="flex flex-col gap-3">
          {orders.slice(0, 4).map((order) => (
            <div key={order.id} className="flex items-center gap-3">
              {/* 구매처 로고 */}
              <div className={`w-8 h-8 rounded-full ${order.storeColor} flex items-center justify-center shrink-0`}>
                <span className="text-white text-[10px] font-bold">
                  {order.store.charAt(0)}
                </span>
              </div>
              {/* 상품 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.name}</p>
                <p className="text-[10px] text-gray-400">{order.store} · {order.category}</p>
              </div>
              {/* 금액 */}
              <span className="text-sm font-bold text-gray-900 shrink-0">
                ₩{order.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/mypage"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-indigo-500 font-medium py-2 rounded-2xl hover:bg-indigo-50 transition-colors"
        >
          전체보기 <ChevronRight size={14} />
        </Link>
      </Widget>
    </div>
  );
}

// ── 홈 대시보드 ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">라이프스타일 AI 매니저</p>
        </div>
      </header>

      {/* 벤토 그리드 */}
      {!ready ? (
        <Skeleton />
      ) : (
        <div className="px-4 py-5 grid grid-cols-2 gap-4">
          <DailyBriefing />
          <FridgeCarousel onToast={showToast} />
          <RecentOrders />
        </div>
      )}

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
