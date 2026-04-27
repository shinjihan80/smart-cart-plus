'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Refrigerator, Shirt, User, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { isFoodItem, isClothingItem } from '@/types';
import { calcRemainingDays } from '@/components/FoodTags';
import TextImportModal from '@/components/TextImportModal';

type NavItem =
  | { kind: 'link';   href: string; label: string; icon: typeof Home; badge: number; badgeNoun?: string }
  | { kind: 'action'; key:  string; label: string; icon: typeof Home };

export default function BottomNav() {
  const pathname = usePathname();
  const { items, addItems } = useCart();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // 명령 팔레트 '상품 등록 열기'에서도 모달 오픈
  useEffect(() => {
    function onOpen() { setAddOpen(true); }
    window.addEventListener('nemoa:open-register', onOpen);
    return () => window.removeEventListener('nemoa:open-register', onOpen);
  }, []);

  const urgentCount   = mounted ? items.filter(isFoodItem).filter(
    (f) => calcRemainingDays(f.purchaseDate, f.baseShelfLifeDays) <= 3,
  ).length : 0;
  const clothingCount = mounted ? items.filter(isClothingItem).length : 0;

  const NAV_ITEMS: NavItem[] = [
    { kind: 'link',   href: '/',       label: '홈',     icon: Home,         badge: 0 },
    { kind: 'link',   href: '/fridge', label: '냉장고', icon: Refrigerator, badge: urgentCount,   badgeNoun: '임박 식품' },
    { kind: 'action', key:  'add',     label: '등록',   icon: Plus },
    { kind: 'link',   href: '/closet', label: '옷장',   icon: Shirt,        badge: clothingCount, badgeNoun: '의류' },
    { kind: 'link',   href: '/mypage', label: '마이',   icon: User,         badge: 0 },
  ];

  return (
    <>
      <nav
        aria-label="메인 메뉴"
        className="fixed bottom-0 left-0 right-0 z-20 bg-white"
        style={{ boxShadow: '0 -4px 16px -8px rgba(31,31,46,0.08)' }}
      >
        <div className="max-w-md sm:max-w-lg mx-auto flex">
          {NAV_ITEMS.map((entry) => {
            if (entry.kind === 'action') {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.key}
                  aria-label="상품 등록"
                  onClick={() => setAddOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-brand-primary transition-colors"
                >
                  <span className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/40 -mt-4 active:scale-95 transition-transform">
                    <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-semibold">{entry.label}</span>
                </button>
              );
            }
            const { href, label, icon: Icon, badge, badgeNoun } = entry;
            const isActive = pathname === href;
            const a11yLabel = badge > 0 ? `${label} · ${badgeNoun ?? ''} ${badge}개` : label;
            return (
              <Link
                key={href}
                href={href}
                aria-label={a11yLabel}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2 gap-1 transition-colors relative ${
                  isActive ? 'text-brand-primary' : 'text-gray-500'
                }`}
              >
                {/* 상단 활성 인디케이터 */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-brand-primary"
                  />
                )}
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                  {badge > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white ${
                        href === '/fridge' ? 'bg-brand-accent' : 'bg-brand-primary'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {addOpen && (
        <TextImportModal
          onClose={() => setAddOpen(false)}
          onImport={(newItems) => {
            const { added, skipped } = addItems(newItems);
            if (skipped > 0) {
              showToast(`${added}개 추가 (${skipped}개 중복 건너뜀)`);
            } else {
              showToast(`${added}개 상품이 추가됐어요!`);
            }
          }}
        />
      )}
    </>
  );
}
