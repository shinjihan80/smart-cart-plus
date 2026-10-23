'use client';

import { buildSnapshot, type BackupSnapshot } from './backup';

const DB_NAME    = 'nemoa-auto-snapshots';
const DB_VERSION = 1;
const STORE_NAME = 'generations';
const GENERATIONS = 3;

interface StoredGeneration {
  gen:       number;
  createdAt: string;
  snapshot:  BackupSnapshot;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB 미지원')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'gen' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function readAllGenerations(db: IDBDatabase): Promise<StoredGeneration[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as StoredGeneration[]);
    req.onerror   = () => reject(req.error);
  });
}

function writeGeneration(db: IDBDatabase, entry: StoredGeneration): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/**
 * 재검토(비판 모드 C5 코드 확인, 전문단 E2) P0-7 — localStorage는 수동
 * "지금 백업하기"(파일 다운로드)가 유일한 복구 수단이었다. 사용자가
 * 한 번도 그 버튼을 안 눌렀는데 브라우저가 저장소 압박으로 localStorage를
 * 비우면(사파리 ITP, OS 저장공간 부족 시 "제거 가능" 등급 데이터 정리 등)
 * 복구할 방법이 전혀 없었다. IndexedDB에 조용히 3세대 순환 스냅샷을
 * 쌓아 — 사용자가 아무것도 안 눌러도 — 돌아갈 지점을 하나 더 확보한다.
 * 수동 백업 파일을 대체하지 않는다(파일은 기기 밖으로 들고 나갈 수 있는
 * 유일한 수단) — 같은 기기 안에서의 2차 안전망일 뿐이라 실패해도 조용히
 * 무시한다.
 */
export async function saveAutoSnapshot(): Promise<void> {
  try {
    const db = await openDb();
    const existing = await readAllGenerations(db);
    const targetGen = existing.length < GENERATIONS
      ? existing.length
      : existing.reduce((oldest, cur) => (cur.createdAt < oldest.createdAt ? cur : oldest)).gen;
    const snapshot = buildSnapshot();
    await writeGeneration(db, { gen: targetGen, createdAt: snapshot.createdAt, snapshot });
    db.close();
  } catch {
    // IndexedDB 미지원·용량 초과·프라이빗 모드 차단 등 — 추가 안전망일
    // 뿐이라 실패해도 사용자에게 알리지 않는다(수동 백업이 본선).
  }
}

/**
 * 재발견(P0-83, 전문단 E2) — "전체 초기화 > 백업 없이 바로 삭제"가
 * "복원할 방법이 전혀 없어요"라고 약속하는데, CartContext.resetData()는
 * localStorage의 nemoa-* 키만 지우고 이 IndexedDB 자동 스냅샷은
 * 손대지 않았다 — 직후 "자동 저장된 데이터를 찾았어요 [복구하기]"
 * 카드가 떠서 버튼 하나로 가족 정보까지 전부 되살아났다. 전체
 * 초기화 흐름이 명시적으로 호출해 3세대를 모두 비운다.
 */
export async function clearAutoSnapshots(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB 미지원 등 — localStorage 스윕은 별도로 진행되므로 핵심 삭제는 영향 없음
  }
}

/** 3세대 중 가장 최근 것을 반환. 없거나 읽기 실패하면 null. */
export async function getLatestAutoSnapshot(): Promise<BackupSnapshot | null> {
  try {
    const db = await openDb();
    const existing = await readAllGenerations(db);
    db.close();
    if (existing.length === 0) return null;
    return existing.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).snapshot;
  } catch {
    return null;
  }
}
