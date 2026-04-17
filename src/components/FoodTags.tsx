import { FoodItem } from '@/types';

interface Props {
  item: FoodItem;
  wide?: boolean; // 넓은 벤토 카드에서 더 여유있게 표시
}

const STORAGE_LABEL: Record<FoodItem['storageType'], string> = {
  냉장: '❄️ 냉장 보관',
  냉동: '🧊 냉동 보관',
  실온: '📦 실온 보관',
};

export function calcRemainingDays(purchaseDate: string, baseShelfLifeDays: number): number {
  const expiry = new Date(purchaseDate);
  expiry.setDate(expiry.getDate() + baseShelfLifeDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type StatusTier = 'expired' | 'urgent' | 'warning' | 'fresh';

function getStatus(days: number): StatusTier {
  if (days <= 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 5) return 'warning';
  return 'fresh';
}

const STATUS_BADGE: Record<StatusTier, { label: string; className: string }> = {
  expired: { label: '보관 기한 초과',   className: 'bg-rose-50 text-rose-500' },
  urgent:  { label: '긴급 소비 필요',   className: 'bg-amber-50 text-amber-500' },
  warning: { label: '소비 권장',        className: 'bg-yellow-50 text-yellow-600' },
  fresh:   { label: '신선',             className: 'bg-emerald-50 text-emerald-600' },
};

/**
 * FoodTags — 하이엔드 에디토리얼 스타일
 *
 * D-Day 숫자를 text-3xl font-bold로 크게 표시해 핵심 데이터를 시각적 포인트로 강조.
 * 뮤트 톤 컬러 (rose-50/amber-50)로 Calm Tech 감성 유지.
 */
export default function FoodTags({ item, wide }: Props) {
  const days   = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);
  const status = getStatus(days);
  const badge  = STATUS_BADGE[status];

  return (
    <div className={`flex items-end justify-between gap-3 mt-3 ${wide ? 'mt-4' : ''}`}>
      {/* 왼쪽: D-Day 숫자 (핵심 데이터 강조) */}
      <div className="flex flex-col gap-0.5">
        <span className={`font-bold leading-none tracking-tight ${wide ? 'text-4xl' : 'text-3xl'} ${
          status === 'expired' ? 'text-rose-500' :
          status === 'urgent'  ? 'text-amber-500' :
          status === 'warning' ? 'text-yellow-500' :
          'text-gray-900'
        }`}>
          {days <= 0 ? '만료' : `D-${days}`}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {STORAGE_LABEL[item.storageType]}
        </span>
      </div>

      {/* 오른쪽: 상태 배지 */}
      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    </div>
  );
}
