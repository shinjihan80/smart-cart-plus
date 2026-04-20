'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { isFoodItem, isClothingItem, FOOD_EMOJI, FASHION_EMOJI, type FoodItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { ChevronRight, Sparkles, Search } from 'lucide-react';

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

// ── Mock 주문 데이터 (달별) ────────────────────────────────────────────────────
interface OrderItem {
  id: string; name: string; store: string; mallBg: string; price: number; date: string;
}

const MONTHLY_DATA: { month: number; label: string; total: number; orders: OrderItem[] }[] = [
  {
    month: 1, label: '1월', total: 187400,
    orders: [
      { id: 'm1-1', name: '유기농 바나나',       store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 5900, date: '01.08' },
      { id: 'm1-2', name: '울 코트',            store: '무신사',   mallBg: 'bg-mall-musinsa', price: 139000, date: '01.15' },
      { id: 'm1-3', name: '세탁세제 대용량',      store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 22500, date: '01.22' },
      { id: 'm1-4', name: '비타민C',            store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 20000, date: '01.28' },
    ],
  },
  {
    month: 2, label: '2월', total: 156200,
    orders: [
      { id: 'm2-1', name: '딸기 1kg',           store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 12900, date: '02.03' },
      { id: 'm2-2', name: '봄 가디건',           store: '무신사',   mallBg: 'bg-mall-musinsa', price: 49900, date: '02.10' },
      { id: 'm2-3', name: '샴푸 리필팩',         store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 8900, date: '02.14' },
      { id: 'm2-4', name: '냉동 만두',           store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 7500, date: '02.20' },
      { id: 'm2-5', name: '런닝화',             store: '네이버',   mallBg: 'bg-mall-naver',   price: 77000, date: '02.25' },
    ],
  },
  {
    month: 3, label: '3월', total: 203800,
    orders: [
      { id: 'm3-1', name: '유기농 두부',         store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 3200, date: '03.05' },
      { id: 'm3-2', name: '리넨 원피스',         store: '무신사',   mallBg: 'bg-mall-musinsa', price: 59000, date: '03.12' },
      { id: 'm3-3', name: '한우 불고기',         store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 15900, date: '03.15' },
      { id: 'm3-4', name: '선크림 SPF50',       store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 18700, date: '03.20' },
      { id: 'm3-5', name: '에어포스 1',          store: '네이버',   mallBg: 'bg-mall-naver',   price: 107000, date: '03.28' },
    ],
  },
  {
    month: 4, label: '4월', total: 384300,
    orders: [
      { id: 'f6', name: '노르웨이 생연어',        store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 18900, date: '04.16' },
      { id: 'c10', name: 'Ray-Ban 웨이페어러',   store: '무신사',   mallBg: 'bg-mall-musinsa',    price: 185000, date: '04.12' },
      { id: 'f1', name: '친환경 샐러드 믹스',     store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 4900, date: '04.14' },
      { id: 'f2', name: '아이용 한우 불고기',     store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 15900, date: '04.10' },
      { id: 'f8', name: '서울우유 1L',           store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 2800, date: '04.11' },
      { id: 'c7', name: '버켄스탁 아리조나',      store: '네이버',   mallBg: 'bg-mall-naver',      price: 89000, date: '04.08' },
      { id: 'f9', name: '오리온 초코파이',        store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 4800, date: '04.07' },
      { id: 'c8', name: '캉골 미니 크로스백',     store: '무신사',   mallBg: 'bg-mall-musinsa',    price: 45000, date: '04.05' },
      { id: 'f7', name: '무항생제 달걀',          store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 8500, date: '04.03' },
      { id: 'c9', name: 'New Era 볼캡',         store: '네이버',   mallBg: 'bg-mall-naver',      price: 9500, date: '04.02' },
    ],
  },
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
function getBriefing(): { emoji: string; headline: string; tip: string } {
  const h = new Date().getHours();
  if (h < 6)  return { emoji: '🌙', headline: '새벽 공기가 상쾌해요',        tip: '따뜻한 차 한 잔 어떠세요?' };
  if (h < 9)  return { emoji: '🌅', headline: '현재 16도, 선선한 아침이에요', tip: '얇은 겉옷을 챙기세요.' };
  if (h < 12) return { emoji: '🌤️', headline: '현재 18도, 바람이 차가워요',  tip: '얇은 가디건을 챙기세요.' };
  if (h < 15) return { emoji: '☀️', headline: '현재 22도, 따뜻한 오후에요',  tip: '자외선 차단에 신경 쓰세요.' };
  if (h < 18) return { emoji: '🌤️', headline: '현재 20도, 구름이 살짝 껴요', tip: '우산은 필요 없을 거예요.' };
  if (h < 21) return { emoji: '🌆', headline: '현재 17도, 해가 지고 있어요', tip: '저녁엔 가디건이 좋아요.' };
  return           { emoji: '🌙', headline: '현재 14도, 쌀쌀한 밤이에요',  tip: '따뜻하게 입으세요.' };
}

function DailyBriefing({ items }: { items: import('@/types').CartItem[] }) {
  const clothes = items.filter(isClothingItem);
  const recommend = clothes.find(
    (c) => c.weatherTags?.includes('봄') || c.weatherTags?.includes('여름'),
  );
  const briefing = getBriefing();

  return (
    <Link href="/closet" className="col-span-2 block">
      <Widget index={0} className="relative overflow-hidden min-h-[130px]">
        <div className="absolute -right-4 -top-2 opacity-30 select-none pointer-events-none">
          <div className="text-[80px] leading-none">{briefing.emoji}</div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-gray-400 font-medium mb-2">오늘의 브리핑</p>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            {briefing.headline}
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {briefing.tip}
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
  const withImages = clothes.filter((c) => c.imageUrl).slice(0, 3);

  return (
    <Link href="/closet" className="block">
      <Widget index={1}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👔</span>
              <span className="text-xs text-gray-400 font-medium">옷장 현황</span>
            </div>
            {/* 미니 이미지 프리뷰 */}
            {withImages.length > 0 && (
              <div className="flex -space-x-2">
                {withImages.map((c) => (
                  <div key={c.id} className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl!} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
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
  const now = new Date();
  const thisMonth = MONTHLY_DATA.find((m) => m.month === now.getMonth() + 1) ?? MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prevMonth = MONTHLY_DATA.find((m) => m.month === now.getMonth()) ?? MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const diff = prevMonth.total > 0
    ? Math.round(((thisMonth.total - prevMonth.total) / prevMonth.total) * 100)
    : 0;

  return (
    <Widget index={2}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💰</span>
          <span className="text-xs text-gray-400 font-medium">이번 달 지출</span>
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            ₩{thisMonth.total.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            지난달 대비{' '}
            <span className={`font-semibold ${diff <= 0 ? 'text-brand-success' : 'text-brand-warning'}`}>
              {diff <= 0 ? '' : '+'}{diff}%
            </span>
          </p>
        </div>
      </div>
    </Widget>
  );
}

// ── [C] 냉장고 카루셀 카드 (스와이프 소진) ───────────────────────────────────
function FridgeCard({
  name, dDay, storageType, emoji, imageUrl, onDiscard,
}: {
  name: string; dDay: number; storageType: string; emoji: string; imageUrl?: string;
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
    if (info.offset.x < -60) {
      navigator.vibrate?.(30);
      onDiscard();
    }
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
        {imageUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
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

  return (
    <div className="col-span-2">
      <Widget index={3} className="!p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧊</span>
            <span className="text-xs text-gray-400 font-medium">스마트 냉장고</span>
            <span className="text-[9px] text-gray-300 tabular-nums">{sorted.length}개</span>
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
              emoji={FOOD_EMOJI[item.foodCategory] ?? '📦'}
              imageUrl={item.imageUrl}
              onDiscard={() => onDiscard(item.id)}
            />
          ))}
        </div>
      </Widget>
    </div>
  );
}

// ── 긴급 알림 배너 ───────────────────────────────────────────────────────────
function UrgentAlert({ items }: { items: import('@/types').CartItem[] }) {
  const urgent = items.filter(isFoodItem)
    .map((f) => ({ name: f.name, dDay: calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) }))
    .filter((f) => f.dDay <= 1);

  if (urgent.length === 0) return null;

  return (
    <Link href="/fridge" className="col-span-2 block">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="bg-brand-warning/10 border border-brand-warning/20 rounded-[24px] px-4 py-3 flex items-center gap-3"
      >
        <span className="text-xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-warning">
            {urgent.length}개 식품 긴급 소비 필요
          </p>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">
            {urgent.map((u) => u.name).join(', ')}
          </p>
        </div>
        <ChevronRight size={14} className="text-brand-warning/50 shrink-0" />
      </motion.div>
    </Link>
  );
}

// ── 한눈 요약 바 ─────────────────────────────────────────────────────────────
function QuickStats({ items }: { items: import('@/types').CartItem[] }) {
  const food    = items.filter(isFoodItem).length;
  const clothes = items.filter(isClothingItem).length;
  const urgent  = items.filter(isFoodItem).filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const stats = [
    { label: '전체',  value: items.length, color: 'text-gray-900' },
    { label: '식품',  value: food,         color: 'text-sky-600' },
    { label: '의류',  value: clothes,      color: 'text-brand-primary' },
    { label: '임박',  value: urgent,       color: urgent > 0 ? 'text-brand-warning' : 'text-gray-900' },
  ];

  return (
    <div className="col-span-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="flex justify-between px-2"
      >
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</span>
            <span className="text-[9px] text-gray-400 font-medium">{s.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── [E] 주간 인사이트 ─────────────────────────────────────────────────────────
function WeeklyInsight({ items }: { items: import('@/types').CartItem[] }) {
  const food    = items.filter(isFoodItem);
  const clothes = items.filter(isClothingItem);
  const urgent  = food.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const insights: string[] = [];
  if (urgent > 0) insights.push(`식품 ${urgent}개가 곧 만료돼요. 빨리 소비해주세요.`);
  if (food.length > clothes.length * 2) insights.push('식품 비율이 높아요. 의류도 관리해보세요.');
  if (clothes.length > 5) insights.push(`옷장에 ${clothes.length}벌이에요. 안 입는 옷 정리를 추천해요.`);
  if (food.length === 0) insights.push('냉장고가 비어있어요. 장을 봐야 할 때예요.');
  if (insights.length === 0) insights.push('이번 주도 잘 관리하고 있어요!');

  return (
    <div className="col-span-2">
      <Widget index={5}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💡</span>
          <span className="text-xs text-gray-400 font-medium">AI 인사이트</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {insights.map((text, i) => (
            <p key={i} className="text-sm text-gray-600 leading-relaxed">
              {text}
            </p>
          ))}
        </div>
      </Widget>
    </div>
  );
}

// ── [F] 최근 등록 아이템 ──────────────────────────────────────────────────────
function RecentlyAdded({ items }: { items: import('@/types').CartItem[] }) {
  const recent = items.slice(-3).reverse();
  if (recent.length === 0) return null;

  return (
    <div className="col-span-2">
      <Widget index={6}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🆕</span>
          <span className="text-xs text-gray-400 font-medium">최근 등록</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {recent.map((item) => {
            const emoji = isFoodItem(item)
              ? (FOOD_EMOJI[(item as FoodItem).foodCategory] ?? '📦')
              : (FASHION_EMOJI[item.category as keyof typeof FASHION_EMOJI] ?? '👕');
            return (
              <Link
                key={item.id}
                href={isFoodItem(item) ? '/fridge' : '/closet'}
                className="shrink-0 w-24 flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-primary/20 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 font-medium truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </Widget>
    </div>
  );
}

// ── [D] 달별 소비 내역 (Full Width) ───────────────────────────────────────────
function MonthlyHistory({ selectedMonth, onChangeMonth }: { selectedMonth: number; onChangeMonth: (m: number) => void }) {
  const data = MONTHLY_DATA.find((m) => m.month === selectedMonth) ?? MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const maxTotal = Math.max(...MONTHLY_DATA.map((m) => m.total));

  return (
    <div className="col-span-2">
      <Widget index={4} className="!p-0 overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <span className="text-xs text-gray-400 font-medium">월별 소비 내역</span>
          </div>
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            ₩{data.total.toLocaleString()}
          </span>
        </div>

        {/* 월 탭 + 미니 바 차트 */}
        <div className="flex gap-1 px-5 pb-4">
          {MONTHLY_DATA.map((m) => {
            const isActive = m.month === selectedMonth;
            const barH = Math.max(8, (m.total / maxTotal) * 48);
            return (
              <button
                key={m.month}
                onClick={() => onChangeMonth(m.month)}
                className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-2xl transition-colors ${
                  isActive ? 'bg-brand-primary/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-full flex justify-center items-end h-12">
                  <div
                    className={`w-5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                    style={{ height: `${barH}px` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 선택 월 내역 리스트 */}
        <div className="px-5 pb-5 flex flex-col gap-2.5">
          {data.orders.map((order) => (
            <div key={order.id} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${order.mallBg} flex items-center justify-center shrink-0`}>
                <span className="text-white text-[9px] font-bold">{order.store.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.name}</p>
                <p className="text-[10px] text-gray-400">{order.store} · {order.date}</p>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                ₩{order.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Widget>
    </div>
  );
}

// ── 홈 대시보드 ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { items, removeItem, undoRemove } = useCart();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');

  const searchResults = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : [];

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
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full tabular-nums">
              {items.length}개 관리 중
            </span>
            <span className="text-[9px] text-gray-300 tabular-nums">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
        </div>
      </header>

      {/* 검색 바 */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="전체 상품 검색"
            className="w-full pl-8 pr-3 py-2 rounded-2xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        {search.trim() && (
          <div className="mt-2 flex flex-col gap-1.5">
            {searchResults.length > 0 ? searchResults.slice(0, 5).map((item) => {
              const emoji = isFoodItem(item) ? (FOOD_EMOJI[(item as FoodItem).foodCategory] ?? '📦') : (FASHION_EMOJI[item.category as keyof typeof FASHION_EMOJI] ?? '👕');
              return (
              <Link
                key={item.id}
                href={isFoodItem(item) ? '/fridge' : '/closet'}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-gray-100 hover:border-brand-primary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{emoji}</span>
                  )}
                </div>
                <span className="text-sm text-gray-800 flex-1 truncate">{item.name}</span>
                <span className="text-[10px] text-gray-400">{isFoodItem(item) ? '냉장고' : '옷장'}</span>
                <ChevronRight size={12} className="text-gray-300" />
              </Link>
              );
            }) : (
              <p className="text-xs text-gray-400 text-center py-2">검색 결과가 없어요</p>
            )}
          </div>
        )}
      </div>

      {/* 벤토 그리드 */}
      {!ready ? (
        <Skeleton />
      ) : (
        <div className="px-4 py-5 grid grid-cols-2 gap-4">
          <UrgentAlert items={items} />
          <QuickStats items={items} />
          <DailyBriefing items={items} />
          <ClosetSummary items={items} />
          <MonthlySpending />
          <FridgeCarousel items={items} onDiscard={(id) => {
            const name = items.find((i) => i.id === id)?.name ?? '';
            removeItem(id);
            showToast(`"${name}" 소진 처리됐어요.`, undoRemove);
          }} />
          <MonthlyHistory selectedMonth={selectedMonth} onChangeMonth={setSelectedMonth} />
          <WeeklyInsight items={items} />
          <RecentlyAdded items={items} />
        </div>
      )}
    </div>
  );
}
