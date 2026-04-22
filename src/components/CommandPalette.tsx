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
import { useCookLog } from '@/lib/recipeCookLog';
import { useWearLog } from '@/lib/wearLog';
import { useModalA11y } from '@/lib/useModalA11y';
import { usePersistedState } from '@/lib/usePersistedState';
import { downloadBackup } from '@/lib/backup';
import { exportAsJSON, exportAsCSV } from '@/lib/exportUtils';
import { useShoppingList } from '@/lib/shoppingList';
import { useSavedOutfits } from '@/lib/savedOutfits';

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
  const { items, archiveExpired } = useCart();
  const { showToast } = useToast();
  const { list: shoppingList, clear: clearShopping, has: inShopping, add: addShopping } = useShoppingList();
  const { log: cookLog } = useCookLog();
  const { log: wearLog } = useWearLog();
  const { outfits: savedOutfits } = useSavedOutfits();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useModalA11y(() => setOpen(false), open);
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
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      if (typeof detail?.query === 'string') setQ(detail.query);
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('nemoa:open-palette', onEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('nemoa:open-palette', onEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setCursor(0);
      // 모달 렌더 후 포커스 — q는 이벤트로 prefill될 수 있으므로 reset 안 함
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      // 닫힐 때만 검색어 초기화
      setQ('');
    }
  }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const raw = q.trim();
    // prefix 모드: '>' 액션만, '#' 페이지만, '?' 레시피만
    let mode: Cmd['kind'] | 'all' = 'all';
    let body = raw;
    if (raw.startsWith('>')) { mode = 'action';   body = raw.slice(1).trim(); }
    else if (raw.startsWith('#')) { mode = 'nav';    body = raw.slice(1).trim(); }
    else if (raw.startsWith('?')) { mode = 'recipe'; body = raw.slice(1).trim(); }
    // 공백·한글 조합문자 제거해 약간의 오타 허용
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    const query = normalize(body);
    const includesFuzzy = (text: string) => normalize(text).includes(query);
    const navs: Cmd[] = [
      { kind: 'nav', id: 'n-home',     emoji: '🏠', label: '홈',         sub: '오늘의 한 마디·벤토',    href: '/' },
      { kind: 'nav', id: 'n-fridge',   emoji: '🧊', label: '스마트 냉장고', sub: '보관 기한·레시피·제철', href: '/fridge' },
      { kind: 'nav', id: 'n-closet',   emoji: '👔', label: '스마트 옷장',   sub: '코디·계절 꺼내기',      href: '/closet' },
      { kind: 'nav', id: 'n-mypage',   emoji: '📊', label: '마이페이지',    sub: '통계·쇼핑·파트너',      href: '/mypage' },
      { kind: 'nav', id: 'n-seasonal', emoji: '🌸', label: '제철 달력',      sub: '4계절 × 27종',          href: '/seasonal' },
      { kind: 'nav', id: 'n-settings', emoji: '⚙️', label: '설정',          sub: '백업·초기화·프로필',    href: '/settings' },
      { kind: 'nav', id: 'n-partners', emoji: '🚀', label: '파트너 로드맵',  sub: 'Phase 7 연결 예정 서비스', href: '/mypage#partners' },
      { kind: 'nav', id: 'n-profiles', emoji: '👥', label: '프로필 관리',    sub: '소유자 추가·수정',        href: '/settings#profiles' },
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
      {
        kind: 'action', id: 'a-archive', emoji: '📦',
        label: '만료 식품 정리', sub: '보관 기한 +7일 초과 아카이브',
        run: () => {
          const n = archiveExpired();
          showToast(n > 0 ? `${n}개 만료 식품이 아카이브됐어요.` : '아카이브할 만료 식품이 없어요.');
        },
      },
      {
        kind: 'action', id: 'a-export-json', emoji: '📄',
        label: 'JSON 내보내기', sub: '현재 아이템만',
        run: () => { exportAsJSON(items); showToast('JSON 파일로 내보냈어요.'); },
      },
      {
        kind: 'action', id: 'a-export-csv', emoji: '📊',
        label: 'CSV 내보내기', sub: '현재 아이템만',
        run: () => { exportAsCSV(items); showToast('CSV 파일로 내보냈어요.'); },
      },
    ];
    // 제철 피크 모두 담기 — 현재 계절의 미보유 피크 재료 일괄 쇼핑 담기
    const haveNames = new Set(items.map((it) => it.name));
    const peakToShop = SEASONAL_PRODUCE.filter(
      (p) => p.peak === season && !haveNames.has(p.name) && !inShopping(p.name),
    );
    if (peakToShop.length > 0) {
      actions.push({
        kind: 'action', id: 'a-peak-shop', emoji: '🌸',
        label: `${season}철 피크 ${peakToShop.length}종 쇼핑 리스트에 담기`,
        sub: '현재 계절 피크 · 미보유만',
        run: () => {
          if (!confirm(`${season}철 피크 ${peakToShop.length}종을 쇼핑 리스트에 담을까요?`)) return;
          for (const p of peakToShop) addShopping(p.name, `${season}철 피크`);
          showToast(`${peakToShop.length}종 쇼핑 리스트에 담았어요.`);
        },
      });
    }

    // 오늘 하루 리뷰 — cookLog/wearLog 오늘 건수 토스트
    const today = new Date().toISOString().split('T')[0];
    const cookToday = Object.values(cookLog).filter((dates) => Array.isArray(dates) && dates[0] === today).length;
    const wearToday = Object.values(wearLog).filter((dates) => Array.isArray(dates) && dates[0] === today).length;
    if (cookToday > 0 || wearToday > 0) {
      actions.push({
        kind: 'action', id: 'a-today-review', emoji: '📅',
        label: '오늘 하루 리뷰', sub: `조리 ${cookToday} · 착용 ${wearToday}`,
        run: () => showToast(`오늘 조리 ${cookToday}건 · 착용 ${wearToday}건 기록했어요.`),
      });
    }

    // 어제 조리한 레시피 다시 열기
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    const lastCookedId = Object.entries(cookLog).find(([, dates]) => Array.isArray(dates) && dates[0] === yesterday)?.[0];
    if (lastCookedId) {
      const r = RECIPES.find((x) => x.id === lastCookedId);
      if (r) {
        actions.push({
          kind: 'action', id: 'a-reopen-last', emoji: '↻',
          label: `어제 만든 "${r.name}" 다시 보기`, sub: `${yesterday} 기록`,
          run: () => window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: r.id } })),
        });
      }
    }

    // 쇼핑 리스트 비우기 — 항목 있을 때만 노출
    if (shoppingList.length > 0) {
      actions.push({
        kind: 'action', id: 'a-clear-shopping', emoji: '🗑️',
        label: '쇼핑 리스트 비우기', sub: `현재 ${shoppingList.length}개`,
        run: () => {
          if (!confirm('쇼핑 리스트를 모두 비울까요?')) return;
          clearShopping();
          showToast('쇼핑 리스트를 비웠어요.');
        },
      });
    }
    if (!query) {
      // prefix만 입력된 상태 — 해당 종류만 보여줌
      if (mode === 'action') return actions;
      if (mode === 'nav')    return navs;
      if (mode === 'recipe') return [];  // 빈 검색 + ? 모드는 추천 없음
      // 일반: 최근 실행 명령을 상단에 복원 (id로 navs/actions 탐색)
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

    // 레시피 — 이름 일치 우선, 키워드 일치 후순위 (공백 무시 fuzzy)
    const recipeNameHits = RECIPES.filter((r) => includesFuzzy(r.name));
    const recipeKwHits   = RECIPES.filter((r) =>
      !includesFuzzy(r.name)
      && r.keywords.some((k) => includesFuzzy(k)),
    );
    const recipeMatches: Cmd[] = [...recipeNameHits, ...recipeKwHits]
      .slice(0, 8)
      .map((r) => ({
        kind: 'recipe', id: `r-${r.id}`,
        emoji: r.emoji, label: r.name, sub: `⏱ ${r.time} · ${r.difficulty}`,
        recipeId: r.id,
      }));

    // 제철 재료 — 이름 + blurb 모두 검색 (fuzzy)
    const seasonMatches: Cmd[] = SEASONAL_PRODUCE
      .filter((p) => includesFuzzy(p.name) || (p.blurb ? includesFuzzy(p.blurb) : false))
      .slice(0, 6)
      .map((p) => ({
        kind: 'seasonal', id: `s-${p.name}`,
        emoji: p.emoji, label: p.name,
        sub: p.seasons.includes(season)
          ? `🌸 지금 제철 · 레시피 ${countRecipesByIngredient(p.name)}개`
          : `${p.seasons.join('·')}철`,
        ingredient: p.name,
      }));

    // 보유 아이템 — 5개로 확대 (fuzzy)
    const itemMatches: Cmd[] = items
      .filter((it) => includesFuzzy(it.name))
      .slice(0, 5)
      .map((it) => ({
        kind: 'nav' as const, id: `i-${it.id}`,
        emoji: isFoodItem(it) ? '🍱' : '👕',
        label: it.name, sub: isFoodItem(it) ? '냉장고 보유' : '옷장 보유',
        href: isFoodItem(it) ? '/fridge' : '/closet',
      }));

    // 저장된 코디 — 이름 fuzzy 매칭, /closet으로 이동
    const outfitMatches: Cmd[] = savedOutfits
      .filter((o) => includesFuzzy(o.name))
      .slice(0, 4)
      .map((o) => ({
        kind: 'nav' as const, id: `o-${o.id}`,
        emoji: '💾',
        label: o.name, sub: `저장된 코디 · ${Object.keys(o.slots).length}벌`,
        href: '/closet',
      }));

    const filteredNavs = navs.filter((n) =>
      includesFuzzy(n.label) || (n.sub ? includesFuzzy(n.sub) : false),
    );
    const filteredActions = actions.filter((a) =>
      includesFuzzy(a.label) || (a.sub ? includesFuzzy(a.sub) : false),
    );

    // mode 필터 적용
    if (mode === 'action') return filteredActions;
    if (mode === 'nav')    return [...filteredNavs, ...itemMatches, ...outfitMatches];
    if (mode === 'recipe') return recipeMatches;
    return [...recipeMatches, ...seasonMatches, ...itemMatches, ...outfitMatches, ...filteredNavs, ...filteredActions];
  }, [q, items, season, recentIds, showToast, shoppingList.length, archiveExpired, clearShopping, cookLog, wearLog, savedOutfits, inShopping, addShopping]);

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
      window.dispatchEvent(new CustomEvent('nemoa:open-recipe', { detail: { recipeId: cmd.recipeId } }));
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
              {q.trim().startsWith('>') && <span className="text-xs font-semibold text-brand-primary">액션만</span>}
              {q.trim().startsWith('#') && <span className="text-xs font-semibold text-brand-primary">페이지만</span>}
              {q.trim().startsWith('?') && <span className="text-xs font-semibold text-brand-primary">레시피만</span>}
              <kbd className="text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono">Esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-1">
              {commands.length === 0 ? (
                <div className="px-4 py-6 flex flex-col gap-3 text-center">
                  <p className="text-xs text-gray-400">검색 결과가 없어요</p>
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    <button
                      onClick={() => setQ('?')}
                      className="text-sm font-medium px-2.5 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      🍳 레시피만 보기
                    </button>
                    <button
                      onClick={() => setQ('>')}
                      className="text-sm font-medium px-2.5 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      ⚡ 액션만 보기
                    </button>
                    <button
                      onClick={() => setQ(season)}
                      className="text-sm font-medium px-2.5 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      🌸 이번 {season}철 검색
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    💡 ⌘K · / · Esc 단축키로 어디서든 빠르게.
                  </p>
                </div>
              ) : (() => {
                const GROUP_LABEL: Record<Cmd['kind'], string> = {
                  recipe:   '레시피',
                  seasonal: '제철 재료',
                  nav:      '이동',
                  action:   '액션',
                };
                const rendered: React.ReactNode[] = [];
                let lastKind: Cmd['kind'] | null = null;
                let lastRecent = false;
                commands.forEach((cmd, i) => {
                  const isRecent = typeof cmd.sub === 'string' && cmd.sub.endsWith('최근');
                  // '최근' 섹션 + 일반 섹션 헤더 분리
                  if (isRecent && !lastRecent) {
                    rendered.push(
                      <p key="h-recent" className="text-xs font-semibold text-gray-400 px-4 pt-2 pb-0.5 uppercase tracking-wider">최근</p>,
                    );
                    lastKind = null; // 최근 이후 다시 종류별 헤더 띄우도록
                  } else if (!isRecent && lastKind !== cmd.kind) {
                    rendered.push(
                      <p key={`h-${cmd.kind}-${i}`} className="text-xs font-semibold text-gray-400 px-4 pt-2 pb-0.5 uppercase tracking-wider">
                        {GROUP_LABEL[cmd.kind]}
                      </p>,
                    );
                    lastKind = cmd.kind;
                  }
                  lastRecent = isRecent;
                  rendered.push(
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
                        {cmd.sub && <p className="text-sm text-gray-400 truncate">{cmd.sub}</p>}
                      </div>
                      {i === cursor && (
                        <kbd className="text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono shrink-0">↵</kbd>
                      )}
                    </button>,
                  );
                });
                return rendered;
              })()}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>↑↓ 탐색 · ↵ 선택 · &gt;액션 #페이지 ?레시피</span>
              <span>⌘K로 다시 열기</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
