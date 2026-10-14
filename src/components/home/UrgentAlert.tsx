'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { CartItem } from '@/types';
import { useDismissedAlerts } from '@/lib/useDismissedAlerts';
import { selectExpiring } from '@/lib/expirySelectors';
import { groupExpiryPhrase } from '@/lib/expiryThresholds';
import { useToast } from '@/context/ToastContext';
import { addNotificationLogEntry } from '@/lib/notificationLog';
import { todayLocalStr } from '@/lib/dateMath';
import { springTransition } from './shared';
import { NameChips } from '@/components/ui/NameChips';

export default function UrgentAlert({ items }: { items: CartItem[] }) {
  const { isDismissedToday, dismiss, restore } = useDismissedAlerts();
  const { showToast } = useToast();

  // 이미 기한이 지난 항목은 "오늘까지 먹어야 할"에서 제외 — 상한 걸 먹으라고
  // 권하던 버그(P0-30). 지난 항목은 히어로 메시지(dailyMessage.ts)가 별도 문구로
  // 안내한다. 히어로가 headline으로 짚은 품목을 여기서도 빼던 적이 있었는데
  // (P1-51), 유일한 긴급 품목이 히어로에 뽑히면 "오늘 할 일" 액션 존에서
  // 그 품목이 통째로 사라지는 더 심각한 문제였다(P1-67, C1·C8 독립 지적) —
  // 배너 블라인드니스가 걸리는 히어로 안에만 정보가 있으면 사실상 안 보인
  // 것과 같다. 액션 존은 중복 노출을 감수하고 항상 전체를 보여준다.
  const urgent = selectExpiring(items).today
    .map((e) => ({ name: e.item.name, dDay: e.dDay }));

  // 집합 문구는 groupExpiryPhrase 하나로만 만든다 — 이 로직이 여기 안에만
  // 지역 구현돼 있던 게 P0-68(P0-53 재발)의 원인이었다: 다른 소비처들은
  // 이 로직을 몰라 EXPIRY_LABEL.today를 그대로 "오늘"로 썼다.
  const headline = urgent.length > 0 ? groupExpiryPhrase(urgent.map((u) => u.dDay)) : '';

  // 재검토(비판 모드) P1-81 — 이 배너가 떴다는 건 "알림함에 남겨둘
  // 가치가 있는 일"이라는 뜻인데, OS 푸시를 안 받은(또는 꺼둔)
  // 사용자는 이 사실이 화면 밖으로 넘어가면 다시 찾을 방법이 없었다.
  // dedupeKey가 날짜를 포함해 하루 1건으로 자동 묶인다(addNotificationLogEntry).
  // 훅은 이른 반환보다 위에서 조건 없이 호출해야 하므로, "오늘 안 보기"로
  // 숨긴 경우에도 알림함 기록 자체는 남긴다(배너를 숨긴 것과 "오늘 실제로
  // 임박 식품이 있었다"는 사실은 별개).
  useEffect(() => {
    if (urgent.length === 0) return;
    addNotificationLogEntry({
      kind: 'urgent',
      title: `${headline} 먹어야 할 식품 ${urgent.length}개`,
      body: urgent.map((u) => u.name).join(', '),
      dedupeKey: `urgent:${todayLocalStr()}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headline, urgent.length]);

  if (isDismissedToday('urgent')) return null;
  if (urgent.length === 0) return null;

  // X만 누르면 어떤 동작인지 글자 설명이 없고(aria-label만), 다시 보는
  // 방법(설정 > 알림 설정 > "오늘 안 보기")도 안내가 안 돼 영구히 사라진
  // 것처럼 느껴졌다(P1-42, C10 발견) — 실제로는 자정에 자동 복구되고
  // 설정에서도 즉시 되살릴 수 있지만, 그 사실이 화면 어디에도 없었다.
  // 앱의 다른 삭제/소진 동작과 똑같이 토스트+되돌리기로 안내.
  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dismiss('urgent');
    showToast('오늘 하루 숨겼어요. 내일 다시 보여요.', () => restore('urgent'));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="relative"
    >
      {/* ✕ 히트 영역을 의사요소(::after inset)로 키우자 바로 옆 ›가
          덮여 "들어가 보기"를 누르면 배너가 숨겨지는 오동작이 났다
          (P1-88, C8 실측 — 오늘 가장 급한 알림을 놓침). ›는 카드 전체가
          이미 Link라 중복 신호였으므로 제거하고, ✕는 flex 형제 칼럼으로
          분리해 실제 44px 폭 레이아웃 공간을 갖게 한다 — 겹침이 구조적으로
          불가능해진다(의사요소 확장 불필요). */}
      <div className="bg-caution/10 border border-caution/20 rounded-panel flex items-stretch overflow-hidden">
        <Link
          href="/fridge"
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 hover:bg-caution/15 transition-colors"
        >
          <span className="w-9 h-9 rounded-xl bg-caution/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} strokeWidth={2.2} className="text-caution" />
          </span>
          <div className="flex-1 min-w-0">
            {/* 헤드라인은 본문 줄(바로 아래, text-sm)보다 작으면 안 된다 —
                본문을 text-sm으로 올린 과거 수정(C1·C4, 오늘 당장 처리할
                유일한 항목이라 홈에서 가장 작은 글자가 되면 안 됨)이 정작
                제목을 text-xs에 그대로 둬 "제목 < 본문" 역전을 새로 만들었다
                (P1-49, E3 발견). 본문은 그대로 두고 제목을 text-sm으로 맞춤
                — bold+경고색은 유지돼 위계는 그대로 살아있음. */}
            <p className="text-sm font-bold text-caution">
              {headline} 먹어야 할 식품 {urgent.length}개
            </p>
            {/* P1-66 — 개수 제한 없이 .join(', ')+truncate(1줄)로 자르면
                긴 목록에서 단어 중간이 잘리고 몇 개가 더 있는지도 안 보였다.
                NameChips는 항목 3개까지 그대로 보여주고 나머지는 "+N"으로. */}
            <p className="text-sm text-gray-500 truncate mt-0.5">
              <NameChips names={urgent.map((u) => u.name)} max={3} />
            </p>
          </div>
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="임박 식품 알림 오늘 안 보기"
          title="오늘 안 보기"
          className="w-11 shrink-0 flex items-center justify-center text-caution/60 hover:text-caution hover:bg-caution/15 transition-colors"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}
