/**
 * 강제 마일스톤 광고(아이템 추가·인스턴스 생성)의 빈도 상한을 한곳에서 관리한다.
 *
 * 배경: 마일스톤 트리거가 여러 개인데 각자 독립적으로 광고를 띄우면 짧은
 * 시간에 광고가 연속으로 뜬다(냉장고 만들고 → 아이템 5개 담으면 두 번).
 * 여기서 쿨다운·일일 상한으로 묶는다.
 *
 * (예전엔 "앱 3번째 실행마다"도 트리거였으나, 사전 안내 없이 튀어나와 사용자를
 * 놀라게 한다는 피드백으로 제거했다 — 이제 광고는 아이템 등록처럼 사용자가
 * 능동적으로 한 행동 뒤에만, 그것도 안내 후 동의해야 뜬다.)
 */

import { todayLocalStr } from './dateMath';

const FORCED_AD_TS_KEY   = 'nemoa-forced-ad-last-ts';
const FORCED_AD_DAY_KEY  = 'nemoa-forced-ad-day';      // "YYYY-MM-DD|n"

/** 강제 광고를 한 번 띄운 뒤 이 시간 동안은 다른 마일스톤 광고를 억제한다. */
const COOLDOWN_MS    = 5 * 60 * 1000;       // 5분
/** 하루에 띄우는 강제 마일스톤 광고 총량(트리거 종류 합산) 상한. */
const DAILY_CAP      = 2;

function now(): number {
  return Date.now();
}

function todayStr(): string {
  return todayLocalStr();
}

function readNum(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(key);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeNum(key: string, n: number): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, String(n)); } catch { /* quota */ }
}

/**
 * 지금 강제 마일스톤 광고를 띄워도 되는지 — 쿨다운(5분) + 일일 상한(2회) 통과 여부.
 */
export function canShowForcedAd(): boolean {
  if (typeof window === 'undefined') return false;

  const lastTs = readNum(FORCED_AD_TS_KEY);
  if (lastTs > 0 && now() - lastTs < COOLDOWN_MS) return false;

  const [day, countRaw] = (localStorage.getItem(FORCED_AD_DAY_KEY) ?? '').split('|');
  const count = day === todayStr() ? (parseInt(countRaw, 10) || 0) : 0;
  return count < DAILY_CAP;
}

/** 강제 광고를 실제로 띄운 직후 호출 — 타임스탬프와 당일 카운트를 기록한다. */
export function markForcedAdShown(): void {
  if (typeof window === 'undefined') return;
  writeNum(FORCED_AD_TS_KEY, now());
  const [day, countRaw] = (localStorage.getItem(FORCED_AD_DAY_KEY) ?? '').split('|');
  const count = day === todayStr() ? (parseInt(countRaw, 10) || 0) : 0;
  try { localStorage.setItem(FORCED_AD_DAY_KEY, `${todayStr()}|${count + 1}`); } catch { /* quota */ }
}
