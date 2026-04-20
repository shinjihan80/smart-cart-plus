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
