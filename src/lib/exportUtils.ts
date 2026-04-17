import { CartItem, isFoodItem, isClothingItem } from '@/types';

export function exportAsJSON(items: CartItem[]): void {
  const data = JSON.stringify(items, null, 2);
  download(data, 'smart-cart-data.json', 'application/json');
}

export function exportAsCSV(items: CartItem[]): void {
  const foodRows = items.filter(isFoodItem).map((f) =>
    [f.id, f.name, f.category, f.foodCategory, f.storageType, f.baseShelfLifeDays, f.purchaseDate].join(',')
  );
  const clothingRows = items.filter(isClothingItem).map((c) =>
    [c.id, c.name, c.category, c.size, c.thickness, c.material].join(',')
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

  download(csv, 'smart-cart-data.csv', 'text/csv');
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
