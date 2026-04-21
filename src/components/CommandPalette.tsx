'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { isFoodItem } from '@/types';
import { RECIPES, countRecipesByIngredient } from '@/lib/recipes';
import { SEASONAL_PRODUCE } from '@/lib/seasonalProduce';
import { currentSeasonByMonth } from '@/lib/season';
import { useModalA11y } from '@/lib/useModalA11y';
import { usePersistedState } from '@/lib/usePersistedState';
import { downloadBackup } from '@/lib/backup';

/**
 * 전역 명령 팔레트 — 어디서든 ⌘K로 호출.
 * 현재 포커스가 `<input>`에 있으면 기존 단축키에 양보(페이지별 검색창 우선).
 * 비어 있을 때만 활성화되는 얇은 레이어.
 */

type Cmd =
  | { kind: 'nav';      id: string; emoji: string; label: string; sub?: string; href: string }
  | { kind: 'recipe';   id: string; emoji: string; label: string; sub?: string; recipeId: string }
  | { kind: 'seasonal'; id: string; emoji: string; label: string; sub?: string; ingredient: string }
  | { kind: 'action';   id: string; emoji: string; label: string; sub?: string; run: () => void };

export default function CommandPalette() {
  const router = useRouter();
  const { items } = useCart();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useModalA11y(() => setOpen(false));
  // 최근 실행 id 5개 (LRU)
  const [recentIds, setRecentIds] = usePersistedState<string[]>(
    'nemoa-palette-recent', [],
    (raw) => Array.isArray(raw) && raw.every((x) => typeof x === 'string') ? raw as string[] : null,
  );

  const season = currentSeasonByMonth();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // 현재 focus가 input/textarea면 페이지별 검색창에 양보
        const active = document.activeElement;
        const isFocusedInput = active instanceof HTMLElement
          && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isFocusedInput) return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onEvent() { setOpen(true); }
    window.addEventListener('keydown', onKey);
    window.addEventListener('nemoa:open-palette', onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('nemoa:open-palette', onEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      // 모달 렌더 후 포커스
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    const navs: Cmd[] = [
      { kind: 'nav', id: 'n-home',     emoji: '🏠', label: '홈',         sub: '오늘의 한 마디·벤토',    href: '/' },
      { kind: 'nav', id: 'n-fridge',   emoji: '🧊', label: '스마트 냉장고', sub: '보관 기한·레시피·제철', href: '/fridge' },
      { kind: 'nav', id: 'n-closet',   emoji: '👔', label: '스마트 옷장',   sub: '코디·계절 꺼내기',      href: '/closet' },
      { kind: 'nav', id: 'n-mypage',   emoji: '📊', label: '마이페이지',    sub: '통계·쇼핑·파트너',      href: '/mypage' },
      { kind: 'nav', id: 'n-seasonal', emoji: '🌸', label: '제철 달력',      sub: '4계절 × 27종',          href: '/seasonal' },
      { kind: 'nav', id: 'n-settings', emoji: '⚙️', label: '설정',          sub: '백업·초기화·프로필',    href: '/settings' },
    ];
    const actions: Cmd[] = [
      {
        kind: 'action', id: 'a-backup', emoji: '💾',
        label: '지금 백업 다운로드', sub: '전체 상태를 JSON으로',
        run: () => {
          const f = downloadBackup();
          showToast(`백업 완료 — ${f}`);
        },
      },
      {
        kind: 'action', id: 'a-register', emoji: '➕',
        label: '상품 등록 열기', sub: '텍스트·영수증에서 추가',
        run: () => window.dispatchEvent(new CustomEvent('nemoa:open-register')),
      },
    ];
    if (!query) {
      // 최근 실행 명령을 상단에 복원 (id로 navs/actions 탐색)
      const pool = [...navs, ...actions];
      const recentCmds: Cmd[] = [];
      const seen = new Set<string>();
      for (const id of recentIds) {
        if (seen.has(id)) continue;
        const hit = pool.find((n) => n.id === id);
        if (hit) { recentCmds.push(hit); seen.add(id); }
      }
      if (recentCmds.length === 0) return [...navs, ...actions];
      return [
        ...recentCmds.map((c) => ({ ...c, sub: c.sub ? `${c.sub} · 최근` : '최근' })),
        ...pool.filter((n) => !seen.has(n.id)),
      ];
    }

    // 레시피 TOP 5 매칭
    const recipeMatches: Cmd[] = RECIPES
      .filter((r) => r.name.toLowerCase().includes(query) || r.keywords.some((k) => k.toLowerCase().includes(query)))
      .slice(0, 5)
      .map((r) => ({
        kind: 'recipe', id: `r-${r.id}`,
        emoji: r.emoji, label: r.name, sub: `⏱ ${r.time} · ${r.difficulty}`,
        recipeId: r.id,
      }));

    // 제철 재료 TOP 3
    const seasonMatches: Cmd[] = SEASONAL_PRODUCE
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 3)
      .map((p) => ({
        kind: 'seasonal', id: `s-${p.name}`,
        emoji: p.emoji, label: p.name,
        sub: p.seasons.includes(season) ? `🌸 지금 제철 · 레시피 ${countRecipesByIngredient(p.name)}개` : `${p.seasons.join('·')}철`,
        ingredient: p.name,
      }));

    // 보유 아이템 TOP 3
    const itemMatches: Cmd[] = items
      .filter((it) => it.name.toLowerCase().includes(query))
      .slice(0, 3)
      .map((it) => ({
        kind: 'nav' as const, id: `i-${it.id}`,
        emoji: isFoodItem(it) ? '🍱' : '👕',
        label: it.name, sub: isFoodItem(it) ? '냉장고 보유' : '옷장 보유',
        href: isFoodItem(it) ? '/fridge' : '/closet',
      }));

    const filteredNavs = navs.filter((n) =>
      n.label.toLowerCase().includes(query) || (n.sub?.toLowerCase().includes(query) ?? false),
    );
    const filteredActions = actions.filter((a) =>
      a.label.toLowerCase().includes(query) || (a.sub?.toLowerCase().includes(query) ?? false),
    );

    return [...recipeMatches, ...seasonMatches, ...itemMatches, ...filteredNavs, ...filteredActions];
  }, [q, items, season, recentIds, showToast]);

  useEffect(() => { setCursor(0); }, [q]);

  function execute(cmd: Cmd) {
    setOpen(false);
    // 최근 실행 갱신 — nav + action만 기록 (레시피/제철/아이템은 맥락 특정)
    if (cmd.kind === 'nav' || cmd.kind === 'action') {
      setRecentIds((prev) => {
        const next = [cmd.id, ...prev.filter((x) => x !== cmd.id)];
        return next.slice(0, 5);
      });
    }
    if (cmd.kind === 'nav') {
      router.push(cmd.href);
    } else if (cmd.kind === 'recipe') {
      router.push('/fridge');
    } else if (cmd.kind === 'seasonal') {
      router.push(`/seasonal?season=${encodeURIComponent(season)}`);
    } else if (cmd.kind === 'action') {
      cmd.run();
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = commands[cursor];
      if (cmd) execute(cmd);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="명령 팔레트"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="어디로 갈까요? (레시피·제철·페이지)"
                aria-label="명령 검색"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none"
              />
              <kbd className="text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono">Esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-1">
              {commands.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">검색 결과가 없어요</p>
              ) : (
                commands.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setCursor(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      i === cursor ? 'bg-brand-primary/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg shrink-0">{cmd.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{cmd.label}</p>
                      {cmd.sub && <p className="text-[10px] text-gray-400 truncate">{cmd.sub}</p>}
                    </div>
                    {i === cursor && (
                      <kbd className="text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono shrink-0">↵</kbd>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
              <span>↑↓ 탐색 · ↵ 선택</span>
              <span>⌘K로 다시 열기</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
