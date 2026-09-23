'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BellOff, Trash2 } from 'lucide-react';
import { useNotificationLog, type NotificationLogEntry } from '@/lib/notificationLog';

const KIND_META: Record<NotificationLogEntry['kind'], { emoji: string; bg: string }> = {
  expiry: { emoji: '⏰', bg: 'bg-brand-warning/10' },
  codi:   { emoji: '👗', bg: 'bg-brand-primary/10' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  const daysAgo = Math.round((now.getTime() - d.getTime()) / 86_400_000);
  if (daysAgo < 7) return `${daysAgo}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 알림함 — 홈 헤더 종 아이콘을 눌렀을 때의 목적지.
 * 이전엔 종을 눌러도 /settings#notifications(권한 설정)로만 이동해 "알림
 * 목록"이 없었다(사용자 지적). 알림을 실제로 띄운 시점에만 기록하므로
 * (notificationScheduler.ts의 showNotification), 여기 보이는 건 항상
 * "정말 온 알림"이다.
 */
export default function NotificationsPage() {
  const router = useRouter();
  const { entries, unreadCount, markAllRead, clear } = useNotificationLog();
  const [notifOff, setNotifOff] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setNotifOff(Notification.permission !== 'granted');
  }, []);

  useEffect(() => {
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

  return (
    <div className="min-h-screen bg-white">
      <header
        className="sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="max-w-md min-[700px]:max-w-[680px] min-[1000px]:max-w-[880px] mx-auto px-3 pb-3 flex items-center gap-1">
          <button
            onClick={() => router.back()}
            aria-label="뒤로"
            className="w-10 h-10 flex items-center justify-center text-brand-ink shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-base font-bold text-gray-900 tracking-tight">알림</h1>
          {entries.length > 0 && (
            <button
              onClick={clear}
              aria-label="전체 삭제"
              className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="px-5 pt-4 pb-12 flex flex-col gap-2">
        {notifOff && (
          <a
            href="/settings#notifications"
            className="flex items-center gap-3 rounded-[20px] bg-gray-50 border border-gray-100 px-4 py-3.5 mb-2"
          >
            <span className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <BellOff size={16} className="text-gray-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">알림이 꺼져 있어요</p>
              <p className="text-xs text-gray-500 mt-0.5">설정에서 켜면 유통기한 임박 등을 알려드려요</p>
            </div>
          </a>
        )}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span className="text-4xl" aria-hidden>🔔</span>
            <p className="text-sm font-semibold text-gray-700 mt-2">아직 받은 알림이 없어요</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              유통기한이 임박하거나 오늘의 코디를 추천할 때{'\n'}여기에 알림이 쌓여요.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const meta = KIND_META[entry.kind];
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-[20px] px-4 py-3.5 bg-white ring-1 ring-gray-100"
              >
                <span className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center shrink-0 text-base`} aria-hidden>
                  {meta.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.body}</p>
                </div>
                <span className="text-[11px] text-gray-400 tabular-nums shrink-0 mt-0.5">
                  {formatWhen(entry.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
