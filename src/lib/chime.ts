/**
 * Web Audio 기반 짧은 알림음 공용 유틸.
 * 타이머 완료·중요 이벤트용. 사용자 설정으로 on/off 가능.
 */

const CHIME_ENABLED_KEY = 'nemoa-chime-enabled';

export function isChimeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(CHIME_ENABLED_KEY);
    return stored === null ? true : stored === '1';
  } catch { return true; }
}

export function setChimeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHIME_ENABLED_KEY, enabled ? '1' : '0');
  } catch { /* 조용히 실패 */ }
}

export function playChime(): void {
  try {
    if (!isChimeEnabled()) return;
    type AudioCtx = typeof window extends { AudioContext: infer C } ? C : never;
    const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtx }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch { /* 음소거 환경 — 조용히 실패 */ }
}
