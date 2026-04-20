'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CartItem, isFoodItem } from '@/types';
import { mockCartItems } from '@/data/mockData';
import { calcRemainingDays } from '@/components/FoodTags';

const STORAGE_KEY  = 'smart-cart-items';
const DISCARD_KEY  = 'smart-cart-discard-count';
const ARCHIVE_KEY  = 'smart-cart-archive';
const HISTORY_KEY  = 'smart-cart-history';
const SCHEMA_VERSION_KEY = 'smart-cart-schema-version';
const CURRENT_SCHEMA_VERSION = '2'; // 카테고리 세분화 (v1→v2)

interface DiscardRecord {
  name:      string;
  category:  string;
  date:      string;
}

interface CartContextValue {
  items:           CartItem[];
  archived:        CartItem[];
  addItems:        (newItems: CartItem[]) => { added: number; skipped: number };
  updateItem:      (id: string, updates: Partial<CartItem>) => void;
  removeItem:      (id: string) => void;
  undoRemove:      () => void;
  resetData:       () => void;
  archiveExpired:  () => number;
  discardCount:    number;
  discardHistory:  DiscardRecord[];
  /** 백업 복원용 — 카트 상태 전체 교체. 호출 전 유효성 검증은 호출자 책임. */
  restoreAll: (snapshot: {
    items?:          CartItem[];
    archived?:       CartItem[];
    discardCount?:   number;
    discardHistory?: DiscardRecord[];
  }) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]               = useState<CartItem[]>(mockCartItems);
  const [archived, setArchived]         = useState<CartItem[]>([]);
  const [discardCount, setDiscardCount] = useState(0);
  const [hydrated, setHydrated]         = useState(false);
  const [lastRemoved, setLastRemoved]   = useState<{ item: CartItem; index: number } | null>(null);
  const [discardHistory, setDiscardHistory] = useState<DiscardRecord[]>([]);

  // 클라이언트 마운트 후 localStorage 복원 (+ 데이터 마이그레이션)
  useEffect(() => {
    try {
      // 스키마 버전 불일치 시 자동 초기화
      const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
      if (storedVersion !== CURRENT_SCHEMA_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ARCHIVE_KEY);
        localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
        setHydrated(true);
        return;
      }

      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        const parsed = JSON.parse(storedItems) as CartItem[];
        // 마이그레이션: 구 버전 데이터 보정
        const migrated = parsed.map((item) => {
          const cat = item.category as string;
          if (cat === '식품' && !('foodCategory' in item)) {
            return Object.assign({}, item, { foodCategory: '기타 식품' }) as CartItem;
          }
          if (cat === '의류') return Object.assign({}, item, { category: '상의' }) as CartItem;
          if (cat === '액세서리') return Object.assign({}, item, { category: '주얼리' }) as CartItem;
          return item;
        });
        // 유효성 검증: 모든 아이템에 필수 필드가 있는지 확인
        const valid = migrated.every((item) => {
          if (!item.id || !item.name || !item.category) return false;
          if (item.category === '식품' && !('foodCategory' in item)) return false;
          return true;
        });
        if (valid && migrated.length > 0) {
          setItems(migrated);
        } else {
          // 유효하지 않은 데이터 → 초기화
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      const storedCount = localStorage.getItem(DISCARD_KEY);
      if (storedCount) setDiscardCount(parseInt(storedCount, 10));
      const storedArchive = localStorage.getItem(ARCHIVE_KEY);
      if (storedArchive) setArchived(JSON.parse(storedArchive));
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) setDiscardHistory(JSON.parse(storedHistory));
    } catch {
      // 복원 실패 시 localStorage 클리어 → mockData 사용
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISCARD_KEY);
      localStorage.removeItem(ARCHIVE_KEY);
      localStorage.removeItem(HISTORY_KEY);
    }
    setHydrated(true);
  }, []);

  // localStorage 동기화
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DISCARD_KEY, String(discardCount));
  }, [discardCount, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived));
  }, [archived, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(discardHistory));
  }, [discardHistory, hydrated]);

  // 중복 방지 addItems — 같은 이름+카테고리면 스킵
  const addItems = useCallback((newItems: CartItem[]): { added: number; skipped: number } => {
    let added = 0;
    let skipped = 0;
    setItems((prev) => {
      const unique = newItems.filter((ni) => {
        const isDuplicate = prev.some(
          (existing) => existing.name === ni.name && existing.category === ni.category,
        );
        if (isDuplicate) { skipped++; return false; }
        added++;
        return true;
      });
      return [...prev, ...unique];
    });
    return { added, skipped };
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, ...updates } as CartItem : item,
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index !== -1) {
        const item = prev[index];
        setLastRemoved({ item, index });
        setDiscardHistory((h) => [
          { name: item.name, category: item.category, date: new Date().toLocaleDateString('ko-KR') },
          ...h,
        ].slice(0, 30));
      }
      return prev.filter((i) => i.id !== id);
    });
    setDiscardCount((prev) => prev + 1);
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(lastRemoved.index, 0, lastRemoved.item);
      return next;
    });
    setDiscardCount((prev) => Math.max(0, prev - 1));
    setLastRemoved(null);
  }, [lastRemoved]);

  // 만료된 식품 자동 아카이브 (보관 기한 + 7일 초과)
  const archiveExpired = useCallback((): number => {
    let count = 0;
    setItems((prev) => {
      const toArchive: CartItem[] = [];
      const remaining = prev.filter((item) => {
        if (isFoodItem(item)) {
          const dDay = calcRemainingDays(item.purchaseDate, item.baseShelfLifeDays);
          if (dDay < -7) {
            toArchive.push(item);
            count++;
            return false;
          }
        }
        return true;
      });
      if (toArchive.length > 0) {
        setArchived((a) => [...toArchive, ...a].slice(0, 50));
      }
      return remaining;
    });
    return count;
  }, []);

  const resetData = useCallback(() => {
    setItems(mockCartItems);
    setArchived([]);
    setDiscardCount(0);
    setDiscardHistory([]);
    setLastRemoved(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISCARD_KEY);
    localStorage.removeItem(ARCHIVE_KEY);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const restoreAll = useCallback((snapshot: {
    items?:          CartItem[];
    archived?:       CartItem[];
    discardCount?:   number;
    discardHistory?: DiscardRecord[];
  }) => {
    if (Array.isArray(snapshot.items))           setItems(snapshot.items);
    if (Array.isArray(snapshot.archived))        setArchived(snapshot.archived);
    if (typeof snapshot.discardCount === 'number') setDiscardCount(snapshot.discardCount);
    if (Array.isArray(snapshot.discardHistory))  setDiscardHistory(snapshot.discardHistory);
    setLastRemoved(null);
    // localStorage 동기화는 기존 useEffect 체인이 items/archived/discardCount/history 변경 시 자동 수행
  }, []);

  return (
    <CartContext.Provider value={{
      items, archived, addItems, updateItem, removeItem, undoRemove, resetData, archiveExpired,
      discardCount, discardHistory, restoreAll,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
