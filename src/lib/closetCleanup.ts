import type { ClothingItem } from '@/types';
import type { WearLog } from './wearLog';
import { daysSince } from './wearLog.ts';
import { hasSeasonCycled } from './season.ts';

export interface CleanupCandidate {
  item:     ClothingItem;
  idleDays: number | null;    // null = 아예 착용 기록 없음
  reason:   string;           // UI 설명 문구
}

/**
 * 등록한 지 얼마 안 된 옷은 후보에서 제외한다(P0-60 후속, 전문단 E1).
 *
 * 오늘 20벌을 새로 등록하면 착용 로그가 있을 리 없는데, 그 이유만으로
 * 전부 "정리 제안"에 오르면 사용자 눈엔 터무니없어 보인다. 등록 후
 * `minRegisteredDays`일이 지나고, 그 옷의 계절이 최소 1회는 돌아와
 * 입을 기회가 있었을 때만 후보로 본다.
 *
 * `registeredAt`이 없는 레거시 아이템(필드 도입 이전 데이터)은 게이트를
 * 적용하지 않는다 — 안 그러면 이미 정리 후보였던 옷들이 필드 추가만으로
 * 조용히 후보에서 빠지는 회귀가 생긴다.
 */
function isCleanupEligible(item: ClothingItem, today: Date, minRegisteredDays: number): boolean {
  if (!item.registeredAt) return true;
  if (daysSince(item.registeredAt) < minRegisteredDays) return false;
  return hasSeasonCycled(item.weatherTags, item.registeredAt, today);
}

/**
 * 옷장 정리 후보 규칙:
 *  1. 60일 이상 미착용 (최근 로그 있음)
 *  2. 착용 로그가 아예 없는 의류
 *
 * 단, 등록한 지 90일이 안 됐거나 그 옷의 계절이 아직 한 번도 지나지
 * 않은 경우는 제외한다(`isCleanupEligible`).
 *
 * 반환 기준:
 * - idleDays 큰 것 먼저 (미착용 제일 오래된 순)
 * - 착용 기록 없는 것은 맨 뒤 (최근 구매/추가일 가능성 — 인식 여지)
 */
export function findCleanupCandidates(
  items: ClothingItem[],
  wearLog: WearLog,
  minIdleDays = 60,
  minRegisteredDays = 90,
): CleanupCandidate[] {
  const candidates: CleanupCandidate[] = [];
  const today = new Date();

  for (const item of items) {
    if (!isCleanupEligible(item, today, minRegisteredDays)) continue;

    const dates = wearLog[item.id] ?? [];
    const latest = dates[0];
    if (latest) {
      const idle = daysSince(latest);
      if (idle >= minIdleDays) {
        candidates.push({
          item,
          idleDays: idle,
          reason:   `${idle}일째 안 입었어요`,
        });
      }
    } else {
      candidates.push({
        item,
        idleDays: null,
        reason:   '아직 한 번도 안 입었어요',
      });
    }
  }

  return candidates.sort((a, b) => {
    // idleDays 큰 것 먼저, null은 맨 뒤
    if (a.idleDays === null && b.idleDays === null) return 0;
    if (a.idleDays === null) return 1;
    if (b.idleDays === null) return -1;
    return b.idleDays - a.idleDays;
  });
}
