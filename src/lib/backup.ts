'use client';

import { useCallback, useEffect, useState } from 'react';

const LAST_BACKUP_KEY = 'nemoa-last-backup-at';
const BACKUP_VERSION  = 2;  // v2: wearLog 추가
const STALE_AFTER_MS  = 7 * 24 * 60 * 60 * 1000; // 7일

export interface BackupSnapshot {
  version:     number;
  createdAt:   string;  // ISO
  app:         'NEMOA';
  items?:      unknown[];
  archived?:   unknown[];
  discard?: {
    count?:    number;
    history?:  unknown[];
  };
  favorites?:  unknown[];
  shopping?:   unknown[];
  noti?:       unknown;
  wearLog?:    unknown;  // v2+ clothing id → ISO date[]
}

function readTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function writeTimestamp(ts: number) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LAST_BACKUP_KEY, String(ts)); }
  catch { /* quota */ }
}

/** localStorage에서 전체 상태를 수집해 스냅샷 생성. */
export function buildSnapshot(): BackupSnapshot {
  const safe = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch { return fallback; }
  };
  const discardCountRaw = typeof window !== 'undefined' ? localStorage.getItem('smart-cart-discard-count') : null;

  return {
    version:   BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    app:       'NEMOA',
    items:     safe('smart-cart-items', []),
    archived:  safe('smart-cart-archive', []),
    discard: {
      count:   discardCountRaw ? parseInt(discardCountRaw, 10) || 0 : 0,
      history: safe('smart-cart-history', []),
    },
    favorites: safe('nemoa-recipe-favorites', []),
    shopping:  safe('nemoa-shopping-list',    []),
    noti:      safe('smart-cart-noti',        null),
    wearLog:   safe('nemoa-wear-log',         {}),
  };
}

/** 브라우저 다운로드 트리거 + 타임스탬프 갱신. */
export function downloadBackup(): string {
  const snap = buildSnapshot();
  const json = JSON.stringify(snap, null, 2);
  const filename = `nemoa-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  writeTimestamp(Date.now());
  return filename;
}

/** 파일을 읽어 스냅샷 검증 후 반환. 유효하지 않으면 throw. */
export async function readBackupFile(file: File): Promise<BackupSnapshot> {
  const text = await file.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('JSON 형식이 아닙니다.'); }

  if (!parsed || typeof parsed !== 'object') throw new Error('비어있는 백업 파일입니다.');
  const p = parsed as Partial<BackupSnapshot>;
  if (p.app !== 'NEMOA') throw new Error('네모아 백업 파일이 아닙니다.');
  if (typeof p.version !== 'number' || p.version > BACKUP_VERSION) {
    throw new Error(`지원하지 않는 백업 버전입니다 (v${p.version}).`);
  }
  return p as BackupSnapshot;
}

/** 스냅샷을 localStorage 즐겨찾기·쇼핑·알림·착용로그 쪽에 적용. 카트 상태는 호출자가 restoreAll로 별도 처리. */
export function applyNonCartFromSnapshot(snap: BackupSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    if (Array.isArray(snap.favorites))
      localStorage.setItem('nemoa-recipe-favorites', JSON.stringify(snap.favorites));
    if (Array.isArray(snap.shopping))
      localStorage.setItem('nemoa-shopping-list',    JSON.stringify(snap.shopping));
    if (snap.noti && typeof snap.noti === 'object')
      localStorage.setItem('smart-cart-noti',        JSON.stringify(snap.noti));
    if (snap.wearLog && typeof snap.wearLog === 'object' && !Array.isArray(snap.wearLog))
      localStorage.setItem('nemoa-wear-log',         JSON.stringify(snap.wearLog));
  } catch { /* quota */ }
  writeTimestamp(Date.now());
}

export interface BackupStatus {
  lastBackupAt: number | null;
  daysSince:    number | null;  // null if never backed up
  isStale:      boolean;         // 7일 초과 or never
}

/** 마지막 백업 시점을 관찰하고 화면 갱신에 사용. */
export function useBackupStatus(): BackupStatus & { refresh: () => void } {
  const [lastBackupAt, setLast] = useState<number | null>(null);

  const refresh = useCallback(() => { setLast(readTimestamp()); }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const daysSince = lastBackupAt !== null
    ? Math.floor((Date.now() - lastBackupAt) / (24 * 60 * 60 * 1000))
    : null;

  const isStale = lastBackupAt === null || (Date.now() - lastBackupAt) > STALE_AFTER_MS;

  return { lastBackupAt, daysSince, isStale, refresh };
}
