'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { springTransition, CARD, CARD_SHADOW } from './shared';

type NotiKey = 'expiry' | 'codi' | 'deal';
const STORAGE_KEY = 'smart-cart-noti';

interface NotiState { expiry: boolean; codi: boolean; deal: boolean }

export default function NotificationSettings() {
  const { showToast } = useToast();
  const [state, setState] = useState<NotiState>({ expiry: true, codi: true, deal: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          expiry: parsed.expiry ?? true,
          codi:   parsed.codi   ?? true,
          deal:   parsed.deal   ?? false,
        });
      }
    } catch { /* ignore */ }
  }, []);

  function toggle(key: NotiKey) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    showToast(next[key] ? '알림이 켜졌어요.' : '알림이 꺼졌어요.');
  }

  const items: { key: NotiKey; emoji: string; label: string }[] = [
    { key: 'expiry', emoji: '⏰', label: '보관 기한 임박 알림' },
    { key: 'codi',   emoji: '👗', label: '코디 추천 알림' },
    { key: 'deal',   emoji: '🏷️', label: '할인 정보 알림' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.3 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <h3 className="text-xs text-gray-400 font-medium mb-2">알림 설정</h3>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <button
              role="switch"
              aria-checked={state[item.key]}
              aria-label={`${item.label} 토글`}
              onClick={() => toggle(item.key)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                state[item.key] ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <div
                aria-hidden="true"
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  state[item.key] ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
