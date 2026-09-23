'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BellOff, Trash2 } from 'lucide-react';
import { useNotificationLog, type NotificationLogEntry } from '@/lib/notificationLog';

// 카드를 눌렀을 때 갈 곳 — 알림 종류별로 실제 확인할 화면으로 보낸다.
// 예전엔 카드가 아예 안 눌려서 "우유가 임박"이라고 읽고도 냉장고 탭을
// 처음부터 다시 찾아 들어가야 했다(검토단 C9 발견).
const KIND_META: Record<NotificationLogEntry['kind'], { emoji: string; bg: string; href: string }> = {
  expiry: { emoji: '⏰', bg: 'bg-brand-warning/10', href: '/fridge' },
  codi:   { emoji: '👗', bg: 'bg-brand-primary/10', href: '/closet?tab=outfit' },
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
              onClick={() => {
                if (window.confirm('알림을 전부 삭제할까요? 되돌릴 수 없어요.')) clear();
              }}
              className="shrink-0 flex items-center gap-1 h-10 px-2 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Trash2 size={16} />
              전체 삭제
            </button>
          )}
        </div>
      </header>

      <div className="px-5 pt-4 pb-12 flex flex-col gap-2">
        {notifOff && (
          <Link
            href="/settings#notifications"
            className="flex items-center gap-3 rounded-[20px] bg-gray-50 border border-gray-100 px-4 py-3.5 mb-2 active:scale-[0.99] transition-transform"
          >
            <span className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <BellOff size={16} className="text-gray-500" />
            </span>
            <div className="flex-1 min-w-0">
              {/* 설정 화면(NotificationSettings.tsx)과 같은 표현("차단") 사용 —
                  예전엔 여기만 "꺼져 있어요"라 같은 상태를 두 화면이 다른 말로
                  불러 서로 다른 문제인 줄 알았다는 지적(검토단 C9) */}
              <p className="text-sm font-semibold text-gray-800">알림이 차단됐어요</p>
              <p className="text-xs text-gray-500 mt-0.5">탭해서 네모아 알림 설정으로 이동</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </Link>
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
              <Link
                key={entry.id}
                href={meta.href}
                className="flex items-start gap-3 rounded-[20px] px-4 py-3.5 bg-white ring-1 ring-gray-100 active:scale-[0.99] transition-transform"
              >
                <span className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center shrink-0 text-base`} aria-hidden>
                  {meta.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  {/* 아이콘이 이미 종류를 나타내므로 제목의 이모지는 지운다 —
                      한 카드에 같은 그림이 두 번 나와 좁은 화면에서 가장 중요한
                      정보(개수)가 밀려 잘리던 문제(검토단 C9). 제목은 줄바꿈
                      허용(line-clamp-2)해서 숫자가 안 잘리게. */}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{entry.title.replace(/^\S+\s/, '')}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.body}</p>
                  <p className="text-[11px] text-gray-400 tabular-nums mt-1">{formatWhen(entry.createdAt)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
