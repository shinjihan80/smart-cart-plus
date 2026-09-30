'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CartItem, isFoodItem } from '@/types';
import { mockCartItems } from '@/data/mockData';
import { getRemainingDays } from '@/lib/expirySelectors';
import { recordAddsAndMaybeShowAd } from '@/lib/addMilestone';
import { todayLocalStr } from '@/lib/dateMath';
import { safeSetItem } from '@/lib/safeStorage';
import { logError } from '@/lib/errorLog';

const STORAGE_KEY  = 'nemoa-items';
const DISCARD_KEY  = 'nemoa-discard-count';
const ARCHIVE_KEY  = 'nemoa-archive';
const HISTORY_KEY  = 'nemoa-history';
const SCHEMA_VERSION_KEY = 'nemoa-schema-version';
const CURRENT_SCHEMA_VERSION = '2'; // 카테고리 세분화 (v1→v2)

export interface DiscardRecord {
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
  /** 샘플(mockData 22개)로 초기화 — 처음 체험용. resetData와 구분 (resetData는 샘플 복원이기도 함). */
  loadSampleData:  () => number;
  archiveExpired:  () => number;
  /** 아카이브에서 items로 되돌림. 식품은 구매일을 오늘로 갱신해 신선도 회복. */
  restoreFromArchive: (id: string) => boolean;
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
  // 신규 사용자는 빈 카트로 시작 — 원하면 설정·온보딩에서 샘플 데이터 불러오기
  const [items, setItems]               = useState<CartItem[]>([]);
  const [archived, setArchived]         = useState<CartItem[]>([]);
  const [discardCount, setDiscardCount] = useState(0);
  const [hydrated, setHydrated]         = useState(false);
  const [lastRemoved, setLastRemoved]   = useState<{ item: CartItem; index: number } | null>(null);
  const [discardHistory, setDiscardHistory] = useState<DiscardRecord[]>([]);

  // 클라이언트 마운트 후 localStorage 복원 (+ 데이터 마이그레이션)
  useEffect(() => {
    try {
      // 리브랜딩 전 'smart-cart-*' 키를 곧바로 지우기만 했는데, 그 안에
      // 실제 사용자 데이터(카트 아이템 등)가 남아있을 수 있어 한 번도
      // 새 앱을 안 열어본 복귀 사용자는 이 정리 루프 자체가 데이터를
      // 조용히 날리는 원인이었다(P0-13, 전문단 E2 발견) — 지우기 전에
      // 새 키('nemoa-*')가 아직 없을 때만 값을 옮겨 담는다.
      const RENAMED_KEYS: ReadonlyArray<[string, string]> = [
        ['smart-cart-items',          STORAGE_KEY],
        ['smart-cart-archive',        ARCHIVE_KEY],
        ['smart-cart-discard-count',  DISCARD_KEY],
        ['smart-cart-history',        HISTORY_KEY],
      ];
      for (const [oldKey, newKey] of RENAMED_KEYS) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null && localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, oldValue);
        }
      }

      // 나머지 'smart-cart-*' 키(로그·플래그 등 저가치) + 제거된 카카오
      // 애드핏 SDK가 남긴 'adfit.*' 키 정리 (1회성 — 2릴리스 후 이 블록
      // 삭제 가능). 애드핏 스크립트 자체는 이미 안 실리지만, 예전에
      // 로드됐던 브라우저엔 흔적이 남아있어 "정말 광고 추적이 꺼졌나"
      // 의심을 샀다(P0-42).
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('smart-cart-') || k.startsWith('adfit.'))) localStorage.removeItem(k);
      }

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
        // 유효성 검증 — 예전엔 `every()`로 전부-아니면-전무라 아이템 50개 중
        // 하나만 손상돼도(예: 백업 파일 일부 훼손) 카트 전체가 통째로
        // 삭제됐다(P0-62, 전문단 E2 발견) — `filter()`로 바꿔 불량 아이템만
        // 걸러내고 나머지는 살린다.
        const isValidItem = (item: CartItem) => {
          if (!item.id || !item.name || !item.category) return false;
          if (item.category === '식품' && !('foodCategory' in item)) return false;
          return true;
        };
        const validItems = migrated.filter(isValidItem);
        if (validItems.length > 0) {
          setItems(validItems);
          if (validItems.length < migrated.length) {
            const droppedCount = migrated.length - validItems.length;
            logError(`카트 복원 중 손상된 항목 ${droppedCount}개를 건너뜀`, 'manual');
            window.dispatchEvent(new CustomEvent('nemoa:storage-write-failed', {
              detail: { key: STORAGE_KEY, isQuota: false, message: `손상된 항목 ${droppedCount}개를 제외하고 불러왔어요.` },
            }));
          }
        } else if (migrated.length > 0) {
          // 전부 손상 — 살릴 게 없을 때만 초기화
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

  // localStorage 동기화 — 사진 base64가 원인이 되는 용량 초과 시 이
  // 4곳 전부 예외를 안 잡아 화면이 그대로 크래시했다(P0-23/P0-63,
  // 검토단 C5·전문단 E2 발견). `safeSetItem`으로 통일해 실패해도
  // 앱이 죽지 않고, 실패 사실을 이벤트로 알린다(ErrorCapture가 구독해
  // 토스트로 안내).
  useEffect(() => {
    if (!hydrated) return;
    safeSetItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    safeSetItem(DISCARD_KEY, String(discardCount));
  }, [discardCount, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    safeSetItem(ARCHIVE_KEY, JSON.stringify(archived));
  }, [archived, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    safeSetItem(HISTORY_KEY, JSON.stringify(discardHistory));
  }, [discardHistory, hydrated]);

  // 중복 방지 addItems — 같은 이름+카테고리면 스킵
  const addItems = useCallback((newItems: CartItem[]): { added: number; skipped: number } => {
    let added = 0;
    let skipped = 0;
    setItems((prev) => {
      const seenIds = new Set(prev.map((i) => i.id));
      const unique = newItems.filter((ni) => {
        const isDuplicate = prev.some(
          (existing) => existing.name === ni.name && existing.category === ni.category,
        );
        if (isDuplicate) { skipped++; return false; }
        added++;
        return true;
      // id 충돌 방어(P0-61) — removeItem/updateItem이 id 매칭이라 중복 id
      // 항목은 동시에 삭제·수정되고 wearLog/savedOutfits도 id 키를 공유하게
      // 된다. 근본 원인(AI 파서가 임시 인덱스 id를 그대로 승격)은 각
      // agent 라우트에서 막았지만, 다른 경로(백업 복원 등)로 또 들어올
      // 가능성에 대비해 마지막 방어선으로 여기서도 재발급한다.
      }).map((ni) => {
        if (!seenIds.has(ni.id)) { seenIds.add(ni.id); return ni; }
        const reassigned = { ...ni, id: crypto.randomUUID() } as CartItem;
        seenIds.add(reassigned.id);
        return reassigned;
      });
      return [...prev, ...unique];
    });
    recordAddsAndMaybeShowAd(added);
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
          { name: item.name, category: item.category, date: todayLocalStr() },
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
          const dDay = getRemainingDays(item);
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

  const restoreFromArchive = useCallback((id: string): boolean => {
    let ok = false;
    setArchived((prev) => {
      const target = prev.find((x) => x.id === id);
      if (!target) return prev;
      setItems((cur) => {
        if (cur.some((x) => x.id === id)) return cur;
        // 식품은 구매일을 오늘로 갱신해 보관 기한 리셋
        const restored = isFoodItem(target)
          ? { ...target, purchaseDate: todayLocalStr() }
          : target;
        return [restored, ...cur];
      });
      ok = true;
      return prev.filter((x) => x.id !== id);
    });
    return ok;
  }, []);

  const loadSampleData = useCallback((): number => {
    setItems((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const fresh = mockCartItems.filter((m) => !existing.has(m.id));
      return [...prev, ...fresh];
    });
    return mockCartItems.length;
  }, []);

  const resetData = useCallback(() => {
    // "모든 데이터를 초기화할까요?"라고 물어놓고 실제로는 빈 상태가 아니라
    // mockCartItems 41개(샘플)로 되돌려, 사용자가 "초기화가 실패했다"고
    // 오인하게 만들었다(P0-64, 전문단 E2 발견) — 샘플이 필요하면 이미
    // 별도로 존재하는 loadSampleData()(빈 상태 화면의 "샘플 데이터로
    // 먼저 둘러보기" 버튼)를 쓰면 된다.
    setItems([]);
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
      items, archived, addItems, updateItem, removeItem, undoRemove, resetData, loadSampleData, archiveExpired, restoreFromArchive,
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
