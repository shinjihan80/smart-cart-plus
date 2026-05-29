'use client';

import { useCallback } from 'react';
import { usePersistedState } from '@/lib/usePersistedState';
import {
  DEFAULT_WARDROBE_MODEL,
  isWardrobeModelId,
  type WardrobeModelId,
  DEFAULT_WARDROBE_CONFIG,
  isValidWardrobeConfig,
  type WardrobeConfig,
} from '@/lib/wardrobeModel';

export interface WardrobeInstance {
  id:      string;
  name:    string;
  emoji?:  string;
  modelId: WardrobeModelId;
  config?: WardrobeConfig;
}

function isValidInstance(v: unknown): v is WardrobeInstance {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return false;
  if (!isWardrobeModelId(o.modelId)) return false;
  if (o.config !== undefined && !isValidWardrobeConfig(o.config)) return false;
  return true;
}

export const DEFAULT_WARDROBE_INSTANCE: WardrobeInstance = {
  id: 'wardrobe-1', name: '옷장 1', emoji: '👔', modelId: DEFAULT_WARDROBE_MODEL,
  config: DEFAULT_WARDROBE_CONFIG,
};

export function useWardrobeInstances() {
  const [instances, setInstances] = usePersistedState<WardrobeInstance[]>(
    'nemoa-wardrobe-instances',
    [DEFAULT_WARDROBE_INSTANCE],
    (raw) => (Array.isArray(raw) && raw.length > 0 && raw.every(isValidInstance) ? raw : null),
  );

  const [activeId, setActiveId] = usePersistedState<string>(
    'nemoa-wardrobe-active-id',
    DEFAULT_WARDROBE_INSTANCE.id,
    (raw) => (typeof raw === 'string' ? raw : null),
  );

  const safeActiveId = instances.some((i) => i.id === activeId)
    ? activeId
    : (instances[0]?.id ?? DEFAULT_WARDROBE_INSTANCE.id);

  const addInstance = useCallback(() => {
    const newId = `wardrobe-${Date.now()}`;
    const newName = `옷장 ${instances.length + 1}`;
    setInstances((prev) => [...prev, { id: newId, name: newName, emoji: '👔', modelId: DEFAULT_WARDROBE_MODEL, config: DEFAULT_WARDROBE_CONFIG }]);
    setActiveId(newId);
  }, [instances, setInstances, setActiveId]);

  const removeInstance = useCallback((id: string) => {
    if (instances.length <= 1) return;
    const remaining = instances.filter((i) => i.id !== id);
    setInstances(remaining);
    if (safeActiveId === id) setActiveId(remaining[0].id);
  }, [instances, safeActiveId, setInstances, setActiveId]);

  const updateModelId = useCallback((id: string, modelId: WardrobeModelId) => {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, modelId } : i)));
  }, [setInstances]);

  const updateConfig = useCallback((id: string, config: WardrobeConfig) => {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, config } : i)));
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
    updateConfig,
    renameInstance,
    updateEmoji,
  };
}
