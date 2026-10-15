import type { FridgeSection, WardrobeSection } from '@/types';

/**
 * 재검토(비판 모드, 2026-10-15, P1-109) — 냉장고·옷장 빈 칸 상세 시트의
 * "식품/의류 등록하기" CTA가 `new Event('nemoa:open-register')`만 보내,
 * 등록 모달은 어느 칸·어느 인스턴스에서 눌렀는지 전혀 모른 채 식품/옷을
 * 다시 묻고 기본값(냉장·7일·추천 칸)으로 저장했다(C9 코드 확인). 더
 * 나쁘게는 냉장고를 2대 이상 쓰는 사용자가 2번째 냉장고의 빈 칸에서
 * 등록하면 품목이 1번째 냉장고로 저장되는 데이터 오염도 있었다(E2
 * 코드 경로 확인).
 *
 * 등록 진입점(홈·검색·냉장고/옷장 페이지·칸 시트·커맨드팔레트)이 전부
 * 이 이벤트 하나를 공유하므로, "어디서 왔는가"를 실을 수 있는 타입을
 * 이벤트 detail에 태운다. preset 없이 호출하면(기존 호출부 대부분)
 * 예전과 동일하게 동작 — 도메인 선택부터 시작한다.
 */
export type RegisterPreset =
  | { domain: 'food'; fridgeSection?: FridgeSection; fridgeInstanceId?: string }
  | { domain: 'clothing'; wardrobeSection?: WardrobeSection; wardrobeInstanceId?: string };

export function openRegister(preset?: RegisterPreset): void {
  window.dispatchEvent(new CustomEvent<RegisterPreset | undefined>('nemoa:open-register', { detail: preset }));
}
