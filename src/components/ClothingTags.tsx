import { ClothingItem } from '@/types';

interface Props {
  item: ClothingItem;
}

const THICKNESS_COLOR: Record<ClothingItem['thickness'], string> = {
  얇음:  'bg-sky-100 text-sky-700',
  보통:  'bg-slate-100 text-slate-700',
  두꺼움: 'bg-purple-100 text-purple-700',
};

export default function ClothingTags({ item }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {/* 사이즈 */}
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        {item.size}
      </span>
      {/* 두께 */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${THICKNESS_COLOR[item.thickness]}`}>
        {item.thickness}
      </span>
      {/* 소재 */}
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
        {item.material}
      </span>
    </div>
  );
}
