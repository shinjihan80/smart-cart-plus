'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import EmojiIcon from '@/components/EmojiIcon';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { springTransition, CARD, CARD_SHADOW } from './shared';
import { requestPermission, scheduleExpiryNotification } from '@/lib/notificationScheduler';
import { isNative } from '@/lib/native';
import {
  requestLocalNotificationPermission,
  getLocalNotificationPermissionState,
  rescheduleExpiryNotifications,
  cancelAllExpiryNotifications,
} from '@/lib/native/localNotifications';
import { useCart } from '@/context/CartContext';
import { isFoodItem } from '@/types';

const ALERT_LABEL: Record<string, string> = {
  urgent:        '⏰ 임박 식품',
  rebuy:         '🔁 재구매 알림',
  'season-봄':   '🌸 봄 옷장 정리',
  'season-여름': '☀️ 여름 옷장 정리',
  'season-가을': '🍂 가을 옷장 정리',
  'season-겨울': '❄️ 겨울 옷장 정리',
  'noti-off':    '🔕 알림 꺼짐 안내',
};

type NotiKey = 'expiry' | 'codi' | 'deal';
const STORAGE_KEY = 'nemoa-noti';

interface NotiState { expiry: boolean; codi: boolean; deal: boolean }

export default function NotificationSettings() {
  const { showToast } = useToast();
  const { items: cartItems } = useCart();
  const { dismissedToday, restore, restoreAll } = useDismissedAlerts();
  const [state, setState]   = useState<NotiState>({ expiry: true, codi: true, deal: false });
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>('default');
  const dismissed = dismissedToday();

  useEffect(() => {
    if (isNative()) {
      void getLocalNotificationPermissionState().then(setPermState);
      return;
    }
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
    const granted = isNative() ? await requestLocalNotificationPermission() : await requestPermission();
    setPermState(granted ? 'granted' : 'denied');
    // P1-100 — 웹에서 "휴대폰 설정에서 변경해주세요"라고 안내해도 브라우저
    // 탭이라 휴대폰 앱 목록에 NEMOA가 없어 똑같이 막혔다(C1·C9 각자 독립
    // 실측). 웹은 브라우저 자체 설정으로 안내.
    showToast(granted ? '알림 권한이 허용됐어요.' : (isNative() ? '알림 권한이 거부됐어요. 휴대폰 설정에서 변경해주세요.' : '알림 권한이 거부됐어요. 주소창의 자물쇠 아이콘에서 변경해주세요.'));
  }

  function toggle(key: NotiKey) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    showToast(next[key] ? '알림이 켜졌어요.' : '알림이 꺼졌어요.');

    if (key === 'expiry') {
      if (isNative()) {
        if (next.expiry) void rescheduleExpiryNotifications(cartItems.filter(isFoodItem));
        else void cancelAllExpiryNotifications();
      } else if (next.expiry) {
        // P2-49 — 웹은 rescheduleExpiryNotifications가 no-op(네이티브
        // 전용)이라, 알림을 꺼놨다가 다시 켠 그날은 다음 앱 재시작까지
        // 전혀 재검사되지 않았다. 토글 켤 때 바로 한 번 검사.
        void scheduleExpiryNotification(cartItems.filter(isFoodItem));
      }
    }
  }

  // "할인 정보 알림"은 토글을 켜도 실제로 아무 알림도 울리지 않았다 —
  // 할인·가격 정보 화면 자체가 앱에 없다(P1-39, C7 발견: "셋 중 가장
  // 솔깃한 토글이 계속 안 울리면 나중에 진짜 기능이 생겨도 안 켠다").
  // 기능이 생기기 전까지 비활성 + "출시 예정" 배지로 명확히 표시.
  const items: { key: NotiKey; emoji: string; label: string; comingSoon?: boolean }[] = [
    { key: 'expiry', emoji: '⏰', label: '보관 기한 임박 알림' },
    { key: 'codi',   emoji: '👗', label: '코디 추천 알림' },
    { key: 'deal',   emoji: '🏷️', label: '할인 정보 알림', comingSoon: true },
  ];

  return (
    <>
      <div id="notifications" className="flex items-center gap-2 scroll-mt-28">
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
          <p className="text-xs text-gray-400 mt-0.5">
            {isNative()
              ? '휴대폰 설정 → 앱 → NEMOA → 알림에서 허용으로 바꿔주세요.'
              : '주소창 왼쪽 자물쇠(또는 ⓘ) 아이콘 → 알림에서 허용으로 바꿔주세요.'}
          </p>
          {/* P1-100 — 바로 아래 알림 종류 스위치들이 전부 "켜짐"으로
              보여, "차단됐다"는 말과 "켜져 있다"는 말이 동시에 떠
              모순처럼 읽혔다(C1·C9 실측). 스위치는 "어떤 알림을
              원하는지"(선호도)이고 권한과는 별개 차원이라는 걸 한
              줄로 연결. */}
          <p className="text-xs text-gray-400 mt-1.5 pt-1.5 border-t border-brand-warning/10">
            아래 스위치는 &ldquo;어떤 알림을 받고 싶은지&rdquo; 설정이에요 — 켜져 있어도 위 권한이 차단된 동안은 오지 않아요.
          </p>
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
            <div className="flex items-center gap-2">
              <EmojiIcon emoji={item.emoji} size={16} className={item.comingSoon ? 'text-gray-300' : 'text-gray-600'} />
              <span className={`text-sm ${item.comingSoon ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
              {item.comingSoon && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
                  출시 예정
                </span>
              )}
            </div>
            {item.comingSoon ? (
              <div
                role="switch"
                aria-checked={false}
                aria-disabled="true"
                aria-label={`${item.label} — 출시 예정, 아직 켤 수 없음`}
                className="w-10 h-6 rounded-full relative bg-gray-100 cursor-not-allowed"
              >
                <div aria-hidden="true" className="absolute top-1 translate-x-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            ) : (
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
            )}
          </div>
        ))}
      </div>
      {/* P2-49 — 웹 알림은 앱이 열려 있을 때만 올 수 있다는 제약이 어디에도
          안 적혀 있어, 앱을 닫아두면 못 받는 걸 "알림이 고장났다"로
          오인하기 쉬웠다(리뷰 해결안 2번째 항목). 네이티브 앱은 OS가
          꺼져 있어도 울려주므로 이 제약이 없어 네이티브에선 숨긴다. */}
      {!isNative() && (
        <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed">
          💡 웹에서는 네모아 앱(탭)이 열려 있을 때만 알림을 받을 수 있어요.
        </p>
      )}
      </motion.div>
    </>
  );
}
