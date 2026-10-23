'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Sparkles, Sun, Moon, Sunrise, Utensils, type LucideIcon } from 'lucide-react';
import type { CartItem } from '@/types';
import { fetchWeather, type WeatherSnapshot } from '@/lib/weather';
import { useWearLog } from '@/lib/wearLog';
import { useCookLog } from '@/lib/recipeCookLog';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import { useShoppingList } from '@/lib/shoppingList';
import { pickDailyMessage, type DailyMessage } from '@/lib/dailyMessage';
import { getDaypart, greetingText, type Daypart } from '@/lib/daypart';

/**
 * 홈 최상단 Hero 영역.
 * 기존 작은 DailyMessage 배너를 "시선 잡는 메인 카드"로 격상.
 *
 * 디자인 원칙:
 *  - urgent → 브랜드 경고 색 강조
 *  - insight → 브랜드 primary 색 강조
 *  - gentle  → 은은한 그라디언트
 * 모두 본문 텍스트 크게, CTA 크게, 화이트 스페이스 넉넉.
 */

const TONE = {
  urgent: {
    accent:  'text-brand-primary',
    cta:     'bg-brand-primary text-white',
    chip:    'bg-brand-primary/10 text-brand-primary',
    iconBg:  'bg-brand-primary/10 text-brand-primary',
    cardBg:  'bg-gradient-to-br from-brand-primary/8 via-white to-white',
  },
  insight: {
    accent:  'text-brand-primary',
    cta:     'bg-brand-primary text-white',
    chip:    'bg-brand-primary/10 text-brand-primary',
    iconBg:  'bg-brand-primary/10 text-brand-primary',
    cardBg:  'bg-gradient-to-br from-brand-primary/8 via-white to-white',
  },
  gentle: {
    accent:  'text-brand-ink',
    cta:     'bg-brand-ink text-white',
    chip:    'bg-gray-100 text-brand-ink',
    iconBg:  'bg-gray-100 text-brand-ink',
    cardBg:  'bg-white',
  },
} as const;

/** 시간대별 아이콘 — 구간은 lib/daypart 단일 소스 */
const DAYPART_ICON: Record<Daypart, LucideIcon> = {
  dawn:      Moon,
  morning:   Sunrise,
  noon:      Utensils,
  afternoon: Sun,
  evening:   Sun,
  night:     Moon,
};

interface DiscardRecord { name: string; category: string; date: string; }

export default function HeroMessage({
  items, discardHistory = [], onMessage,
}: {
  items: CartItem[];
  discardHistory?: DiscardRecord[];
  /** 이 홈 방문에서 히어로가 어떤 메시지를 뽑았는지 부모에 보고 — 부모가
   *  driverName을 하단 위젯 excludeNames로 넘겨 같은 품목 중복 노출을 막는다(P1-51). */
  onMessage?: (msg: DailyMessage) => void;
}) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);
  const { log: wearLog } = useWearLog();
  const { log: cookLog } = useCookLog();
  const { favorites }    = useRecipeFavorites();
  const { list: shopping } = useShoppingList();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => { if (!cancelled && w) setWeather(w); })
      .catch(() => { /* weather 없이도 동작 */ });
    return () => { cancelled = true; };
  }, []);

  // 시간·localStorage 의존 값은 마운트 후에만 — SSR/CSR 텍스트 불일치(React #418) 방지 (P0-6)
  const PLACEHOLDER: DailyMessage = { text: '네모아가 오늘 하루를 살펴보고 있어요', priority: 'gentle' };
  const msg  = mounted
    ? pickDailyMessage(items, weather, wearLog, cookLog, favorites, shopping.length, discardHistory)
    : PLACEHOLDER;

  useEffect(() => {
    if (mounted) onMessage?.(msg);
    // msg는 매 렌더 새 객체라 참조 비교 대신 내용으로 변경 여부를 판단한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, msg.text, msg.driverName]);

  const tone = TONE[msg.priority];
  const greetingLabel = mounted ? greetingText(getDaypart()) : '';

  // priority별 대표 아이콘 (이모지 대체)
  const HeroIcon: LucideIcon =
    msg.priority === 'urgent'  ? AlertTriangle :
    msg.priority === 'insight' ? Sparkles :
    mounted                    ? DAYPART_ICON[getDaypart()] :
                                 Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`rounded-card ${tone.cardBg} px-[27px] py-[27px] relative overflow-hidden`}
      style={{ boxShadow: '0 8px 24px -12px rgba(31, 31, 46, 0.12), 0 2px 6px -2px rgba(31, 31, 46, 0.04)' }}
    >
      {/*
       * 재검토(비판 모드, 현재 라운드 실측) P0-51 — 워터마크 크기(w-24
       * h-24)·카드 패딩(px-6 py-6)·배지 여백(pr-12)이 전부 rem 기반이라
       * 루트 폰트가 커지면(OS 글자 확대, P1-48 이후 112.5% 기준에서 더
       * 확대) 375px 고정 뷰포트 안에서 비례 없이 다 같이 커졌다 — 루트
       * 27px 실측에서 워터마크가 162px까지 부풀어 헤드라인 영역을
       * 침범하고, 패딩만으로 폭의 1/3을 먹어 "제주 감귤 주스..." 같은
       * 평범한 문장이 7~8줄로 깨지며 카드가 첫 화면을 거의 다 차지했다.
       * 장식 치수(워터마크·아이콘 배지·카드 여백·배지 예약폭·버튼
       * 패딩)만 고정 px로 바꿔 확대를 따라가지 않게 하고, 실제 읽는
       * 텍스트(헤드라인·인사말·CTA 라벨)는 그대로 rem으로 둬 OS 글자
       * 확대 자체는 계속 작동하게 한다(완전한 해소가 아니라 가장 심한
       * 이 배너만 — 같은 패턴이 전역 151곳에 더 있다는 건 P2-28 소관).
       */}
      <div className={`absolute -right-[13.5px] -top-[13.5px] w-[108px] h-[108px] rounded-3xl ${tone.iconBg} opacity-40 flex items-center justify-center`}>
        <HeroIcon size={56} strokeWidth={1.5} aria-hidden />
      </div>

      <div className="relative">
        <div className="flex items-center gap-[8px] mb-[8px]">
          <motion.span
            key={msg.priority}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className={`w-[40.5px] h-[40.5px] rounded-2xl shrink-0 flex items-center justify-center ${tone.iconBg}`}
          >
            <HeroIcon size={18} strokeWidth={2.2} aria-hidden />
          </motion.span>
          {greetingLabel && (
            <span className={`text-xs font-bold ${tone.accent} tracking-wide`}>
              {greetingLabel}
            </span>
          )}
          {/* '주의' 배지 제거 — 인사말 옆 위협 배지는 노이즈. 급함은 본문·색으로 전달 (P2-4) */}
        </div>
        <p className="text-base font-bold text-brand-ink leading-snug pr-[54px] mb-[22.5px]">
          {msg.text}
        </p>

        {msg.cta && (
          // 재발견(P0-80) — 예전엔 paletteQuery가 있으면 href를 버리고
          // 명령 팔레트를 여는 분기가 따로 있었다. 팔레트는 매칭 방향이
          // 반대라 "레시피 찾기"를 눌러도 레시피가 0건으로 나오고, 만료
          // 판정도 안 해서 상한 품목에 레시피를 권하는 사고(P0-30 재발)로
          // 이어졌다. 이제 CTA는 href로만 이동한다.
          <Link
            href={msg.cta.href}
            className={`inline-flex items-center gap-[6px] ${tone.cta} rounded-full pl-[22.5px] pr-[18px] py-[11.25px] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all`}
          >
            <span>{msg.cta.label}</span>
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
