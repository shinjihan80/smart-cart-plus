'use client';

import Link from 'next/link';
import { isClothingItem, type CartItem } from '@/types';
import { useProfiles } from '@/lib/profile';
import { useWearLog } from '@/lib/wearLog';
import { Widget } from './shared';

export default function ClosetSummary({ items }: { items: CartItem[] }) {
  const { profiles } = useProfiles();
  const { log: wearLog } = useWearLog();
  const allClothes = items.filter(isClothingItem);
  const clothes    = allClothes.filter((c) => !c.hibernating);
  const hibernatingCount = allClothes.length - clothes.length;
  const thinCount  = clothes.filter((c) => c.thickness === '얇음').length;
  const thickCount = clothes.filter((c) => c.thickness === '두꺼움').length;
  const withImages = clothes.filter((c) => c.imageUrl).slice(0, 3);

  const ownerBreakdown = profiles.length >= 2
    ? profiles.map((p) => ({
        name:  p.name,
        count: clothes.filter((c) => c.ownerId === p.id).length,
      })).filter((o) => o.count > 0)
    : [];

  // 로테이션 밸런스 뱃지 — 기록 있는 옷이 5벌+ 일 때만 계산
  const rotationBadge = (() => {
    const counts = clothes.map((c) => wearLog[c.id]?.length ?? 0).filter((n) => n > 0);
    if (counts.length < 5) return null;
    const mean = counts.reduce((s, n) => s + n, 0) / counts.length;
    const variance = counts.reduce((s, n) => s + (n - mean) ** 2, 0) / counts.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    const score = Math.round(Math.max(0, Math.min(100, (1 - cv / 1.5) * 100)));
    return score;
  })();

  return (
    <Link href="/closet" className="block">
      <Widget index={1}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👔</span>
              <span className="text-xs text-gray-400 font-medium">옷장 현황</span>
            </div>
            {withImages.length > 0 && (
              <div className="flex -space-x-2">
                {withImages.map((c) => (
                  <div key={c.id} className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl!} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
              {clothes.length}<span className="text-base font-bold text-gray-400 ml-0.5">벌</span>
              {hibernatingCount > 0 && (
                <span className="text-[10px] text-gray-400 font-medium ml-1.5 tabular-nums">
                  · 보관 {hibernatingCount}
                </span>
              )}
            </p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-500 font-medium">
                얇은 옷 {thinCount}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 font-medium">
                두꺼운 옷 {thickCount}
              </span>
              {ownerBreakdown.slice(0, 2).map((o) => (
                <span
                  key={o.name}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium tabular-nums"
                >
                  {o.name} {o.count}
                </span>
              ))}
              {rotationBadge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium tabular-nums ${
                    rotationBadge >= 70
                      ? 'bg-brand-success/10 text-brand-success'
                      : rotationBadge >= 40
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'bg-brand-warning/10 text-brand-warning'
                  }`}
                  title="로테이션 밸런스 — 옷을 얼마나 고루 입나"
                >
                  🔄 {rotationBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </Widget>
    </Link>
  );
}
