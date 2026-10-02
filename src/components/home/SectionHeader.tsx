'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SectionHeader — 커머스 앱 스타일 (롯데면세점·SSG·인터파크 참고)
 *
 * 설계 원칙
 *  - 이모지·톤·부제 제거 → 단일 제목 + (옵션) 더보기 링크
 *  - 제목은 text-base font-bold, 절제된 색감
 *  - 섹션 구분은 제목만으로 충분, 과도한 시각적 장치 배제
 *
 * 변형
 *  - actionHref → "더보기 →" 링크
 *  - collapsible → 접기/펼치기 토글
 *
 * actionLabel 원칙(P1-55)
 *  - actionHref/actionLabel은 **섹션 전체의 범위**를 대표해야 한다 —
 *    자식 카드 중 하나만 가리키거나, 섹션 제목이 말하는 것과 다른
 *    곳으로 가면 안 된다("오늘의 나" 제목인데 액션은 "전체 레시피"로
 *    /fridge에 가는 식의 모순, C9·E1 "계약 위반" 사례).
 *  - 자식 카드들이 각자 이미 개별 링크/액션을 갖고 있다면, 섹션
 *    레벨에는 actionHref를 아예 주지 않는 편이 낫다 — 어설픈 대표
 *    액션 하나보다 "없음"이 더 정직하다.
 */

interface SectionHeaderProps {
  title:        string;        // 섹션 이름
  actionHref?:  string;        // "더보기 →" 링크 (있을 때만 노출)
  actionLabel?: string;        // 기본 "더보기"
  children:     ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function SectionHeader({
  title,
  actionHref,
  actionLabel = '더보기',
  children,
  collapsible = false,
  defaultOpen = true,
}: SectionHeaderProps) {
  const [open, setOpen] = useState(defaultOpen);

  const titleNode = (
    <h2 className="text-base font-bold text-gray-900 tracking-tight">
      {title}
    </h2>
  );

  const actionNode = actionHref ? (
    <Link
      href={actionHref}
      className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
    >
      <span>{actionLabel}</span>
      <ChevronRight size={12} />
    </Link>
  ) : null;

  if (!collapsible) {
    return (
      <section className="mt-8 first:mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          {titleNode}
          {actionNode}
        </div>
        <div className="flex flex-col gap-3">{children}</div>
      </section>
    );
  }

  return (
    <section className="mt-8 first:mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3 px-1"
        aria-expanded={open}
      >
        {titleNode}
        <div className="flex items-center gap-0.5 text-xs text-gray-500">
          <span>{open ? '접기' : '펼치기'}</span>
          <ChevronDown
            size={12}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
