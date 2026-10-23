'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { CartItem, isFoodItem } from '@/types';
import { mockCartItems } from '@/data/mockData';
import { getRemainingDays } from '@/lib/expirySelectors';
import { recordAddsAndMaybeShowAd } from '@/lib/addMilestone';
import { todayLocalStr } from '@/lib/dateMath';
import { safeSetItem } from '@/lib/safeStorage';
import { logError } from '@/lib/errorLog';
import { clearAutoSnapshots } from '@/lib/autoSnapshot';

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
  /**
   * 재검토(/nemoa-review 비판 모드, C5 실측) — "다 먹었어요"가 상한
   * 식품을 치우는 유일한 수단이라, 버린 것도 전부 "먹었다" 통계(마이
   * 페이지 누적·주간/월간/연간 요약·제철 기록)에 섞여 "안 버리고 다
   * 먹은 수치"가 구조적으로 부풀려졌다(P1-91 "완료(안A)"는 용어만
   * 정리했을 뿐 이 구분 자체는 없었음, 재검토에서 "안B" 채택). 기존
   * 저장된 기록엔 이 필드가 없으므로 undefined는 'eaten'과 동일하게
   * 취급해 과거 통계가 조용히 바뀌지 않게 한다.
   */
  kind?:     'eaten' | 'discarded';
}

interface CartContextValue {
  items:           CartItem[];
  archived:        CartItem[];
  addItems:        (newItems: CartItem[]) => { added: number; skipped: number };
  updateItem:      (id: string, updates: Partial<CartItem>) => void;
  /** kind 생략 시 'eaten'(다 먹음) — 상한 걸 버릴 땐 'discarded'를 명시. */
  removeItem:      (id: string, kind?: 'eaten' | 'discarded') => void;
  undoRemove:      () => void;
  resetData:       () => Promise<void>;
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

/**
 * 저장된 items JSON → 마이그레이션 + 유효성 검증. 최초 하이드레이션과
 * cross-tab storage 이벤트 동기화(아래) 둘 다 이 함수 하나만 거친다 —
 * 두 군데서 따로 구현하면 한쪽만 고친 회귀가 재발하기 쉽다.
 */
function parseStoredItems(raw: string): { items: CartItem[]; droppedCount: number } {
  const parsed = JSON.parse(raw) as CartItem[];
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
  return { items: validItems, droppedCount: migrated.length - validItems.length };
}

export function CartProvider({ children }: { children: ReactNode }) {
  // 신규 사용자는 빈 카트로 시작 — 원하면 설정·온보딩에서 샘플 데이터 불러오기
  const [items, setItems]               = useState<CartItem[]>([]);
  const [archived, setArchived]         = useState<CartItem[]>([]);
  const [discardCount, setDiscardCount] = useState(0);
  const [hydrated, setHydrated]         = useState(false);
  // state가 아니라 ref — "소진" 직후 같은 이벤트 핸들러 안에서
  // showToast(msg, undoRemove)로 즉시 되돌리기 콜백을 건네는데, state로
  // 두면 그 시점엔 아직 이전 렌더의(= 방금 지운 아이템을 모르는) stale
  // closure라 되돌리기가 조용히 no-op이었다(P1-34 조사 중 발견 — 리뷰가
  // 지적한 "기록만 안 지워짐"보다 실제로는 더 심각했음, 복구 자체가 항상
  // 실패). ref는 setItems와 무관하게 동기로 최신값을 유지해 undoRemove를
  // 의존성 없는 안정 함수로 만들 수 있다.
  const lastRemovedRef = useRef<{ item: CartItem; index: number } | null>(null);
  // 재검토(C5 실측) P1 — 더블클릭처럼 같은 틱 안에서 removeItem(id)가
  // 두 번 연달아 불리면, 두 호출 다 아직 리렌더 전이라 같은 stale
  // `items` 클로저를 보고 "아직 있다"고 똑같이 판단해 discardHistory·
  // discardCount가 2번 늘었다(실제 items 배열은 filter라 멱등이라
  // 아이템 자체는 1개만 빠지는데 기록만 중복). 리렌더를 기다리지 않는
  // 동기 Set으로 "이미 처리 시작한 id"를 즉시 막는다 — id는 한 번
  // 소진되면 재사용되지 않으니 영구 보관해도 안전하고, undoRemove에서만
  // 명시적으로 지운다(되돌린 뒤 같은 id를 다시 지울 수 있어야 하므로).
  const removingIdsRef = useRef<Set<string>>(new Set());
  const [discardHistory, setDiscardHistory] = useState<DiscardRecord[]>([]);

  // 재검토(비판 모드 C5·전문단 E2) P0-7 — 브라우저가 디스크 압박 시
  // 저장소를 "제거 가능"으로 분류해두면(기본값) 다른 사이트가 쌓이기만
  // 해도 이 앱의 localStorage/IndexedDB가 사용자 모르게 비워질 수 있다.
  // `persist()`는 사용자 상호작용·북마크 등 브라우저 자체 휴리스틱에
  // 따라 자동 허용되거나 무시되며, 실패해도 조용히 알림이 없는 API라
  // 결과를 기다리거나 재시도할 필요가 없다 — 켜두면 이득, 안 켜져도
  // 손해는 없는 "요청만 해두는" 성격.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => { /* 지원 안 함 또는 거부 — 조용히 무시 */ });
    }
  }, []);

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
        const { items: validItems, droppedCount } = parseStoredItems(storedItems);
        if (validItems.length > 0) {
          setItems(validItems);
          if (droppedCount > 0) {
            logError(`카트 복원 중 손상된 항목 ${droppedCount}개를 건너뜀`, 'manual');
            window.dispatchEvent(new CustomEvent('nemoa:storage-write-failed', {
              detail: { key: STORAGE_KEY, isQuota: false, message: `손상된 항목 ${droppedCount}개를 제외하고 불러왔어요.` },
            }));
          }
        } else if (droppedCount > 0) {
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

  /**
   * 재검토(/nemoa-review 비판 모드, C5 코드 확인) P0 — 탭 2개(설치 PWA +
   * 브라우저 탭 등)를 같은 origin에서 동시에 열고 각각 "다 먹었어요"를
   * 누르면, 나중에 쓰는 탭은 상대 탭의 변경을 전혀 모른 채 자기가 마운트
   * 시점에 읽은 스냅샷을 기준으로 배열 전체를 덮어써 먼저 지운 품목이
   * 되살아나는 lost update가 있었다(실측: A에서 지운 품목이 B의 쓰기로
   * 부활, nemoa-history도 B의 기록 1건만 남고 A의 기록은 사라짐).
   *
   * `storage` 이벤트는 스펙상 "그 변경을 일으킨 탭 자신"에는 안 오고
   * 다른 탭에서만 발생한다 — 그래서 이 리스너는 자기 탭이 쓴 변경에는
   * 안 걸리고(무한 루프 방지), 정확히 "내가 모르는 사이 다른 탭이
   * 바꿨다"는 경우에만 로컬 상태를 디스크 최신값으로 재동기화한다.
   * 완전한 충돌 해소(동시 편집 병합)는 아니지만, 이 앱의 실사용 패턴
   * (같은 사람이 탭을 오가며 하나씩 처리)에서 가장 흔한 사고인 "최근
   * 변경이 조용히 사라짐"은 막는다.
   */
  useEffect(() => {
    if (!hydrated) return;
    function onStorage(e: StorageEvent) {
      if (e.storageArea !== localStorage) return;
      try {
        if (e.key === STORAGE_KEY) {
          if (e.newValue === null) { setItems([]); return; }
          setItems(parseStoredItems(e.newValue).items);
        } else if (e.key === ARCHIVE_KEY) {
          setArchived(e.newValue ? JSON.parse(e.newValue) : []);
        } else if (e.key === DISCARD_KEY) {
          setDiscardCount(e.newValue ? parseInt(e.newValue, 10) : 0);
        } else if (e.key === HISTORY_KEY) {
          setDiscardHistory(e.newValue ? JSON.parse(e.newValue) : []);
        }
      } catch (err) {
        logError(err, 'manual');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  // 중복 방지 addItems — 같은 이름+카테고리면 스킵
  // added/skipped를 setItems 업데이터 안에서 세고 호출 직후 반환하던 예전
  // 코드는 removeItem(P1-34)과 같은 비순수 업데이터 패턴이었다 — StrictMode가
  // 업데이터를 두 번 호출하면 클로저 변수 added/skipped가 두 배로 집계돼
  // 호출부(토스트 "N개 추가됨" 등)에 잘못된 수치가 노출될 수 있었다.
  // items(컴포넌트 스코프 상태)를 기준으로 미리 계산한 뒤 setItems에는
  // 완성된 배열만 넘기도록 바꿔 updater를 순수하게 유지한다.
  const addItems = useCallback((newItems: CartItem[]): { added: number; skipped: number } => {
    const seenIds = new Set(items.map((i) => i.id));
    // 재검토(비판 모드) P1-36 — 기존엔 newItems 각 항목을 "현재 카트(items)"
    // 하고만 비교해, AI(사진/텍스트) 일괄 등록이 한 영수증 안에서 같은
    // 이름+카테고리를 2건 넣어도 (카트엔 아직 없으니) 둘 다 통과했다 —
    // 손으로 하나씩 등록할 땐 매번 비교 대상(items)이 갱신되니 자연스럽게
    // 막히던 경우가, 배치 등록에선 "같은 배치 안의 형제 항목"이 비교
    // 대상에서 빠져 재발했다(C5 실측). 이미 받아들인 배치 내 항목도
    // 누적해 같이 비교한다.
    let added = 0;
    let skipped = 0;
    const acceptedKeys = new Set(items.map((i) => `${i.name}::${i.category}`));
    const unique = newItems.filter((ni) => {
      const key = `${ni.name}::${ni.category}`;
      if (acceptedKeys.has(key)) { skipped++; return false; }
      acceptedKeys.add(key);
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
    setItems([...items, ...unique]);
    recordAddsAndMaybeShowAd(added);
    return { added, skipped };
  }, [items]);

  const updateItem = useCallback((id: string, updates: Partial<CartItem>) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, ...updates } as CartItem : item,
    ));
  }, []);

  const removeItem = useCallback((id: string, kind: 'eaten' | 'discarded' = 'eaten') => {
    // setItems 업데이터 함수 안에서 setLastRemoved·setDiscardHistory를 같이
    // 호출하던 예전 코드는 비순수 업데이터였다 — React가 개발 모드
    // StrictMode에서 업데이터를 순수성 검사 목적으로 두 번 호출하면서
    // discardHistory에 같은 소진 기록이 2건씩 쌓였다(P1-34 조사 중 발견,
    // "되돌리기"가 기록 1건만 지워 1건이 그대로 남는 원인). index/item
    // 조회와 side effect를 updater 밖으로 빼 setItems는 순수 필터만 하게.
    if (removingIdsRef.current.has(id)) return;
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;
    removingIdsRef.current.add(id);
    const item = items[index];
    lastRemovedRef.current = { item, index };
    // 재검토(비판 모드) P1-84 — 30건 하드캡이라 하루 3개만 소진해도
    // 열흘이면 로그가 전부 밀려났다. 이 기록이 연간 히스토그램·재구매
    // 주기·자주쓰는재료 등 마이페이지 통계 전부의 유일한 소스라, 활동이
    // 많은 사용자일수록 "올해 소진" 집계가 구조적으로 더 일찍·더 많이
    // 깨지는 역설이 있었다(E2). 건수 대신 날짜(최근 400일 — 연간
    // 히스토그램에 한 해 전체 + 여유분)로 캡을 바꾸고, 혹시 모를 극단적
    // 다량 기록(일부 손상·버그로 인한 폭증 등)에 대비해 건수 상한도
    // 넉넉하게 같이 둔다(localStorage 용량 보호, P0-7과 같은 맥락).
    setDiscardHistory((h) => {
      const cutoff = todayLocalStr(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000));
      const next = [
        { name: item.name, category: item.category, date: todayLocalStr(), kind },
        ...h,
      ];
      return next.filter((r) => r.date >= cutoff).slice(0, 2000);
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDiscardCount((prev) => prev + 1);
  }, [items]);

  const undoRemove = useCallback(() => {
    const removed = lastRemovedRef.current;
    if (!removed) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(removed.index, 0, removed.item);
      return next;
    });
    setDiscardCount((prev) => Math.max(0, prev - 1));
    // 아이템은 되돌아오는데 "최근 소진 내역" 기록은 그대로 남아,
    // 냉장고엔 있는데 소진 기록에도 있는 상태가 돼 재구매 추천에
    // "🔄 최근에 다 썼어요"가 다시 떴다(P1-34, C5 발견). discardHistory는
    // removeItem에서 매번 맨 앞(index 0)에 넣으므로, 되돌리기 시점의
    // 최신 기록 1건을 지우면 항상 방금 그 소진 기록과 일치한다.
    setDiscardHistory((h) => h.slice(1));
    removingIdsRef.current.delete(removed.item.id);
    lastRemovedRef.current = null;
  }, []);

  // 만료된 식품 자동 아카이브 (보관 기한 + 7일 초과)
  // setItems 업데이터 안에서 setArchived를 같이 호출하고 count까지 세어
  // 호출 직후 반환하던 예전 코드는 removeItem(P1-34)과 같은 비순수 업데이터
  // 패턴이었다 — StrictMode 이중 호출로 아카이브가 중복 저장될 수 있었고,
  // count는 setItems 호출 이후 바로 읽혀 React 내부 구현(eager state 계산)에
  // 우연히 기대 값이 되는 경우에만 맞는 값이라 신뢰할 수 없었다(실제로
  // CommandPalette의 "N개 만료 식품이 아카이브됐어요" 토스트가 이 값을
  // 그대로 노출한다). items를 기준으로 미리 계산해 toArchive.length를
  // 직접 반환하고, setItems/setArchived는 각각 완성된 값만 받게 한다.
  const archiveExpired = useCallback((): number => {
    const toArchive: CartItem[] = [];
    const remaining = items.filter((item) => {
      if (isFoodItem(item)) {
        const dDay = getRemainingDays(item);
        if (dDay < -7) {
          toArchive.push(item);
          return false;
        }
      }
      return true;
    });
    if (toArchive.length > 0) {
      setItems(remaining);
      setArchived((a) => [...toArchive, ...a].slice(0, 50));
    }
    return toArchive.length;
  }, [items]);

  // setArchived 업데이터 안에서 setItems를 같이 호출하던 예전 코드도
  // removeItem(P1-34)과 같은 비순수 업데이터 패턴이었다 — StrictMode
  // 이중 호출 시 복원된 아이템이 items에 두 번 들어갈 수 있었다.
  // archived/items(컴포넌트 스코프 상태)로 먼저 판정한 뒤 각 setX에는
  // 완성된 값만 넘긴다.
  const restoreFromArchive = useCallback((id: string): boolean => {
    const target = archived.find((x) => x.id === id);
    if (!target) return false;
    setArchived((prev) => prev.filter((x) => x.id !== id));
    if (!items.some((x) => x.id === id)) {
      // 식품은 구매일을 오늘로 갱신해 보관 기한 리셋
      const restored = isFoodItem(target)
        ? { ...target, purchaseDate: todayLocalStr() }
        : target;
      setItems((cur) => [restored, ...cur]);
    }
    return true;
  }, [archived, items]);

  const loadSampleData = useCallback((): number => {
    setItems((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const fresh = mockCartItems.filter((m) => !existing.has(m.id));
      return [...prev, ...fresh];
    });
    return mockCartItems.length;
  }, []);

  const resetData = useCallback(async () => {
    // "모든 데이터를 초기화할까요?"라고 물어놓고 실제로는 빈 상태가 아니라
    // mockCartItems 41개(샘플)로 되돌려, 사용자가 "초기화가 실패했다"고
    // 오인하게 만들었다(P0-64, 전문단 E2 발견) — 샘플이 필요하면 이미
    // 별도로 존재하는 loadSampleData()(빈 상태 화면의 "샘플 데이터로
    // 먼저 둘러보기" 버튼)를 쓰면 된다.
    // P0-83 — IndexedDB 자동 스냅샷을 localStorage보다 먼저 비운다.
    // items가 []로 바뀌는 순간 AutoSnapshotRecoveryCard가 "자동 저장된
    // 데이터를 찾았어요"를 띄울 수 있는데, 그 시점에 스냅샷이 이미
    // 없어야 "복원할 방법이 전혀 없어요"라는 확인 문구와 실제 동작이
    // 맞는다.
    await clearAutoSnapshots();
    setItems([]);
    setArchived([]);
    setDiscardCount(0);
    setDiscardHistory([]);
    lastRemovedRef.current = null;
    // 재검토(/nemoa-review 비판 모드, C3·C5 교차 확인) — CartContext가
    // 아는 4개 키만 지워, 가족 프로필·착용/조리 로그·쇼핑 리스트·저장된
    // 코디·냉장고/옷장 구성 등 60여 개 다른 저장소는 "전체 초기화" 후에도
    // 그대로 남았다. 그런데 동의 시트·개인정보처리방침·설정 화면·초기화
    // 확인창 네 곳 모두 "완전 삭제"를 약속해 실제 동작과 어긋났다.
    // 키를 하나씩 나열하면 새 저장소가 생길 때마다 같은 버그가 재발하므로
    // (이게 바로 지금까지의 원인), nemoa- 접두사를 가진 모든 키를 지운다 —
    // 마이그레이션 버전 마커(스키마 버전)만 예외.
    if (typeof window !== 'undefined') {
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('nemoa-') && key !== SCHEMA_VERSION_KEY) {
            localStorage.removeItem(key);
          }
        }
      } catch { /* quota/권한 오류 — 이미 지운 4개 키만으로도 핵심은 비워짐 */ }
    }
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
    lastRemovedRef.current = null;
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
