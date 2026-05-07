export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };
// MG·우리페이 스타일 — 부드러운 카드 (border 없음, 그림자만)
export const CARD = 'bg-white rounded-[24px] p-5';
export const CARD_SHADOW: React.CSSProperties = {
  boxShadow: '0 6px 16px -8px rgba(31, 31, 46, 0.08), 0 2px 4px -2px rgba(31, 31, 46, 0.04)',
};
