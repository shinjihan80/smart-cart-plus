'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseRecipeSeconds, type Recipe } from '@/lib/recipes';

interface RecipeDetailModalProps {
  recipe:           Recipe;
  matchedItems?:    string[];
  isFavorite:       boolean;
  onToggleFavorite: () => void;
  onClose:          () => void;
}

function formatMMSS(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playChime() {
  try {
    // 짧은 비프음 — 외부 리소스 없이 Web Audio로 직접 생성
    type AudioCtx = typeof window extends { AudioContext: infer C } ? C : never;
    const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtx }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch { /* 음소거 환경 등 — 조용히 실패 */ }
}

export default function RecipeDetailModal({
  recipe, matchedItems = [], isFavorite, onToggleFavorite, onClose,
}: RecipeDetailModalProps) {
  // 타이머 상태
  const totalSeconds = parseRecipeSeconds(recipe.time);
  const [remaining, setRemaining] = useState<number>(totalSeconds ?? 0);
  const [running, setRunning]     = useState(false);
  const [finished, setFinished]   = useState(false);
  const deadlineRef = useRef<number | null>(null);

  // 새 레시피로 모달이 열리면 초기화
  useEffect(() => {
    setRemaining(totalSeconds ?? 0);
    setRunning(false);
    setFinished(false);
    deadlineRef.current = null;
  }, [recipe.id, totalSeconds]);

  // 타이머 틱
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (!deadlineRef.current) return;
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        setFinished(true);
        navigator.vibrate?.([200, 80, 200]);
        playChime();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  function handleStartPause() {
    if (finished || remaining === 0) {
      setRemaining(totalSeconds ?? 0);
      setFinished(false);
      deadlineRef.current = Date.now() + (totalSeconds ?? 0) * 1000;
      setRunning(true);
      return;
    }
    if (running) {
      setRunning(false);
      deadlineRef.current = null;
    } else {
      deadlineRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }

  function handleReset() {
    setRunning(false);
    setFinished(false);
    setRemaining(totalSeconds ?? 0);
    deadlineRef.current = null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-6 py-7 max-h-[85vh] overflow-y-auto"
          style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-brand-warning/10 text-brand-warning'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
              }`}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4 pr-16">
            <span className="text-5xl shrink-0">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{recipe.name}</h2>
              {recipe.blurb && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{recipe.blurb}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  ⏱ {recipe.time}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium">
                  {recipe.difficulty}
                </span>
                {recipe.tags?.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {matchedItems.length > 0 && (
            <div className="bg-brand-success/5 border border-brand-success/15 rounded-2xl px-3 py-2.5 mb-4">
              <p className="text-[10px] text-gray-500 mb-1">보유 중인 재료</p>
              <div className="flex gap-1 flex-wrap">
                {matchedItems.map((name) => (
                  <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-brand-success/20 text-brand-success font-medium">
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {totalSeconds !== null && totalSeconds > 0 && (
            <div className={`rounded-2xl border px-4 py-3 mb-4 flex items-center gap-3 transition-colors ${
              finished
                ? 'bg-brand-warning/10 border-brand-warning/30'
                : running
                  ? 'bg-brand-primary/10 border-brand-primary/25'
                  : 'bg-gray-50 border-gray-100'
            }`}>
              <span className="text-xl">{finished ? '🔔' : running ? '⏱️' : '⏰'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500">
                  {finished ? '완성 시간이에요!' : running ? '타이머 진행 중' : '조리 타이머'}
                </p>
                <p className={`text-xl font-extrabold tabular-nums leading-tight ${
                  finished ? 'text-brand-warning' : running ? 'text-brand-primary' : 'text-gray-800'
                }`}>
                  {formatMMSS(remaining)}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={handleStartPause}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                    running
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-brand-primary text-white hover:opacity-90'
                  }`}
                >
                  {finished ? '다시 시작' : running ? '일시정지' : '시작'}
                </button>
                {(running || finished || remaining !== totalSeconds) && (
                  <button
                    onClick={handleReset}
                    aria-label="타이머 초기화"
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
                  >
                    ⟳
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] text-gray-400 font-medium mb-2">조리 순서</p>
            <ol className="flex flex-col gap-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 rounded-2xl bg-brand-primary text-white text-sm font-semibold py-3 hover:opacity-90 active:scale-95 transition-all"
          >
            좋아요, 만들어볼게요
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
