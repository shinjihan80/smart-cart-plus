/**
 * 네이티브(Capacitor) 환경 감지 유틸리티
 * 서버 사이드에서 import 해도 안전하도록 typeof 가드 사용
 */

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { Capacitor?: { isNative?: boolean } }).Capacitor?.isNative;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  if (p === 'ios')     return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}

export const IS_IOS     = typeof window !== 'undefined' && getPlatform() === 'ios';
export const IS_ANDROID = typeof window !== 'undefined' && getPlatform() === 'android';
