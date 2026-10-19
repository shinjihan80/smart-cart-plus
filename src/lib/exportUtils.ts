import { CartItem, isFoodItem, isClothingItem } from '@/types';

export function exportAsJSON(items: CartItem[]): void {
  const data = JSON.stringify(items, null, 2);
  download(data, 'nemoa-data.json', 'application/json');
}

/**
 * 재발견 — 아래 행 생성이 전부 .join(',')뿐이라 필드 이스케이프가
 * 없었다. 상품명은 영수증 텍스트·AI 파싱에서 그대로 들어오는 자유
 * 텍스트라 쉼표가 섞이기 쉬운데("무인양품 리넨 셔츠, 네이비 M" 등),
 * 쉼표 하나만 있어도 그 행의 나머지 모든 칸이 한 칸씩 밀려 CSV가
 * 깨진다(엑셀·시트에서 열면 바로 보임). RFC 4180대로 쉼표·따옴표·
 * 줄바꿈이 섞인 필드만 큰따옴표로 감싸고 내부 따옴표는 두 번 써서
 * 이스케이프한다.
 */
function csvField(value: string | number | undefined | null): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(fields: (string | number | undefined | null)[]): string {
  return fields.map(csvField).join(',');
}

export function exportAsCSV(items: CartItem[]): void {
  const foodRows = items.filter(isFoodItem).map((f) =>
    csvRow([f.id, f.name, f.category, f.foodCategory, f.storageType, f.baseShelfLifeDays, f.purchaseDate])
  );
  const clothingRows = items.filter(isClothingItem).map((c) =>
    csvRow([c.id, c.name, c.category, c.size, c.thickness, c.material])
  );

  const csv = [
    '=== 식품 ===',
    'id,name,category,foodCategory,storageType,shelfLifeDays,purchaseDate',
    ...foodRows,
    '',
    '=== 패션 ===',
    'id,name,category,size,thickness,material',
    ...clothingRows,
  ].join('\n');

  download(csv, 'nemoa-data.csv', 'text/csv');
}

/**
 * 재발견 — backup.ts의 downloadBackup()은 이미 P0-64에서 "DOM에 없는
 * anchor의 click()이 다운로드를 안 띄우거나, revokeObjectURL을 곧바로
 * 부르면 다운로드 시작 전에 blob URL이 무효화될 수 있다"는 걸 발견해
 * DOM 삽입 + revoke를 다음 틱으로 늦추는 수정을 받았는데, 같은
 * download-트리거 패턴을 쓰는 이 함수(JSON/CSV 내보내기)는 그 수정을
 * 못 받고 그대로 남아 있었다 — 같은 근본 원인이 두 곳에 따로
 * 구현돼 있어 한쪽만 고쳐진 사례. 동일하게 맞춘다.
 */
function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
