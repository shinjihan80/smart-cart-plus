'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { isFoodItem, isClothingItem, FOOD_GROUP, FASHION_GROUP, type FoodGroup, type FashionGroup } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { calcRemainingDays } from '@/components/FoodTags';
import { ChevronRight } from 'lucide-react';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };

const SPENDING_DATA = [
  { month: '1월', amount: 187400 },
  { month: '2월', amount: 156200 },
  { month: '3월', amount: 203800 },
  { month: '4월', amount: 272200 },
];

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
  const { items, archived, discardCount, discardHistory, resetData, archiveExpired } = useCart();
  const { showToast } = useToast();
  const foodItemsList     = items.filter(isFoodItem);
  const clothingItemsList = items.filter(isClothingItem);

  const urgentCount = foodItemsList.filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length;

  const coldCount   = foodItemsList.filter((f) => f.storageType === '냉장').length;
  const frozenCount = foodItemsList.filter((f) => f.storageType === '냉동').length;
  const roomCount   = foodItemsList.filter((f) => f.storageType === '실온').length;

  // 알림 설정
  const [notiExpiry, setNotiExpiry] = useState(true);
  const [notiCodi, setNotiCodi]     = useState(true);
  const [notiDeal, setNotiDeal]     = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart-cart-noti');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotiExpiry(parsed.expiry ?? true);
        setNotiCodi(parsed.codi ?? true);
        setNotiDeal(parsed.deal ?? false);
      }
    } catch { /* ignore */ }
  }, []);

  function toggleNoti(key: 'expiry' | 'codi' | 'deal') {
    const next = { expiry: notiExpiry, codi: notiCodi, deal: notiDeal };
    next[key] = !next[key];
    setNotiExpiry(next.expiry);
    setNotiCodi(next.codi);
    setNotiDeal(next.deal);
    localStorage.setItem('smart-cart-noti', JSON.stringify(next));
    showToast(next[key] ? '알림이 켜졌어요.' : '알림이 꺼졌어요.');
  }

  function handleReset() {
    if (confirm('모든 데이터를 초기화하시겠어요? 기본 샘플 데이터로 복원됩니다.')) {
      resetData();
      showToast('데이터가 초기화됐어요.');
    }
  }

  function handleArchive() {
    const count = archiveExpired();
    if (count > 0) showToast(`${count}개 만료 식품이 아카이브됐어요.`);
    else showToast('아카이브할 만료 식품이 없어요.');
  }

  function handleExportJSON() {
    exportAsJSON(items);
    showToast('JSON 파일로 내보냈어요.');
  }

  function handleExportCSV() {
    exportAsCSV(items);
    showToast('CSV 파일로 내보냈어요.');
  }

  const menuItems = [
    { label: '만료 식품 정리',   emoji: '📦', desc: '보관 기한 +7일 초과 항목 아카이브', action: handleArchive },
    { label: 'JSON 내보내기',   emoji: '📄', desc: '전체 데이터를 JSON 파일로 다운로드', action: handleExportJSON },
    { label: 'CSV 내보내기',    emoji: '📊', desc: '전체 데이터를 CSV 파일로 다운로드', action: handleExportCSV },
    { label: '데이터 초기화',   emoji: '🔄', desc: '샘플 데이터로 복원', action: handleReset },
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
            <p className="text-base font-bold text-gray-900">네모아 사용자</p>
            <p className="text-xs text-gray-400 mt-0.5">Pro 플랜 · AI 비서 활성화</p>
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
            <StatRow emoji="🛍️" label="전체 상품"     value={`${items.length}개`} />
            <StatRow emoji="🥦" label="식품"          value={`${foodItemsList.length}개`} />
            <StatRow emoji="👕" label="패션 전체"  value={`${clothingItemsList.length}개`} />
            <StatRow emoji="⚠️" label="소비 임박"     value={`${urgentCount}개`} accent={urgentCount > 0} />
            <StatRow emoji="🗑️" label="소진 처리 (누적)" value={`${discardCount}건`} />
          </div>
        </motion.div>

        {/* 보관 현황 */}
        {foodItemsList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <h3 className="text-xs text-gray-400 font-medium mb-3">보관 현황</h3>
            <div className="flex flex-col gap-2.5">
              <StorageBar emoji="❄️" label="냉장" count={coldCount}   total={foodItemsList.length} />
              <StorageBar emoji="🧊" label="냉동" count={frozenCount} total={foodItemsList.length} />
              <StorageBar emoji="📦" label="실온" count={roomCount}   total={foodItemsList.length} />
            </div>
          </motion.div>
        )}

        {/* 카테고리 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.22 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-3">카테고리 분포</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* 식품 그룹 */}
            <div>
              <p className="text-[9px] text-gray-400 mb-1.5">🥬 식품</p>
              {(['신선식품', '가공식품', '음료·간식'] as FoodGroup[]).map((g) => {
                const count = foodItemsList.filter((f) => (FOOD_GROUP[f.foodCategory] ?? '기타') === g).length;
                if (count === 0) return null;
                const pct = foodItemsList.length > 0 ? (count / foodItemsList.length) * 100 : 0;
                return (
                  <div key={g} className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] text-gray-500 w-14 truncate">{g}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springTransition, delay: 0.4 }} className="h-full bg-brand-success rounded-full" />
                    </div>
                    <span className="text-[9px] text-gray-400 tabular-nums w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            {/* 패션 그룹 */}
            <div>
              <p className="text-[9px] text-gray-400 mb-1.5">👕 패션</p>
              {(['의류', '신발', '가방', '액세서리'] as FashionGroup[]).map((g) => {
                const count = clothingItemsList.filter((c) => (FASHION_GROUP[c.category] ?? '의류') === g).length;
                if (count === 0) return null;
                const pct = clothingItemsList.length > 0 ? (count / clothingItemsList.length) * 100 : 0;
                return (
                  <div key={g} className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] text-gray-500 w-14 truncate">{g}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...springTransition, delay: 0.4 }} className="h-full bg-brand-primary rounded-full" />
                    </div>
                    <span className="text-[9px] text-gray-400 tabular-nums w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 소진 히스토리 */}
        {discardHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.22 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <h3 className="text-xs text-gray-400 font-medium mb-2">최근 소진 내역</h3>
            <div className="flex flex-col gap-2">
              {discardHistory.slice(0, 5).map((record, i) => (
                <div key={`${record.name}-${i}`} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{record.category === '식품' ? '🥦' : '👗'}</span>
                    <span className="text-sm text-gray-700 truncate">{record.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{record.date}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 월별 지출 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.25 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs text-gray-400 font-medium">월별 지출 추이</h3>
            <span className="text-xs font-bold text-gray-700 tabular-nums">
              총 ₩{SPENDING_DATA.reduce((s, d) => s + d.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {(() => {
              const max = Math.max(...SPENDING_DATA.map((d) => d.amount));
              return SPENDING_DATA.map((d, i) => {
                const h = Math.max(12, (d.amount / max) * 88);
                const isLast = i === SPENDING_DATA.length - 1;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className={`text-[9px] font-bold tabular-nums ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                      {(d.amount / 10000).toFixed(1)}만
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: h }}
                      transition={{ ...springTransition, delay: 0.3 + i * 0.08 }}
                      className={`w-full rounded-xl ${isLast ? 'bg-brand-primary' : 'bg-gray-200'}`}
                    />
                    <span className={`text-[10px] font-medium ${isLast ? 'text-brand-primary' : 'text-gray-400'}`}>
                      {d.month}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>

        {/* 쇼핑몰 연동 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.28 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-3">쇼핑몰 자동 연동</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { name: '쿠팡',    mallBg: 'bg-mall-coupang',    status: '준비 중' },
              { name: '네이버',   mallBg: 'bg-mall-naver',      status: '준비 중' },
              { name: '마켓컬리', mallBg: 'bg-mall-kurly',      status: '준비 중' },
              { name: '무신사',   mallBg: 'bg-mall-musinsa',    status: '준비 중' },
            ].map((mall) => (
              <div key={mall.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${mall.mallBg} flex items-center justify-center`}>
                    <span className="text-white text-[9px] font-bold">{mall.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-gray-700">{mall.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {mall.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            이메일 파싱으로 구매 내역을 자동 가져오는 기능이 곧 추가됩니다.
          </p>
        </motion.div>

        {/* 아카이브 */}
        {archived.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.29 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <h3 className="text-xs text-gray-400 font-medium mb-2">아카이브 ({archived.length}개)</h3>
            <div className="flex flex-col gap-1.5">
              {archived.slice(0, 5).map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.category === '식품' ? '🥦' : '👗'}</span>
                    <span className="text-sm text-gray-500 truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-300">{item.category}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 알림 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <h3 className="text-xs text-gray-400 font-medium mb-2">알림 설정</h3>
          <div className="divide-y divide-gray-50">
            {([
              { key: 'expiry' as const, emoji: '⏰', label: '보관 기한 임박 알림', value: notiExpiry },
              { key: 'codi' as const,   emoji: '👗', label: '코디 추천 알림',     value: notiCodi },
              { key: 'deal' as const,   emoji: '🏷️', label: '할인 정보 알림',     value: notiDeal },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <button
                  onClick={() => toggleNoti(item.key)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    item.value ? 'bg-brand-primary' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    item.value ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

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
              <button
                key={m.label}
                onClick={m.action}
                className="flex items-center gap-3 w-full py-3 text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl transition-colors"
              >
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
              <span className="text-gray-600 font-medium">NEMOA v1.3</span>
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
        </motion.div>
      </div>
    </div>
  );
}
