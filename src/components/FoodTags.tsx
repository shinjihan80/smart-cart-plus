import { FoodItem } from '@/types';
import { localMidnight, todayMidnight, daysBetween } from '@/lib/dateMath';
import { EXPIRY_LABEL, EXPIRY_TONE, classifyExpiry } from '@/lib/expiryThresholds';

interface Props {
  item: FoodItem;
  wide?: boolean; // 넓은 벤토 카드에서 더 여유있게 표시
}

const STORAGE_LABEL: Record<FoodItem['storageType'], string> = {
  냉장: '❄️ 냉장 보관',
  냉동: '🧊 냉동 보관',
  실온: '📦 실온 보관',
};

/**
 * expiryDate(사용자가 확정한 절대 유통기한)가 있으면 그 값을 그대로 D-day
 * 기준으로 쓰고, 없을 때만 purchaseDate+baseShelfLifeDays로 역산한다 —
 * 상대일수만 쓰면 확정 후 구매일을 고칠 때 확정값이 조용히 깨진다(P0-33
 * 재오픈, 검토단 E2·E3 라이브 재현).
 */
export function calcRemainingDays(purchaseDate: string, baseShelfLifeDays: number, expiryDate?: string): number {
  const expiry = expiryDate ? localMidnight(expiryDate) : localMidnight(purchaseDate);
  if (!expiryDate) expiry.setDate(expiry.getDate() + baseShelfLifeDays);
  return daysBetween(todayMidnight(), expiry);
}

// P1-111 — 이 컴포넌트만 getStatus()로 자체 임계값(urgent<=2·warning<=5)을
// 써서, 같은 품목이 냉장고 칸·식품 카드에선 "soon"(dDay<=3)인데 여기선
// 아직 "urgent" 문턱(<=2)에 못 들어가 다른 상태로 보이는 불일치가 있었다
// (C6·C8·E2·E3). classifyExpiry()로 전 화면 공통 버킷(expiryThresholds.ts)을
// 그대로 쓰고, 색도 EXPIRY_TONE 단일 매핑으로 교체한다.
const STATUS_LABEL: Record<ReturnType<typeof classifyExpiry>, string> = {
  expired: '보관 기한 초과',
  today:   '긴급 소비 필요',
  soon:    '소비 권장',
  fresh:   '신선',
};

/**
 * FoodTags — 하이엔드 에디토리얼 스타일
 *
 * D-Day 숫자를 text-3xl font-bold로 크게 표시해 핵심 데이터를 시각적 포인트로 강조.
 * 뮤트 톤 컬러 (rose-50/amber-50)로 Calm Tech 감성 유지.
 */
export default function FoodTags({ item, wide }: Props) {
  const days   = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays, item.expiryDate);
  const status = classifyExpiry(days);
  // fresh는 이번 불일치 버그(expired/today/soon 역전)의 당사자가
  // 아니고, 이 컴포넌트만 "신선해요"를 긍정 신호(초록)로 늘 보여주던
  // 기존 디자인이라 EXPIRY_TONE.fresh(중립 회색)로 바꾸지 않고 그대로
  // 둔다 — 다른 3곳(냉장고 칸·칸 상세·식품 카드)은 fresh일 때 배지
  // 자체를 안 그려 비교 대상도 아니다.
  const tone = status === 'fresh'
    ? { text: 'text-gray-900', chipBg: 'bg-emerald-50', chipText: 'text-emerald-600' }
    : EXPIRY_TONE[status];

  return (
    <div className={`flex items-end justify-between gap-3 mt-3 ${wide ? 'mt-4' : ''}`}>
      {/* 왼쪽: D-Day 숫자 (핵심 데이터 강조) */}
      <div className="flex flex-col gap-0.5">
        <span className={`font-bold leading-none tracking-tight ${wide ? 'text-4xl' : 'text-3xl'} ${tone.text}`}>
          {days < 0 ? EXPIRY_LABEL.over : `D-${days}`}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {STORAGE_LABEL[item.storageType]}
        </span>
      </div>

      {/* 오른쪽: 상태 배지 */}
      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${tone.chipBg} ${tone.chipText}`}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
