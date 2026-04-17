'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Refrigerator, Shirt, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isFoodItem, isClothingItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';

export default function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const urgentCount   = mounted ? items.filter(isFoodItem).filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length : 0;
  const clothingCount = mounted ? items.filter(isClothingItem).length : 0;

  const NAV_ITEMS = [
    { href: '/',       label: '홈',     icon: Home,         badge: 0 },
    { href: '/fridge', label: '냉장고', icon: Refrigerator, badge: urgentCount },
    { href: '/closet', label: '옷장',   icon: Shirt,        badge: clothingCount },
    { href: '/mypage', label: '마이',   icon: User,         badge: 0 },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-100">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                isActive ? 'text-brand-primary' : 'text-gray-400'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
                    href === '/fridge' ? 'bg-brand-warning' : 'bg-brand-primary'
                  }`}>
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
