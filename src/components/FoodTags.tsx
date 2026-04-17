import { FoodItem } from '@/types';

interface Props {
  item: FoodItem;
}

const STORAGE_COLOR: Record<FoodItem['storageType'], string> = {
  냉장: 'bg-blue-100 text-blue-700',
  냉동: 'bg-indigo-100 text-indigo-700',
  실온: 'bg-amber-100 text-amber-700',
};

function calcRemainingDays(purchaseDate: string, baseShelfLifeDays: number): number {
  const purchase = new Date(purchaseDate);
  const expiry   = new Date(purchase);
  expiry.setDate(expiry.getDate() + baseShelfLifeDays);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ShelfLifeBadge({ days }: { days: number }) {
  const expired = days <= 0;
  const urgent  = days > 0 && days <= 2;

  const color = expired
    ? 'bg-red-100 text-red-700'
    : urgent
    ? 'bg-orange-100 text-orange-700'
    : 'bg-green-100 text-green-700';

  const label = expired
    ? '보관 기한 초과'
    : `D-${days} 보관 가능`;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function FoodTags({ item }: Props) {
  const remaining = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {/* 보관 방법 */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STORAGE_COLOR[item.storageType]}`}>
        {item.storageType} 보관
      </span>
      {/* 보관 가능 일수 */}
      <ShelfLifeBadge days={remaining} />
    </div>
  );
}
