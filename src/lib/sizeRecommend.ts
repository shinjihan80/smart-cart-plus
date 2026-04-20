import type { BodyInfo } from './profile';

export interface RecommendedSizes {
  top:    string | null;   // 상의 권장 (S/M/L/XL 등)
  bottom: string | null;   // 하의 권장 (28/30/32 인치 등)
  shoe:   number | null;   // 신발 권장 (mm)
}

/**
 * 아주 단순한 룩업 — 브랜드 불문 평균 한국 사이즈 기준.
 * 실제 사이즈는 브랜드마다 달라서 "권장"은 안내용, 사용자가 덮어쓰기 가능.
 */
export function recommendSizes(body: BodyInfo): RecommendedSizes {
  return {
    top:    recommendTop(body.heightCm, body.weightKg),
    bottom: recommendBottom(body.weightKg),
    shoe:   recommendShoe(body.heightCm),
  };
}

function recommendTop(height?: number, weight?: number): string | null {
  if (typeof weight !== 'number') return null;
  // 몸무게 우선, 키 보정
  if (weight < 50) return 'S';
  if (weight < 60) return typeof height === 'number' && height >= 175 ? 'M' : 'S-M';
  if (weight < 70) return 'M';
  if (weight < 80) return 'L';
  if (weight < 90) return 'L-XL';
  return 'XL';
}

function recommendBottom(weight?: number): string | null {
  if (typeof weight !== 'number') return null;
  if (weight < 50) return '26';
  if (weight < 55) return '27';
  if (weight < 60) return '28';
  if (weight < 65) return '29';
  if (weight < 70) return '30';
  if (weight < 75) return '31';
  if (weight < 80) return '32';
  if (weight < 85) return '33';
  if (weight < 90) return '34';
  return '36';
}

function recommendShoe(height?: number): number | null {
  if (typeof height !== 'number') return null;
  // 키 기반 대략치 — 실제 발 크기는 개인차
  if (height < 150) return 225;
  if (height < 155) return 230;
  if (height < 160) return 235;
  if (height < 165) return 240;
  if (height < 170) return 250;
  if (height < 175) return 260;
  if (height < 180) return 265;
  if (height < 185) return 270;
  return 275;
}

/** 사용자가 직접 입력한 사이즈가 있으면 그걸 우선, 없으면 권장값 반환. */
export function resolveSize(body: BodyInfo, which: 'top' | 'bottom' | 'shoe'): string | null {
  if (which === 'top')    return body.topSize    ?? recommendTop(body.heightCm, body.weightKg);
  if (which === 'bottom') return body.bottomSize ?? recommendBottom(body.weightKg);
  const shoe = body.shoeSize ?? recommendShoe(body.heightCm);
  return shoe === null ? null : String(shoe);
}

// ─── 사이즈 매칭 비교 ────────────────────────────────────────────────────────

export type SizeMatchStatus = 'match' | 'close' | 'off' | 'unknown';

export interface SizeMatchResult {
  status:  SizeMatchStatus;
  label:   string;   // UI 표시 (예: "🎯 딱 맞아요")
  detail?: string;   // 추가 설명 (예: "권장 M")
}

const TOP_ORDER = ['XS', 'S', 'S-M', 'M', 'M-L', 'L', 'L-XL', 'XL', 'XXL', 'XXXL'];

function normalizeTop(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '').trim();
}

/** 단순 숫자 추출 (예: "30" → 30, "30인치" → 30, "260mm" → 260). */
function extractNumber(s: string): number | null {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/** 상의 사이즈 비교 (S/M/L/XL). */
function compareTop(actual: string, target: string): SizeMatchStatus {
  const a = TOP_ORDER.indexOf(normalizeTop(actual));
  const t = TOP_ORDER.indexOf(normalizeTop(target));
  if (a === -1 || t === -1) return 'unknown';
  const diff = Math.abs(a - t);
  if (diff === 0) return 'match';
  if (diff <= 1) return 'close';
  return 'off';
}

/** 하의 사이즈 비교 (인치 숫자). */
function compareBottom(actual: string, target: string): SizeMatchStatus {
  const a = extractNumber(actual);
  const t = extractNumber(target);
  if (a === null || t === null) return 'unknown';
  const diff = Math.abs(a - t);
  if (diff <= 1) return 'match';
  if (diff <= 3) return 'close';
  return 'off';
}

/** 신발 사이즈 비교 (mm 숫자). */
function compareShoe(actual: string, target: string): SizeMatchStatus {
  const a = extractNumber(actual);
  const t = extractNumber(target);
  if (a === null || t === null) return 'unknown';
  const diff = Math.abs(a - t);
  if (diff <= 5)  return 'match';
  if (diff <= 10) return 'close';
  return 'off';
}

/**
 * 의류 카테고리 + 실제 사이즈 + 소유자 신체 정보로 매칭 결과 반환.
 * size === 'Free'거나 카테고리가 액세서리·가방 등 사이즈 무관이면 unknown.
 */
export function compareSize(
  category: string,
  actualSize: string,
  body: BodyInfo,
): SizeMatchResult {
  if (!actualSize || actualSize.toLowerCase() === 'free') {
    return { status: 'unknown', label: '' };
  }

  let which: 'top' | 'bottom' | 'shoe' | null = null;
  if (category === '상의' || category === '아우터' || category === '원피스') which = 'top';
  else if (category === '하의')                                              which = 'bottom';
  else if (category === '신발')                                              which = 'shoe';

  if (!which) return { status: 'unknown', label: '' };

  const target = resolveSize(body, which);
  if (!target) return { status: 'unknown', label: '' };

  let status: SizeMatchStatus;
  if (which === 'top')         status = compareTop(actualSize, target);
  else if (which === 'bottom') status = compareBottom(actualSize, target);
  else                         status = compareShoe(actualSize, target);

  const detail = `권장 ${target}`;
  if (status === 'match')   return { status, label: '🎯 딱 맞아요',       detail };
  if (status === 'close')   return { status, label: '👌 비슷해요',        detail };
  if (status === 'off')     return { status, label: '⚠️ 사이즈 안 맞을 수',  detail };
  return { status, label: '' };
}
