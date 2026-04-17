'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Refrigerator, Shirt, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',        label: '홈',       icon: Home },
  { href: '/fridge',  label: '냉장고',   icon: Refrigerator },
  { href: '/closet',  label: '옷장',     icon: Shirt },
  { href: '/mypage',  label: '마이페이지', icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-100">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
