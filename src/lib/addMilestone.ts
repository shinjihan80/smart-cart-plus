import { showRewardedAd, isRewardedAdSupported } from './admob';

/**
 * 냉장고·옷장에 아이템을 "추가"할 때마다 누적 카운트하고,
 * 5의 배수(5, 10, 15…)를 넘길 때마다 AdMob 리워드 영상 광고를 강제 노출한다.
 * 추가로, 한 번에 2개 이상을 배치로 추가하면 누적 마일스톤과 무관하게
 * 그 즉시 매번 노출한다(예: 1개씩 3번 추가는 광고 없음, 한 번에 2개 추가는 매번 노출).
 * 두 조건이 동시에 만족되어도 광고는 1회만 뜬다.
 * 보상은 없음 — 광고 형식만 리워드형(전면 영상)을 쓰는 마일스톤 광고.
 * 네이티브 앱에서만 동작 (웹은 AdMob SDK 자체가 없어 트리거 안 함).
 */
const COUNT_KEY = 'nemoa-add-milestone-count';
const MILESTONE_STEP = 5;
const BATCH_ADD_THRESHOLD = 2;

function readCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeCount(n: number) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(COUNT_KEY, String(n)); } catch { /* quota */ }
}

/**
 * 이번에 추가된 개수(addedCount)를 누적 반영하고, 다음 중 하나라도 해당하면
 * 리워드 광고를 1회 노출한다(중복 노출 없음):
 *  - 누적 카운트가 5의 배수 경계를 넘었을 때(예: 3→6)
 *  - 이번 배치에서 한 번에 2개 이상을 추가했을 때(누적과 무관하게 매번)
 */
export function recordAddsAndMaybeShowAd(addedCount: number): void {
  if (addedCount <= 0 || !isRewardedAdSupported()) return;

  const before = readCount();
  const after  = before + addedCount;
  writeCount(after);

  const crossedMilestone = Math.floor(after / MILESTONE_STEP) > Math.floor(before / MILESTONE_STEP);
  const isBatchAdd = addedCount >= BATCH_ADD_THRESHOLD;

  if (crossedMilestone || isBatchAdd) {
    showRewardedAd();
  }
}
