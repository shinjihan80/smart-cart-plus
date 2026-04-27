'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { useErrorLog, summarizeErrors } from '@/lib/errorLog';
import { useToast } from '@/context/ToastContext';
import EmojiIcon from '@/components/EmojiIcon';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

export default function ErrorLogCard() {
  const { entries, clear } = useErrorLog();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summarizeErrors(entries, 20));
      showToast('최근 오류 기록을 복사했어요.');
    } catch {
      showToast('복사에 실패했어요. 브라우저 설정을 확인하세요.');
    }
  }

  function handleClear() {
    if (entries.length === 0) {
      showToast('지울 기록이 없어요.');
      return;
    }
    if (!confirm(`오류 기록 ${entries.length}개를 모두 지울까요?`)) return;
    clear();
    showToast('오류 기록을 지웠어요.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.26 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="🩺" size={16} className="text-brand-warning" />
          <span className="text-xs text-gray-400 font-medium">오류 기록</span>
          {entries.length > 0 && (
            <span className="text-sm font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full tabular-nums">
              {entries.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400 leading-relaxed">
              아직 기록된 오류가 없어요. 앱이 건강하게 동작 중이에요.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {entries.slice(0, 10).map((e) => (
                  <li
                    key={e.id}
                    className="text-sm p-2 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-400">
                        {new Date(e.ts).toLocaleString('ko-KR', {
                          month:  '2-digit',
                          day:    '2-digit',
                          hour:   '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs text-gray-400">{e.source ?? '?'}</span>
                    </div>
                    <p className="text-gray-700 break-words leading-relaxed line-clamp-2">
                      {e.message}
                    </p>
                    {e.url && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{e.url}</p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1.5 mt-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Copy size={11} />
                  <span>복사</span>
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={11} />
                  <span>지우기</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                최근 오류 10건 표시 · 최대 50건까지 로컬 저장 · 서버 전송 안 함
              </p>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
