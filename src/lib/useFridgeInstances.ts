'use client';

import { useCallback } from 'react';
import { usePersistedState } from '@/lib/usePersistedState';
import { DEFAULT_FRIDGE_MODEL, isFridgeModelId, type FridgeModelId } from '@/lib/fridgeModel';

export interface FridgeInstance {
  id:      string;
  name:    string;
  emoji?:  string;
  modelId: FridgeModelId;
}

function isValidInstance(v: unknown): v is FridgeInstance {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.name === 'string' && isFridgeModelId(o.modelId);
}

export const DEFAULT_FRIDGE_INSTANCE: FridgeInstance = {
  id: 'fridge-1', name: '냉장고 1', emoji: '🧊', modelId: DEFAULT_FRIDGE_MODEL,
};

export function useFridgeInstances() {
  const [instances, setInstances] = usePersistedState<FridgeInstance[]>(
    'nemoa-fridge-instances',
    [DEFAULT_FRIDGE_INSTANCE],
    (raw) => (Array.isArray(raw) && raw.length > 0 && raw.every(isValidInstance) ? raw : null),
  );

  const [activeId, setActiveId] = usePersistedState<string>(
    'nemoa-fridge-active-id',
    DEFAULT_FRIDGE_INSTANCE.id,
    (raw) => (typeof raw === 'string' ? raw : null),
  );

  // activeId 가 유효하지 않으면 첫 번째 인스턴스로 폴백
  const safeActiveId = instances.some((i) => i.id === activeId)
    ? activeId
    : (instances[0]?.id ?? DEFAULT_FRIDGE_INSTANCE.id);

  const addInstance = useCallback(() => {
    const newId = `fridge-${Date.now()}`;
    const newName = `냉장고 ${instances.length + 1}`;
    setInstances((prev) => [...prev, { id: newId, name: newName, emoji: '🧊', modelId: DEFAULT_FRIDGE_MODEL }]);
    setActiveId(newId);
  }, [instances, setInstances, setActiveId]);

  const removeInstance = useCallback((id: string) => {
    if (instances.length <= 1) return;
    const remaining = instances.filter((i) => i.id !== id);
    setInstances(remaining);
    if (safeActiveId === id) setActiveId(remaining[0].id);
  }, [instances, safeActiveId, setInstances, setActiveId]);

  const updateModelId = useCallback((id: string, modelId: FridgeModelId) => {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, modelId } : i)));
  }, [setInstances]);

  const renameInstance = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i)));
  }, [setInstances]);

  const updateEmoji = useCallback((id: string, emoji: string) => {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, emoji } : i)));
  }, [setInstances]);

  const activeInstance = instances.find((i) => i.id === safeActiveId) ?? instances[0];

  return {
    instances,
    activeId: safeActiveId,
    activeInstance,
    setActiveId,
    addInstance,
    removeInstance,
    updateModelId,
    renameInstance,
    updateEmoji,
  };
}
