import type { ClothingItem } from '@/types';
import type { WearLog } from './wearLog';
import { daysSince } from './wearLog';

export interface CleanupCandidate {
  item:     ClothingItem;
  idleDays: number | null;    // null = 아예 착용 기록 없음
  reason:   string;           // UI 설명 문구
}

/**
 * 옷장 정리 후보 규칙:
 *  1. 60일 이상 미착용 (최근 로그 있음)
 *  2. 착용 로그가 아예 없는 의류
 *
 * 반환 기준:
 * - idleDays 큰 것 먼저 (미착용 제일 오래된 순)
 * - 착용 기록 없는 것은 맨 뒤 (최근 구매/추가일 가능성 — 인식 여지)
 */
export function findCleanupCandidates(
  items: ClothingItem[],
  wearLog: WearLog,
  minIdleDays = 60,
): CleanupCandidate[] {
  const candidates: CleanupCandidate[] = [];

  for (const item of items) {
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
