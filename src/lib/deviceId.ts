'use client';

/**
 * 익명 디바이스 식별자 — 결제·구독 서버 연동을 위한 최소 식별 수단.
 *
 * 로그인 없이도 "이 브라우저가 결제한 사람"을 서버가 알아볼 수 있어야
 * 구독 상태 확인·정기결제 갱신이 가능하다. 계정(Supabase 로그인)이 붙기 전까지는
 * 이 ID가 Toss customerKey로도 쓰인다.
 *
 * 한계: localStorage를 지우거나 다른 기기로 바꾸면 새 ID가 발급되어
 * 기존 구독을 찾지 못한다 — 진짜 크로스 디바이스 복구는 로그인(계정) 붙인 뒤 해결.
 */

const STORAGE_KEY = 'nemoa-device-id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // 구형 브라우저 폴백
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** 저장된 디바이스 ID를 반환. 없으면 새로 만들어 저장 후 반환. */
export function ensureDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) — 세션 한정 ID
    return generateId();
  }
}

/** 저장된 디바이스 ID만 조회, 없으면 null (생성 안 함). */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
