'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { saveAutoSnapshot } from '@/lib/autoSnapshot';

const DEBOUNCE_MS = 4000;

/**
 * P0-7 자동 스냅샷(IndexedDB) 트리거 — 렌더는 없음.
 * CartContext가 이미 감시하는 것과 같은 4개 값(items/archived/
 * discardCount/discardHistory) 변화를 신호로 삼아, 바뀐 뒤 잠잠해지면
 * (4초) 전체 스냅샷을 한 번 저장한다. 타이핑처럼 짧은 간격의 연속
 * 변경에 매번 쓰지 않도록 디바운스.
 *
 * `items.length === 0`이면 저장을 건너뛴다 — 라이브 테스트로 실제
 * 재현: localStorage만 지워진 직후(복구 카드가 뜨는 바로 그 상황)
 * items가 빈 배열로 리하이드레이트되는데, 이 스케줄러가 그 "빈 상태"를
 * 그대로 다음 세대로 저장해버리면 몇 초 안에 유일하게 쓸모 있던
 * 스냅샷이 빈 스냅샷에 덮여 사라진다 — 안전망이 스스로 안전망을
 * 지우는 꼴. 복구 전까지는 기존 세대를 그대로 보존한다.
 */
export default function AutoSnapshotScheduler() {
  const { items, archived, discardCount, discardHistory } = useCart();

  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => { void saveAutoSnapshot(); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [items, archived, discardCount, discardHistory]);

  return null;
}
