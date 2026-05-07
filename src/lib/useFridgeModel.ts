'use client';

import { usePersistedState } from '@/lib/usePersistedState';
import {
  DEFAULT_FRIDGE_MODEL,
  isFridgeModelId,
  type FridgeModelId,
} from '@/lib/fridgeModel';

const STORAGE_KEY = 'nemoa-fridge-model';

/**
 * 사용자가 선택한 냉장고 모델을 localStorage에 영속화하는 훅.
 * 잘못된 값이 저장돼 있으면 default로 폴백.
 */
export function useFridgeModel(): [FridgeModelId, React.Dispatch<React.SetStateAction<FridgeModelId>>] {
  return usePersistedState<FridgeModelId>(
    STORAGE_KEY,
    DEFAULT_FRIDGE_MODEL,
    (raw) => (isFridgeModelId(raw) ? raw : null),
  );
}
