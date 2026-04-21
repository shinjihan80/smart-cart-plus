'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { springTransition } from './shared';

const LINKS = [
  { href: '/seasonal',         emoji: '🌸', label: '제철 달력',   hash: '' },
  { href: '/fridge',           emoji: '👨‍🍳', label: '레시피 찾기', hash: '' },
  { href: '/mypage',           emoji: '🛒', label: '쇼핑 리스트', hash: '' },
  { href: '/settings#profiles', emoji: '👥', label: '프로필 설정', hash: '#profiles' },
];

export default function QuickLinks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.03 }}
      className="grid grid-cols-4 gap-2"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-white border border-gray-100 hover:border-brand-primary/20 hover:bg-brand-primary/5 active:scale-95 transition-all"
        >
          <span className="text-xl">{l.emoji}</span>
          <span className="text-[10px] font-medium text-gray-600">{l.label}</span>
        </Link>
      ))}
    </motion.div>
  );
}
