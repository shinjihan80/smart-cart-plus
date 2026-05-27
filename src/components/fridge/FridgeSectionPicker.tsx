'use client';

/**
 * FridgeSectionPicker — 보관 위치 선택 + AI 추천 버튼 (Phase 8.0 Step 5)
 *
 * 사용자가 보유한 냉장고 모델의 칸 목록 중 하나를 고를 수 있는 드롭다운.
 * 초기값은 `recommendFridgeSection`(룰 기반). "✨ AI 추천" 버튼으로
 * `/api/agents/fridge-section-agent` 호출 → 결과 적용 + 한 줄 사유 표시.
 *
 * AI 호출은 `useAiQuota`의 `fridgeSection` 한도(일 10회) 안에서만 가능.
 */

import { useMemo, useState } from 'react';
import { FRIDGE_SECTION_META, recommendFridgeSection } from '@/lib/fridgeSection';
import { FRIDGE_MODELS } from '@/lib/fridgeModel';
import { useFridgeModel } from '@/lib/useFridgeModel';
import { useAiQuota } from '@/lib/aiQuota';
import type { FoodCategory, FridgeSection, StorageType } from '@/types';

interface Props {
  itemName:     string;
  foodCategory: FoodCategory;
  storageType:  StorageType;
  value:        FridgeSection | undefined;
  onChange:     (section: FridgeSection) => void;
}

export default function FridgeSectionPicker({
  itemName, foodCategory, storageType, value, onChange,
}: Props) {
  const [modelId] = useFridgeModel();
  const { canUse, consume, remaining } = useAiQuota();

  const cells = FRIDGE_MODELS[modelId].cells;
  const options = useMemo(() => cells.map((c) => c.section), [cells]);

  // 초기 추천: 모델에 있는 룰 기반 값 또는 첫 칸
  const ruleBased = useMemo(() => {
    const rule = recommendFridgeSection({ name: itemName, foodCategory, storageType });
    return options.includes(rule) ? rule : options[0];
  }, [itemName, foodCategory, storageType, options]);

  const current = value && options.includes(value) ? value : ruleBased;
  const [loading,  setLoading]  = useState(false);
  const [reason,   setReason]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function handleAiRecommend() {
    if (!canUse('fridgeSection')) {
      setError('오늘 AI 보관 위치 추천 무료 사용량을 모두 썼어요. 자정 이후 다시 이용 가능해요.');
      return;
    }
    setLoading(true);
    setError(null);
    setReason(null);
    try {
      const res = await fetch('/api/agents/fridge-section-agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name: itemName,
          foodCategory,
          storageType,
          modelCells: options,
        }),
      });
      const data = (await res.json()) as { section?: FridgeSection; reason?: string; error?: string };
      if (data.error || !data.section) {
        setError(data.error ?? 'AI 추천을 가져오지 못했어요.');
        return;
      }
      // 성공 시에만 쿼터 소진
      consume('fridgeSection');
      onChange(data.section);
      setReason(data.reason ?? null);
    } catch {
      setError('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const remainingCount = remaining('fridgeSection');

  return (
    <div className="flex flex-col gap-1 col-span-2">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-gray-500 font-medium">보관 위치</span>
        <button
          type="button"
          onClick={handleAiRecommend}
          disabled={loading || remainingCount <= 0}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary disabled:opacity-40 hover:bg-brand-primary/20 transition-colors"
          aria-label="AI로 보관 위치 추천 받기"
        >
          {loading ? '추천 중…' : `✨ AI 추천 (${isFinite(remainingCount) ? remainingCount : '∞'})`}
        </button>
      </div>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as FridgeSection)}
        className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
      >
        {options.map((id) => {
          const meta = FRIDGE_SECTION_META[id];
          return (
            <option key={id} value={id}>
              {meta.emoji} {meta.label}
            </option>
          );
        })}
      </select>
      {reason && (
        <p className="text-[10px] text-brand-primary/80 leading-snug mt-0.5">💡 {reason}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500 leading-snug mt-0.5">{error}</p>
      )}
    </div>
  );
}
