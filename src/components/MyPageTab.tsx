'use client';

import { CartItem, isFoodItem, isClothingItem } from '@/types';

interface MyPageTabProps {
  items:         CartItem[];
  favoriteCount: number;
  discardCount:  number;
}

function StatRow({ emoji, label, value, accent }: { emoji: string; label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-bold ${accent ? 'text-indigo-600' : 'text-gray-900'}`}>
        {value}개
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
        <div
          className="h-full bg-indigo-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
    </div>
  );
}

export default function MyPageTab({ items, favoriteCount, discardCount }: MyPageTabProps) {
  const foodItems     = items.filter(isFoodItem);
  const clothingItems = items.filter(isClothingItem);

  const coldCount   = foodItems.filter((f) => f.storageType === '냉장').length;
  const frozenCount = foodItems.filter((f) => f.storageType === '냉동').length;
  const roomCount   = foodItems.filter((f) => f.storageType === '실온').length;

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-6 flex flex-col gap-4">

      {/* ── 종합 통계 ── */}
      <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4">
        <h3 className="text-sm font-bold text-gray-900 mb-1">종합 통계</h3>
        <div className="divide-y divide-gray-50">
          <StatRow emoji="🛍️" label="전체 상품"     value={items.length} />
          <StatRow emoji="🥦" label="식품"          value={foodItems.length} />
          <StatRow emoji="👗" label="의류·액세서리"  value={clothingItems.length} />
          <StatRow emoji="❤️" label="즐겨찾기"      value={favoriteCount} accent />
          <StatRow emoji="🗑️" label="소진 처리 (누적)" value={discardCount} />
        </div>
      </div>

      {/* ── 보관 현황 ── */}
      {foodItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">보관 현황</h3>
          <div className="flex flex-col gap-2.5">
            <StorageBar emoji="❄️" label="냉장" count={coldCount}   total={foodItems.length} />
            <StorageBar emoji="🧊" label="냉동" count={frozenCount} total={foodItems.length} />
            <StorageBar emoji="📦" label="실온" count={roomCount}   total={foodItems.length} />
          </div>
        </div>
      )}

      {/* ── 앱 정보 ── */}
      <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">앱 정보</h3>
        <div className="flex flex-col gap-1.5 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>버전</span>
            <span className="text-gray-600 font-medium">Smart Cart Plus v0.3.5</span>
          </div>
          <div className="flex justify-between">
            <span>AI 매니저</span>
            <span className="text-gray-600 font-medium">Claude Sonnet 4.6</span>
          </div>
          <div className="flex justify-between">
            <span>Vision 파서</span>
            <span className="text-gray-600 font-medium">통합 Multimodal (Phase 3.5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
