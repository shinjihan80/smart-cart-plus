/**
 * 강제 마일스톤 광고(실행·아이템 추가·인스턴스 생성)의 빈도 상한을 한곳에서 관리한다.
 *
 * 배경: 마일스톤 트리거가 3개(launch/add/instance)인데 각자 독립적으로 광고를 띄우면
 * 짧은 시간에 광고가 연속으로 뜨거나(냉장고 만들고 → 아이템 5개 담으면 두 번),
 * 특히 launch 는 Capacitor 원격 WebView 특성상 "새로고침 = 실행"으로 카운트돼
 * 새로고침 3번에 광고가 떴다. 여기서 세션·쿨다운·일일 상한으로 묶는다.
 */

const LAUNCH_COUNT_KEY   = 'nemoa-launch-count';
const LAUNCH_LAST_TS_KEY = 'nemoa-launch-last-ts';
const FORCED_AD_TS_KEY   = 'nemoa-forced-ad-last-ts';
const FORCED_AD_DAY_KEY  = 'nemoa-forced-ad-day';      // "YYYY-MM-DD|n"

/** 이 시간 안에 다시 뜬 페이지 로드는 "새 실행"이 아니라 새로고침·복귀로 본다. */
const SESSION_GAP_MS = 30 * 60 * 1000;      // 30분
/** 강제 광고를 한 번 띄운 뒤 이 시간 동안은 다른 마일스톤 광고를 억제한다. */
const COOLDOWN_MS    = 5 * 60 * 1000;       // 5분
/** 하루에 띄우는 강제 마일스톤 광고 총량(트리거 3종 합산) 상한. */
const DAILY_CAP      = 2;

function now(): number {
  return Date.now();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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
 * 앱 실행(세션) 카운트를 1 올리고 그 값을 돌려준다.
 * 마지막 실행으로부터 SESSION_GAP_MS 이내면 새로고침·백그라운드 복귀로 판단하고
 * null 을 돌려준다(= 이번 로드는 광고 트리거 대상 아님).
 */
export function beginLaunchSession(): number | null {
  if (typeof window === 'undefined') return null;

  const last = readNum(LAUNCH_LAST_TS_KEY);
  const t = now();
  writeNum(LAUNCH_LAST_TS_KEY, t);

  if (last > 0 && t - last < SESSION_GAP_MS) {
    return null; // 새로고침으로 본다 — 카운트도 올리지 않음
  }

  const next = readNum(LAUNCH_COUNT_KEY) + 1;
  writeNum(LAUNCH_COUNT_KEY, next);
  return next;
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
