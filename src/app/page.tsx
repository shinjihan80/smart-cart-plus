'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { isFoodItem, isClothingItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useCart } from '@/context/CartContext';
import { ChevronRight, Sparkles } from 'lucide-react';

// ── 시간대 인사말 ────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '새벽이에요, 푹 쉬세요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오후도 힘내세요';
  return '오늘 하루 수고했어요';
}

// ── 디자인 토큰 ──────────────────────────────────────────────────────────────
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };
const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

// ── Mock 주문 데이터 ──────────────────────────────────────────────────────────
const MOCK_ORDERS: { id: string; store: string; mall: string; mallBg: string; price: number }[] = [
  { id: 'f1', store: '마켓컬리', mall: 'kurly',      mallBg: 'bg-mall-kurly',      price: 4900 },
  { id: 'c1', store: '무신사',   mall: 'musinsa',    mallBg: 'bg-mall-musinsa',    price: 59000 },
  { id: 'f2', store: '쿠팡',    mall: 'coupang',    mallBg: 'bg-mall-coupang',    price: 15900 },
  { id: 'f3', store: '네이버',   mall: 'naver',      mallBg: 'bg-mall-naver',      price: 3200 },
  { id: 'f4', store: '쿠팡',    mall: 'coupang',    mallBg: 'bg-mall-coupang',    price: 6500 },
  { id: 'f5', store: '마켓컬리', mall: 'kurly',      mallBg: 'bg-mall-kurly',      price: 3800 },
  { id: 'c3', store: '올리브영', mall: 'oliveyoung', mallBg: 'bg-mall-oliveyoung', price: 49900 },
  { id: 'c4', store: '무신사',   mall: 'musinsa',    mallBg: 'bg-mall-musinsa',    price: 129000 },
];

// ── 스켈레톤 ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="px-4 py-5 grid grid-cols-2 gap-4">
      <div className="col-span-2 h-[130px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[32px] bg-gray-100 animate-pulse" />
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
function DailyBriefing({ items }: { items: import('@/types').CartItem[] }) {
  const clothes = items.filter(isClothingItem);
  const recommend = clothes.find(
    (c) => c.weatherTags?.includes('봄') || c.weatherTags?.includes('여름'),
  );

  return (
    <Link href="/closet" className="col-span-2 block">
      <Widget index={0} className="relative overflow-hidden min-h-[130px]">
        <div className="absolute -right-4 -top-2 opacity-30 select-none pointer-events-none">
          <div className="text-[80px] leading-none">🌤️</div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-gray-400 font-medium mb-2">오늘의 브리핑</p>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            현재 18도, 바람이 차가워요 🌬️
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            얇은 가디건을 챙기세요.
            {recommend && (
              <>
                {' '}추천: <span className="font-semibold text-brand-primary">{recommend.name}</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight size={16} className="absolute right-5 top-5 text-gray-300" />
      </Widget>
    </Link>
  );
}

// ── [B-1] 옷장 현황 (1x1) ────────────────────────────────────────────────────
function ClosetSummary({ items }: { items: import('@/types').CartItem[] }) {
  const clothes = items.filter(isClothingItem);
  const thinCount  = clothes.filter((c) => c.thickness === '얇음').length;
  const thickCount = clothes.filter((c) => c.thickness === '두꺼움').length;

  return (
    <Link href="/closet" className="block">
      <Widget index={1}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">👔</span>
            <span className="text-xs text-gray-400 font-medium">옷장 현황</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
              {clothes.length}<span className="text-base font-bold text-gray-400 ml-0.5">벌</span>
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-500 font-medium">
                얇은 옷 {thinCount}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 font-medium">
                두꺼운 옷 {thickCount}
              </span>
            </div>
          </div>
        </div>
      </Widget>
    </Link>
  );
}

// ── [B-2] 이번 달 지출 (1x1) ─────────────────────────────────────────────────
function MonthlySpending() {
  const total = MOCK_ORDERS.reduce((sum, o) => sum + o.price, 0);

  return (
    <Link href="/mypage" className="block">
      <Widget index={2}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💰</span>
            <span className="text-xs text-gray-400 font-medium">이번 달 지출</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
              ₩{total.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              지난달 대비 <span className="text-brand-success font-semibold">-12%</span>
            </p>
          </div>
        </div>
      </Widget>
    </Link>
  );
}

// ── [C] 냉장고 카루셀 카드 (스와이프 소진) ───────────────────────────────────
function FridgeCard({
  name, dDay, storageType, emoji, onDiscard,
}: {
  name: string; dDay: number; storageType: string; emoji: string;
  onDiscard: () => void;
}) {
  const x = useMotionValue(0);
  const bgColor = useTransform(
    x, [-100, -30, 0],
    ['rgb(255,241,242)', 'rgb(255,254,253)', 'rgb(255,255,255)'],
  );
  const discardOpacity = useTransform(x, [-100, -30], [1, 0]);

  const isUrgent  = dDay <= 2;
  const isWarning = dDay <= 5;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) onDiscard();
  }

  return (
    <div className="relative shrink-0 w-[140px] h-[140px] rounded-3xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-end px-3 pointer-events-none">
        <motion.div style={{ opacity: discardOpacity }} className="flex flex-col items-center gap-0.5">
          <span className="text-lg">🗑️</span>
          <span className="text-[8px] font-semibold text-brand-warning">소진</span>
        </motion.div>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.15}
        style={{ x, backgroundColor: bgColor }}
        onDragEnd={handleDragEnd}
        className="relative z-10 w-full h-full rounded-3xl border border-gray-100 p-4 flex flex-col justify-between cursor-grab"
      >
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className={`text-3xl font-extrabold tracking-tight tabular-nums ${
            isUrgent ? 'text-brand-warning' : isWarning ? 'text-amber-500' : 'text-gray-900'
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

function FridgeCarousel({ items, onDiscard }: { items: import('@/types').CartItem[]; onDiscard: (id: string) => void }) {
  const sorted = items.filter(isFoodItem)
    .map((f) => ({ ...f, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .sort((a, b) => a.dDay - b.dDay);

  const EMOJI: Record<string, string> = { 냉장: '🥦', 냉동: '🥩', 실온: '🍞' };

  return (
    <div className="col-span-2">
      <Widget index={3} className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧊</span>
            <span className="text-xs text-gray-400 font-medium">스마트 냉장고</span>
          </div>
          <Link href="/fridge" className="text-xs text-brand-primary font-medium flex items-center gap-0.5">
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
              onDiscard={() => onDiscard(item.id)}
            />
          ))}
        </div>
      </Widget>
    </div>
  );
}

// ── [D] 최근 쇼핑 내역 ────────────────────────────────────────────────────────
function RecentOrders({ items }: { items: import('@/types').CartItem[] }) {
  const total = MOCK_ORDERS.reduce((sum, o) => sum + o.price, 0);
  const orders = items.map((item) => {
    const mock = MOCK_ORDERS.find((o) => o.id === item.id);
    return {
      ...item,
      store:  mock?.store ?? '기타',
      mallBg: mock?.mallBg ?? 'bg-gray-400',
      price:  mock?.price ?? 0,
    };
  });

  return (
    <div className="col-span-2">
      <Widget index={4}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">최근 쇼핑 내역</span>
          <span className="text-xs text-gray-400">
            합계 <span className="font-bold text-gray-700 tabular-nums">₩{total.toLocaleString()}</span>
          </span>
        </div>
        <div className="h-px bg-gray-50 mb-3" />
        <div className="flex flex-col gap-3">
          {orders.slice(0, 4).map((order) => (
            <div key={order.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${order.mallBg} flex items-center justify-center shrink-0`}>
                <span className="text-white text-[10px] font-bold">
                  {order.store.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.name}</p>
                <p className="text-[10px] text-gray-400">{order.store} · {order.category}</p>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                ₩{order.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/mypage"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-brand-primary font-medium py-2 rounded-2xl hover:bg-brand-primary/5 transition-colors"
        >
          전체보기 <ChevronRight size={14} />
        </Link>
      </Widget>
    </div>
  );
}

// ── 홈 대시보드 ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { items, removeItem } = useCart();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Smart Cart Plus</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <Sparkles size={10} /> {getGreeting()}
            </p>
          </div>
        </div>
      </header>

      {/* 벤토 그리드 */}
      {!ready ? (
        <Skeleton />
      ) : (
        <div className="px-4 py-5 grid grid-cols-2 gap-4">
          <DailyBriefing items={items} />
          <ClosetSummary items={items} />
          <MonthlySpending />
          <FridgeCarousel items={items} onDiscard={removeItem} />
          <RecentOrders items={items} />
        </div>
      )}
    </div>
  );
}
