'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useModalA11y } from '@/lib/useModalA11y';

interface ResetConfirmSheetProps {
  open:    boolean;
  onClose: () => void;
  /** 백업 파일을 다운로드하고 파일명을 반환. 실패하면 null. */
  onDownloadBackup: () => string | null;
  /** 실제 초기화 실행. backedUp=false면 백업 없이 지운 경우. */
  onConfirmReset: (backedUp: boolean, filename: string | null) => void;
}

type Step = 'choice' | 'confirmBackup' | 'confirmNoBackup';

/**
 * 재검토(C3 실측) P1 — "전체 초기화"가 confirm() 두 번으로, 백업
 * 없이 지우는 선택지가 아예 없었다. 공용 PC·중고 양도 전 기기에서는
 * "지우려고 눌렀는데 가족 이름·알레르기·얼굴 사진이 담긴 평문 파일이
 * 새로 생겨 Downloads에 남는 것" 자체가 삭제가 아니라 유출이다. 백업을
 * 기본값(권장)으로 유지하되, "백업 없이 바로 삭제"를 동등한 선택지로
 * 노출하고, 백업 경로를 고르면 그 파일에 무엇이 들어있는지 삭제 직전에
 * 한 번 더 보여준다.
 */
export default function ResetConfirmSheet({ open, onClose, onDownloadBackup, onConfirmReset }: ResetConfirmSheetProps) {
  useModalA11y(onClose, open);
  const [step, setStep]         = useState<Step>('choice');
  const [filename, setFilename] = useState<string | null>(null);
  const [waiting, setWaiting]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  if (!open) return null;

  function close() {
    setStep('choice');
    setFilename(null);
    setWaiting(false);
    setError(null);
    onClose();
  }

  async function handlePickBackup() {
    setError(null);
    const name = onDownloadBackup();
    if (!name) {
      setError('백업 파일을 만들지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    setFilename(name);
    setWaiting(true);
    // 다운로드 API는 "실제 저장 완료" 신호가 없어, 브라우저가 처리할
    // 최소한의 틈만 보장한다(기존 handleReset과 동일한 제약·근거).
    await new Promise((resolve) => setTimeout(resolve, 800));
    setWaiting(false);
    setStep('confirmBackup');
  }

  function handleFinalBackup() {
    onConfirmReset(true, filename);
    close();
  }

  function handleFinalNoBackup() {
    onConfirmReset(false, null);
    close();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end justify-center"
        onClick={close}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="전체 초기화"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{ y: 60,    opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] px-6 pt-6 pb-10"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <button
            onClick={close}
            aria-label="닫기"
            className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>

          {step === 'choice' && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-brand-warning" />
                <h2 className="text-base font-bold text-gray-900">전체 초기화</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                냉장고·옷장·가족 프로필(이름·나이·알레르기·얼굴 사진)·착용·조리 기록까지 이 기기의 모든 데이터를 지워요. 되돌릴 수 없어요.
              </p>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handlePickBackup}
                  disabled={waiting}
                  className="w-full py-3.5 rounded-2xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {waiting ? '백업 파일 받는 중…' : '백업 후 초기화 (권장)'}
                </button>
                <button
                  onClick={() => setStep('confirmNoBackup')}
                  className="w-full py-3 text-xs text-gray-400 hover:text-brand-warning transition-colors"
                >
                  백업 없이 바로 삭제
                </button>
              </div>
            </>
          )}

          {step === 'confirmBackup' && (
            <>
              <h2 className="text-base font-bold text-gray-900">다운로드를 확인해주세요</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                &ldquo;{filename}&rdquo; 다운로드를 시작했어요. 다운로드 폴더(또는 방금 뜬 저장 위치)에서 파일이 실제로 저장된 걸 확인하셨나요?
              </p>
              <p className="text-xs text-caution font-medium mt-2 leading-relaxed">
                이 파일에는 가족 이름·나이·알레르기·얼굴 사진이 암호화 없이 그대로 들어있어요 — 공용 기기라면 확인 후 파일을 지우거나 안전한 곳으로 옮겨주세요.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handleFinalBackup}
                  className="w-full py-3.5 rounded-2xl bg-brand-warning text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  확인했어요, 초기화 진행
                </button>
                <button
                  onClick={close}
                  className="w-full py-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {step === 'confirmNoBackup' && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-brand-warning" />
                <h2 className="text-base font-bold text-gray-900">백업 없이 바로 삭제할까요?</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                복원할 방법이 전혀 없어요. 대신 가족 이름·알레르기·얼굴 사진이 담긴 파일을 이 기기에 새로 남기지 않아요 — 공용 PC나 넘길 기기에서 지울 땐 이 쪽을 권해요.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handleFinalNoBackup}
                  className="w-full py-3.5 rounded-2xl bg-brand-warning text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  네, 백업 없이 전부 삭제
                </button>
                <button
                  onClick={() => setStep('choice')}
                  className="w-full py-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
