'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseRecipeSeconds, recipeGradient, SEASON_EMOJI, RECIPES, recipeDietary, DIETARY_BADGE, type Recipe } from '@/lib/recipes';
import { estimateRecipeNutrition } from '@/lib/nutritionAnalysis';
import { useShoppingList } from '@/lib/shoppingList';
import { useCookLog } from '@/lib/recipeCookLog';
import { useModalA11y } from '@/lib/useModalA11y';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { haptic } from '@/lib/haptics';
import { playChime } from '@/lib/chime';

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

export default function RecipeDetailModal({
  recipe, matchedItems = [], isFavorite, onToggleFavorite, onClose,
}: RecipeDetailModalProps) {
  useModalA11y(onClose);
  const { showToast } = useToast();
  // 쇼핑 리스트
  const { has: inShopping, add: addToShopping } = useShoppingList();
  // 조리 로그
  const { getEntry: getCookEntry, markCooked, getCoCookedWith } = useCookLog();
  const cook = getCookEntry(recipe.id);
  const coCooked = getCoCookedWith(recipe.id, 3)
    .map((co) => {
      const r = RECIPES.find((x) => x.id === co.id);
      return r ? { recipe: r, count: co.count } : null;
    })
    .filter((x): x is { recipe: Recipe; count: number } => x !== null);

  const season = currentSeasonByMonth();
  const isSeasonRecipe = !!recipe.seasons?.includes(season);
  const seasonalKeywords = useMemo(
    () => new Set(recipe.keywords.filter((kw) => isSeasonalProduce(kw, season))),
    [recipe.keywords, season],
  );

  // 부족 재료 = 레시피 키워드 - 매칭된 이름에 포함된 키워드
  const missingKeywords = useMemo(() => {
    const matchedHit = (kw: string) => matchedItems.some((name) => name.includes(kw));
    return recipe.keywords.filter((kw) => !matchedHit(kw));
  }, [recipe.keywords, matchedItems]);

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
        haptic('success');
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
          role="dialog"
          aria-modal="true"
          aria-label={`${recipe.name} 레시피 상세`}
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

          <div className={`rounded-[28px] bg-gradient-to-br ${recipeGradient(recipe)} px-5 py-5 mb-4 flex items-center gap-4 pr-20 overflow-hidden`}>
            <motion.div
              key={recipe.id}
              initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 4px 20px -6px rgba(0,0,0,0.08)' }}
            >
              <span className="text-4xl">{recipe.emoji}</span>
            </motion.div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{recipe.name}</h2>
              {recipe.blurb && (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{recipe.blurb}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/80 text-gray-600 font-medium">
                  ⏱ {recipe.time}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/80 text-brand-primary font-medium">
                  {recipe.difficulty}
                </span>
                {isSeasonRecipe && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-brand-primary font-semibold"
                    title={`${season}철 추천 레시피 — 제철 재료로 가장 맛있어요`}
                  >
                    {SEASON_EMOJI[season]} {season}철
                  </span>
                )}
                {(() => {
                  const d = recipeDietary(recipe);
                  return d ? (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 text-brand-success font-semibold"
                      title={`${DIETARY_BADGE[d].label} 가능한 레시피`}
                    >
                      {DIETARY_BADGE[d].emoji} {DIETARY_BADGE[d].label}
                    </span>
                  ) : null;
                })()}
                {recipe.tags?.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {matchedItems.length > 0 && (
            <div className="bg-brand-success/5 border border-brand-success/15 rounded-2xl px-3 py-2.5 mb-3">
              <p className="text-[11px] text-gray-500 mb-1">보유 중인 재료</p>
              <div className="flex gap-1 flex-wrap">
                {matchedItems.map((name) => {
                  const inSeason = isSeasonalProduce(name, season);
                  return (
                    <span
                      key={name}
                      className={`text-[11px] px-2 py-0.5 rounded-full bg-white border font-medium ${
                        inSeason
                          ? 'border-brand-primary/30 text-brand-primary'
                          : 'border-brand-success/20 text-brand-success'
                      }`}
                    >
                      ✓ {name}
                      {inSeason && <span className="ml-1">{SEASON_EMOJI[season]}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {missingKeywords.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-gray-500">부족한 재료 · 탭하면 쇼핑 리스트에 추가</p>
                {missingKeywords.filter((kw) => !inShopping(kw)).length >= 2 && (
                  <button
                    onClick={() => {
                      const toAdd = missingKeywords.filter((kw) => !inShopping(kw));
                      toAdd.forEach((kw) => addToShopping(kw, recipe.name));
                      haptic('toggle');
                      showToast(`${toAdd.length}개 모두 쇼핑 리스트에 담았어요.`);
                    }}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-600 text-white hover:opacity-90 active:scale-95 transition-all"
                  >
                    모두 담기
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {missingKeywords.map((kw) => {
                  const added = inShopping(kw);
                  const inSeason = seasonalKeywords.has(kw);
                  return (
                    <button
                      key={kw}
                      onClick={() => addToShopping(kw, recipe.name)}
                      disabled={added}
                      title={inSeason ? `${season}철 제철 재료` : undefined}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        added
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : inSeason
                            ? 'bg-white border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 active:scale-95'
                            : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 active:scale-95'
                      }`}
                    >
                      {added ? `✓ ${kw}` : `+ ${kw}`}
                      {inSeason && !added && <span className="ml-1">{SEASON_EMOJI[season]}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(() => {
            const n = estimateRecipeNutrition(recipe.keywords);
            if (n.calories === 0) return null;
            return (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 mb-4">
                <p className="text-[11px] text-gray-500 mb-1">1인분 영양 추정</p>
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-700 tabular-nums"><span className="text-gray-400">kcal</span> {n.calories}</span>
                  <span className="text-gray-700 tabular-nums"><span className="text-gray-400">단백</span> {n.protein}g</span>
                  <span className="text-gray-700 tabular-nums"><span className="text-gray-400">지방</span> {n.fat}g</span>
                  <span className="text-gray-700 tabular-nums"><span className="text-gray-400">탄수</span> {n.carbs}g</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">재료 카테고리 평균 기반 대략치</p>
              </div>
            );
          })()}

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
                <p className="text-[11px] text-gray-500">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium">조리 순서</p>
              <button
                onClick={async () => {
                  const text = [
                    `${recipe.name} (${recipe.time} · ${recipe.difficulty})`,
                    '',
                    '재료:',
                    ...recipe.keywords.map((k) => `- ${k}`),
                    '',
                    '조리 순서:',
                    ...recipe.steps.map((s, i) => `${i + 1}. ${s}`),
                  ].join('\n');
                  try {
                    await navigator.clipboard.writeText(text);
                    showToast('레시피를 클립보드에 복사했어요.');
                  } catch {
                    showToast('복사에 실패했어요. 권한을 확인해주세요.');
                  }
                }}
                className="text-[11px] font-semibold text-gray-500 hover:text-brand-primary hover:underline"
              >
                📋 레시피 복사
              </button>
            </div>
            <ol className="flex flex-col gap-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {coCooked.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">🍳 같이 만들었던 메뉴</p>
              <div className="flex gap-1.5 flex-wrap">
                {coCooked.map((co) => (
                  <button
                    key={co.recipe.id}
                    onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: co.recipe.id } }))}
                    className="flex items-center gap-1 text-xs pl-1.5 pr-2 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  >
                    <span>{co.recipe.emoji}</span>
                    <span className="font-medium">{co.recipe.name}</span>
                    <span className="text-[10px] text-brand-primary/60 tabular-nums">· {co.count}회</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            // 유사 레시피 — 같은 계절 OR 키워드 겹침 2개+, 자기 자신·coCooked 제외, 최대 3개
            const coIds = new Set(coCooked.map((c) => c.recipe.id));
            const similar = RECIPES.filter((r) => {
              if (r.id === recipe.id || coIds.has(r.id)) return false;
              // 계절 일치
              const sameSeason = recipe.seasons && r.seasons
                && recipe.seasons.some((s) => r.seasons!.includes(s));
              // 키워드 겹침 2개+
              const sharedKw = r.keywords.filter((k) => recipe.keywords.includes(k)).length;
              return sameSeason || sharedKw >= 2;
            })
              // 키워드 겹침 많은 것 우선
              .sort((a, b) => {
                const as = a.keywords.filter((k) => recipe.keywords.includes(k)).length;
                const bs = b.keywords.filter((k) => recipe.keywords.includes(k)).length;
                return bs - as;
              })
              .slice(0, 3);
            if (similar.length === 0) return null;
            return (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">🔗 비슷한 레시피</p>
                <div className="flex gap-1.5 flex-wrap">
                  {similar.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: r.id } }))}
                      className="flex items-center gap-1 text-xs pl-1.5 pr-2 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span>{r.emoji}</span>
                      <span className="font-medium">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => {
              markCooked(recipe.id);
              haptic('toggle');
              showToast(`"${recipe.name}" ${cook.count + 1}번째 조리 기록 완료 🍲`);
              onClose();
            }}
            className="w-full mt-6 rounded-2xl bg-brand-primary text-white text-sm font-semibold py-3 hover:opacity-90 active:scale-95 transition-all"
          >
            {cook.count > 0 ? `만들었어요 (${cook.count + 1}회차)` : '좋아요, 만들어볼게요'}
          </button>

          <div className="flex items-center gap-1.5 justify-center mt-2">
            <button
              onClick={() => {
                const y = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
                markCooked(recipe.id, y);
                haptic('tap');
                showToast(`"${recipe.name}" 어제(${y}) 조리로 기록했어요.`);
              }}
              className="text-[11px] text-gray-500 hover:text-brand-primary hover:underline"
            >
              어제 만들었어요
            </button>
            <span className="text-[11px] text-gray-200">·</span>
            <label className="text-[11px] text-gray-500 hover:text-brand-primary cursor-pointer">
              다른 날짜
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  if (!e.target.value) return;
                  markCooked(recipe.id, e.target.value);
                  haptic('tap');
                  showToast(`"${recipe.name}" ${e.target.value} 조리로 기록했어요.`);
                }}
                className="sr-only"
              />
            </label>
          </div>

          {cook.count > 0 && (
            <p className="text-[11px] text-gray-400 text-center mt-2">
              지금까지 {cook.count}번 만들었어요{cook.lastCooked ? ` · 마지막 ${cook.lastCooked}` : ''}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
