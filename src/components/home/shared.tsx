'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
export const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };
export const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

interface WidgetProps {
  children:   ReactNode;
  className?: string;
  index?:     number;
}

export function Widget({ children, className = '', index = 0 }: WidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${CARD} ${className}`}
      style={CARD_SHADOW}
    >
      {children}
    </motion.div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="px-4 py-5 grid grid-cols-2 gap-4">
      <div className="col-span-2 h-[130px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="h-[120px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="col-span-2 h-[160px] rounded-[32px] bg-gray-100 animate-pulse" />
      <div className="col-span-2 h-[200px] rounded-[32px] bg-gray-100 animate-pulse" />
    </div>
  );
}
