/**
 * NEMOA 앱 아이콘 — 겹친 두 네모를 아이소메트릭 블록으로.
 * 앞면은 브랜드 포인트 색(잉크 #1F1F2E · 인디고 #4F46E5), 윗면·옆면은 흰색을 섞은 음영.
 * public/icon.svg 와 동일 도형. next/og(Satori)용으로 data URI 로도 씀.
 */
export const BRAND_ICON_MARK =
  '<path d="M14 22 L22 14 L64 14 L56 22 Z" fill="#9A9AA1"/>' +
  '<path d="M56 22 L64 14 L64 56 L56 64 Z" fill="#62626D"/>' +
  '<path d="M14 22 L56 22 L56 64 L14 64 Z" fill="#1F1F2E"/>' +
  '<path d="M40 46 L48 38 L88 38 L80 46 Z" fill="#A7A2F2"/>' +
  '<path d="M80 46 L88 38 L88 78 L80 86 Z" fill="#807AEC"/>' +
  '<path d="M40 46 L80 46 L80 86 L40 86 Z" fill="#4F46E5"/>';

/** rounded=true 면 흰 배경에 둥근 모서리(앱 아이콘), false 면 마크만(투명). */
export function brandIconSvg(rounded = true): string {
  const bg = rounded ? '<rect width="100" height="100" rx="24" fill="#FFFFFF"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${bg}${BRAND_ICON_MARK}</svg>`;
}

export function brandIconDataUri(rounded = true): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(brandIconSvg(rounded))}`;
}
