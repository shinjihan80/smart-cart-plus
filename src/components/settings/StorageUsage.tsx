'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

interface UsageRow {
  key:   string;
  label: string;
  bytes: number;
}

const KEY_LABELS: Record<string, string> = {
  'smart-cart-items':       '식품·의류 아이템',
  'smart-cart-archive':     '아카이브',
  'smart-cart-history':     '소진 이력',
  'nemoa-wear-log':         '착용 로그',
  'nemoa-cook-log':         '조리 로그',
  'nemoa-profiles':         '프로필',
  'nemoa-shopping-list':    '쇼핑 리스트',
  'nemoa-recipe-favorites': '즐겨찾기 레시피',
  'nemoa-saved-outfits':    '저장된 코디',
  'nemoa-weather-cache':    '날씨 캐시',
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * localStorage의 nemoa/smart-cart 관련 키 용량을 측정해 표시.
 * 사용자가 어느 데이터가 차지하는 지 한눈에 보게.
 */
export default function StorageUsage() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const collected: UsageRow[] = [];
    let sum = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.startsWith('nemoa-') && !key.startsWith('smart-cart-')) continue;
      const val = localStorage.getItem(key) ?? '';
      // 대략적인 UTF-16 바이트 추정 (1 char ≈ 2 bytes)
      const bytes = new Blob([val]).size;
      if (bytes === 0) continue;
      sum += bytes;
      const label = KEY_LABELS[key] ?? key;
      collected.push({ key, label, bytes });
    }
    collected.sort((a, b) => b.bytes - a.bytes);
    setRows(collected.slice(0, 8));  // 상위 8개만
    setTotal(sum);
  }, []);

  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.bytes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.21 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">📦</span>
          <span className="text-xs text-gray-400 font-medium">저장 용량</span>
        </div>
        <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
          총 {formatBytes(total)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const pct = Math.round((r.bytes / max) * 100);
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600 truncate">{r.label}</span>
                <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                  {formatBytes(r.bytes)}
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-primary/50"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
        브라우저 localStorage 기준 추정값. 백업 JSON 파일 크기와 유사해요.
      </p>
    </motion.div>
  );
}
