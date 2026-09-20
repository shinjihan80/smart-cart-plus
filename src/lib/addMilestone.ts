import { isRewardedAdSupported } from './admob';
import { canShowForcedAd } from './adFrequency';

/**
 * 냉장고·옷장에 아이템을 "추가"할 때마다 누적 카운트하고,
 * 5의 배수(5, 10, 15…)를 넘길 때마다 리워드 영상 광고를 제안한다.
 * 보상은 없음 — 광고 형식만 리워드형(전면 영상)을 쓰는 마일스톤 광고.
 * 네이티브 앱에서만 동작 (웹은 AdMob SDK 자체가 없어 트리거 안 함).
 *
 * 예전엔 여기서 바로 `showForcedMilestoneAd()`를 불러 예고 없이 화면을
 * 덮었다 — 사용자가 뭘 하다가 갑자기 광고가 튀어나온 것처럼 느껴진다는
 * 피드백으로, 대신 `nemoa:milestone-ad` 이벤트만 쏘고 실제 노출은
 * `MilestoneAdPrompt`가 안내 화면을 먼저 보여준 뒤 사용자 동의로 진행한다.
 */
const COUNT_KEY = 'nemoa-add-milestone-count';
const MILESTONE_STEP = 5;

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
 * 이번에 추가된 개수(addedCount)를 누적 반영하고, 그 결과 5의 배수 경계를
 * 넘었으면(예: 3→6) 리워드 광고를 1회 노출한다. 배치 추가로 여러 배수를
 * 한 번에 넘어도 광고는 1회만 뜬다.
 */
export function recordAddsAndMaybeShowAd(addedCount: number): void {
  if (addedCount <= 0 || !isRewardedAdSupported()) return;

  const before = readCount();
  const after  = before + addedCount;
  writeCount(after);

  const crossedMilestone = Math.floor(after / MILESTONE_STEP) > Math.floor(before / MILESTONE_STEP);
  if (crossedMilestone && canShowForcedAd() && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nemoa:milestone-ad'));
  }
}
