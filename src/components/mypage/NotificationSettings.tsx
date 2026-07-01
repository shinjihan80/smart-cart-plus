'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import EmojiIcon from '@/components/EmojiIcon';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { springTransition, CARD, CARD_SHADOW } from './shared';
import { requestPermission } from '@/lib/notificationScheduler';

const ALERT_LABEL: Record<string, string> = {
  urgent:        '⏰ 임박 식품',
  rebuy:         '🔁 재구매 알림',
  'season-봄':   '🌸 봄 옷장 정리',
  'season-여름': '☀️ 여름 옷장 정리',
  'season-가을': '🍂 가을 옷장 정리',
  'season-겨울': '❄️ 겨울 옷장 정리',
};

type NotiKey = 'expiry' | 'codi' | 'deal';
const STORAGE_KEY = 'smart-cart-noti';

interface NotiState { expiry: boolean; codi: boolean; deal: boolean }

export default function NotificationSettings() {
  const { showToast } = useToast();
  const { dismissedToday, restore, restoreAll } = useDismissedAlerts();
  const [state, setState]   = useState<NotiState>({ expiry: true, codi: true, deal: false });
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>('default');
  const dismissed = dismissedToday();

  useEffect(() => {
    if (typeof Notification === 'undefined') { setPermState('unsupported'); return; }
    setPermState(Notification.permission);
  }, []);

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

  async function handlePermRequest() {
    const granted = await requestPermission();
    setPermState(granted ? 'granted' : 'denied');
    showToast(granted ? '알림 권한이 허용됐어요.' : '알림 권한이 거부됐어요. 브라우저 설정에서 변경해주세요.');
  }

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
    <>
      <div className="flex items-center gap-2">
        <EmojiIcon emoji="🔔" size={16} className="text-gray-600" />
        <span className="text-base font-bold text-gray-900 tracking-tight">알림 설정</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.3 }}
        className={CARD}
        style={CARD_SHADOW}
      >

      {/* 권한 상태 배너 */}
      {permState === 'default' && (
        <button
          onClick={handlePermRequest}
          className="mb-3 w-full flex items-center gap-2.5 p-2.5 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 text-left"
        >
          <EmojiIcon emoji="🔔" size={14} className="text-brand-primary shrink-0" />
          <p className="text-xs text-brand-primary font-semibold flex-1">알림 권한 허용 — 탭해서 활성화</p>
        </button>
      )}
      {permState === 'denied' && (
        <div className="mb-3 p-2.5 rounded-2xl bg-brand-warning/5 border border-brand-warning/15">
          <p className="text-xs text-brand-warning font-semibold">알림이 차단됐어요</p>
          <p className="text-xs text-gray-400 mt-0.5">브라우저 주소창 왼쪽 🔒 → 알림 허용으로 변경해주세요.</p>
        </div>
      )}

      {/* 오늘 닫은 알림 — dismiss 항목이 1건 이상이면 표시 */}
      {dismissed.length > 0 && (
        <div className="mb-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500 font-semibold">
              🙈 오늘 안 보기 ({dismissed.length})
            </p>
            <button
              onClick={() => {
                restoreAll();
                showToast('알림 다시 표시됨');
              }}
              className="text-xs text-brand-primary font-semibold hover:opacity-80"
            >
              전체 다시 보기
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {dismissed.map((key) => (
              <button
                key={key}
                onClick={() => {
                  restore(key);
                  showToast(`${ALERT_LABEL[key] ?? key} 다시 표시됨`);
                }}
                className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-brand-primary/30 hover:text-brand-primary transition-colors"
                aria-label={`${ALERT_LABEL[key] ?? key} 다시 표시`}
              >
                {ALERT_LABEL[key] ?? key} ×
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <EmojiIcon emoji={item.emoji} size={16} className="text-gray-600" />
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
    </>
  );
}
