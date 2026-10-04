'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

interface UsageRow {
  key:   string;
  label: string;
  bytes: number;
}

// 사용자에게 뜻 모를 영어 키(nemoa-wardrobe-instances 등)가 그대로
// 노출돼 백업하러 왔다가 이해를 못 하고 이탈했다(P1-30, C9 발견).
// localStorage에 실제로 쓰이는 nemoa- 키를 전부 한국어로 매핑.
const KEY_LABELS: Record<string, string> = {
  'nemoa-items':                   '식품·의류 아이템',
  'nemoa-archive':                 '아카이브',
  'nemoa-history':                 '정리 내역',
  'nemoa-wear-log':                '착용 로그',
  'nemoa-cook-log':                '조리 로그',
  'nemoa-profiles':                '프로필',
  'nemoa-shopping-list':           '쇼핑 리스트',
  'nemoa-recipe-favorites':        '즐겨찾기 레시피',
  'nemoa-saved-outfits':           '저장된 코디',
  'nemoa-weather-cache':           '날씨 캐시',
  'nemoa-fridge-instances':        '냉장고 구성 정보',
  'nemoa-wardrobe-instances':      '옷장 구성 정보',
  'nemoa-fridge-active-id':        '선택한 냉장고',
  'nemoa-wardrobe-active-id':      '선택한 옷장',
  'nemoa-fridge-model':            '냉장고 모델 설정',
  'nemoa-fridge-model-prompt-pending': '냉장고 모델 안내 대기',
  'nemoa-analytics':               '사용 통계',
  'nemoa-agent-log':               'AI 처리 로그',
  'nemoa-error-log':               '오류 기록',
  'nemoa-notification-log':        '알림 발송 기록',
  'nemoa-reasons-log':             '추천 이유 로그',
  'nemoa-ai-quota':                'AI 사용 한도',
  'nemoa-vision-monthly-quota':    '사진 분석 월간 한도',
  'nemoa-plan':                    '요금제 상태',
  'nemoa-pro-interest':            'Pro 알림 신청 기록',
  'nemoa-waitlist-dismissed':      '출시 알림 닫기 기록',
  'nemoa-waitlist-submitted':      '출시 알림 신청 기록',
  'nemoa-consent-v1':              '약관 동의 기록',
  'nemoa-schema-version':          '데이터 스키마 버전',
  'nemoa-last-backup-at':          '마지막 백업 시각',
  'nemoa-backup-banner-dismissed-at': '백업 안내 닫기 기록',
  'nemoa-restore-just-completed':  '복원 완료 플래그',
  'nemoa-discard-count':           '정리 처리 횟수',
  'nemoa-dismissed-alerts':        '닫은 알림 기록',
  'nemoa-home-recent-search':      '최근 검색어(홈)',
  'nemoa-search-recent':           '최근 검색어',
  'nemoa-palette-recent':          '최근 검색 명령',
  'nemoa-mypage-tab':              '마이페이지 탭 기억',
  'nemoa-mypage-cleanup-open':     '옷장 정리 패널 상태',
  'nemoa-mypage-fridge-open':      '냉장고 패널 상태',
  'nemoa-install-banner-dismissed': '설치 안내 닫기 기록',
  'nemoa-haptic-enabled':          '햅틱 피드백 설정',
  'nemoa-chime-enabled':           '알림음 설정',
  'nemoa-noti':                    '알림 설정',
  'nemoa-noti-checked-date':       '알림 확인 날짜',
  'nemoa-noti-permission':         '알림 권한 상태',
  'nemoa-local-noti-ids':          '예약 알림 ID',
  'nemoa-closet-group':            '옷장 그룹 설정',
  'nemoa-closet-owner':            '옷장 소유자 필터',
  'nemoa-closet-sort':             '옷장 정렬 설정',
  'nemoa-closet-view':             '옷장 보기 설정',
  'nemoa-fridge-group':            '냉장고 그룹 설정',
  'nemoa-fridge-owner':            '냉장고 소유자 필터',
  'nemoa-fridge-sort':             '냉장고 정렬 설정',
  'nemoa-fridge-view':             '냉장고 보기 설정',
  'nemoa-fridge-storage':          '냉장고 보관 위치 설정',
  'nemoa-fridge-seasonal-only':    '제철만 보기 설정',
  'nemoa-outfit-owner':            '코디 소유자 필터',
  'nemoa-partner-clicks':          '파트너 클릭 기록',
  'nemoa-partner-clicks-flush':    '파트너 클릭 전송 기록',
  'nemoa-add-milestone-count':     '등록 마일스톤 기록',
  'nemoa-forced-ad-day':           '광고 노출 기록',
  'nemoa-forced-ad-last-ts':       '광고 노출 시각',
  'nemoa-device-id':               '기기 식별자',
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * localStorage의 nemoa- 키 용량을 측정해 표시.
 * 사용자가 어느 데이터가 차지하는 지 한눈에 보게.
 */
export default function StorageUsage() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const collected: UsageRow[] = [];
    let sum = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.startsWith('nemoa-')) continue;
      const val = localStorage.getItem(key) ?? '';
      // 대략적인 UTF-16 바이트 추정 (1 char ≈ 2 bytes)
      const bytes = new Blob([val]).size;
      if (bytes === 0) continue;
      sum += bytes;
      const label = KEY_LABELS[key] ?? key;
      collected.push({ key, label, bytes });
    }
    collected.sort((a, b) => b.bytes - a.bytes);
    setRows(collected.slice(0, 8));  // 상위 8개만
    setTotal(sum);
  }, []);

  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.bytes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.21 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📦" size={16} className="text-gray-600" />
          <span className="text-xs text-gray-400 font-medium">저장 용량</span>
        </div>
        <span className="text-xs text-gray-500 tabular-nums shrink-0">
          총 {formatBytes(total)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const pct = Math.round((r.bytes / max) * 100);
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600 truncate">{r.label}</span>
                <span className="text-xs text-gray-400 tabular-nums shrink-0">
                  {formatBytes(r.bytes)}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-primary/50"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
        브라우저 localStorage 기준 추정값. 백업 JSON 파일 크기와 유사해요.
      </p>
    </motion.div>
  );
}
