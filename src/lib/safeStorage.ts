import { logError } from './errorLog';

/**
 * `localStorage.setItem`을 그대로 부르면 용량 초과(`QuotaExceededError`,
 * 주 원인은 사진 base64) 시 예외가 그대로 터진다 — 냉장고 메인 데이터
 * (`CartContext`)는 이 예외를 하나도 안 잡아서 화면이 그대로 크래시하고,
 * 다른 저장소들은 완전 침묵 catch라 토스트는 "저장됨"으로 뜨는데 실제로는
 * 디스크에 안 남아 새로고침하면 사라지는 조용한 데이터 유실이 있었다
 * (P0-23/P0-63, 검토단 C5·전문단 E2 발견). 이 함수로 통일해 최소한
 * "저장이 안 됐다"는 사실만큼은 항상 사용자에게 알린다.
 *
 * 실패해도 예외를 던지지 않는다 — 호출부는 반환값(성공 여부)만 보고
 * 필요하면 자체적으로 후속 처리한다.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    const isQuota = err instanceof DOMException
      && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    logError(err, 'manual');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nemoa:storage-write-failed', { detail: { key, isQuota } }));
    }
    return false;
  }
}
