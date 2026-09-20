'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showForcedMilestoneAd } from '@/lib/admob';
import { canShowForcedAd } from '@/lib/adFrequency';

/**
 * 아이템 5개 등록마다(addMilestone.ts) 뜨는 'nemoa:milestone-ad' 이벤트를
 * 듣고, 광고를 바로 띄우는 대신 "광고 보고 계속할까요?" 안내부터 보여준다.
 * 예고 없이 화면을 덮던 이전 방식과 달리 사용자가 실제로 "광고 보기"를
 * 눌러야만 showForcedMilestoneAd()가 호출된다.
 */
export default function MilestoneAdPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onTrigger() {
      // 이벤트 발생 후에도 쿨다운·일일 상한을 다시 확인 — 그 사이 다른
      // 마일스톤(인스턴스 생성 등)이 먼저 광고를 띄웠을 수 있다.
      if (!canShowForcedAd()) return;
      setOpen(true);
    }
    window.addEventListener('nemoa:milestone-ad', onTrigger);
    return () => window.removeEventListener('nemoa:milestone-ad', onTrigger);
  }, []);

  async function handleWatch() {
    setOpen(false);
    await showForcedMilestoneAd();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="w-full max-w-sm rounded-[28px] bg-white p-6 flex flex-col items-center gap-3 text-center"
          >
            <span className="text-4xl" aria-hidden>🎬</span>
            <p className="text-base font-bold text-gray-900">짧은 광고 하나 보고 계속할까요?</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              무료로 계속 이용할 수 있도록 도와줘요. 별도 보상은 없어요.
            </p>
            <button
              onClick={handleWatch}
              className="mt-1 w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
            >
              광고 보기
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              나중에
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
