'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { type FoodItem, type FridgeSection } from '@/types';
import { FOOD_ICON, SEASON_ICON, SEASON_COLOR } from '@/lib/iconMap';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { getFoodCategoryTone } from '@/lib/categoryImages';
import { FRIDGE_MODELS, type FridgeModelId } from '@/lib/fridgeModel';
import { FRIDGE_SECTION_META, recommendFridgeSection } from '@/lib/fridgeSection';
import { useProfiles } from '@/lib/profile';
import { useToast } from '@/context/ToastContext';
import { currentSeasonByMonth } from '@/lib/season';
import { isSeasonalProduce } from '@/lib/seasonalProduce';
import { countRecipesByIngredient, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import dynamic from 'next/dynamic';
const RecipeBrowserModal = dynamic(() => import('@/components/RecipeBrowserModal'), { ssr: false });
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { haptic } from '@/lib/haptics';
import { estimateCycles } from '@/lib/purchaseCycle';
import { useCart } from '@/context/CartContext';
import { expiryDateStr, expiryDateLabel, daysBetween, localMidnight, todayLocalStr } from '@/lib/dateMath';
import { EXPIRY_LABEL, classifyExpiry } from '@/lib/expiryThresholds';
import { springTransition, CARD_SHADOW, STORAGE_ICON, STORAGE_STYLE } from './shared';

interface SwipeFoodCardProps {
  item:         FoodItem;
  dDay:         number;
  index:        number;
  fridgeModelId: FridgeModelId;
  onDiscard: (id: string) => void;
  onUpdate:  (id: string, updates: Partial<FoodItem>) => void;
  /** 부모가 관리하는 펼침 상태 — 한 번에 하나만 펼치게 */
  expanded?: boolean;
  onToggle?: () => void;
  /** 바텀시트 등 항상 펼친 컨텍스트에서 토글 버튼 숨김 */
  hideToggle?: boolean;
}

export default function SwipeFoodCard({ item, dDay, index, fridgeModelId, onDiscard, onUpdate, expanded: expandedProp, onToggle, hideToggle }: SwipeFoodCardProps) {
  const [expandedLocal, setExpandedLocal] = useState(false);
  const expanded = expandedProp ?? expandedLocal;
  const toggleExpanded = onToggle ?? (() => setExpandedLocal((v) => !v));
  const [editing, setEditing]   = useState(false);
  const [recipeBrowser, setRecipeBrowser] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { profiles } = useProfiles();
  const { showToast } = useToast();
  const { isFavorite, toggle } = useRecipeFavorites();
  const owner = item.ownerId ? profiles.find((p) => p.id === item.ownerId) : null;
  const recipeCount = countRecipesByIngredient(item.name);
  const modelCells = FRIDGE_MODELS[fridgeModelId].cells;
  const currentSection = item.fridgeSection ?? recommendFridgeSection(item);
  const { discardHistory } = useCart();
  const cycle = estimateCycles(discardHistory, 2).find((c) => c.name === item.name);
  // 진행바가 baseShelfLifeDays(품목마다 다른 보관기간)로 정규화돼 있어
  // 카드 간 비교가 성립하지 않았다 — D-3(서울우유, shelf 10일)이 30%인데
  // D-1(생연어, shelf 10일)은 33.3%로 더 안 급한 품목의 바가 더 길게
  // 그려졌다. 색(급할수록 진함)과 길이(급할수록 짧음)도 반대 방향이라
  // 가장 급한 D-0이 화면에서 가장 작은 빨강 점이 됐다(P1-68, C1·E3
  // 발견). 분모를 상수 7(일)로 고정한 "급함 게이지"로 전환 — D-0=100%,
  // D-7+=0%(바 자체를 숨김). 분모가 상수라 P0-54(보관일수 오설정) 버그의
  // 시각적 파급도 함께 차단된다. 색은 배지와 같은 classifyExpiry() 하나로
  // 통일 — 예전엔 배지(dDay≤3)·바 빨강(≤2)·바 앰버(≤5) 임계값이 전부
  // 달라 "빨간 숫자 위 앰버 바" 같은 자기모순 렌더가 났다.
  const expiryBucket = classifyExpiry(dDay);
  const urgencyFill = Math.max(0, Math.min(1, (7 - dDay) / 7));
  const urgencyBarColor =
    expiryBucket === 'expired' || expiryBucket === 'today' ? 'bg-brand-warning'
      : expiryBucket === 'soon' ? 'bg-amber-400'
      : 'bg-brand-success';
  // D배지·"N일 남음" 텍스트가 자체 임계값(dDay<=3)으로 전부 빨강을 썼다
  // — 같은 카드 안에서 soon(D-2·D-3) 품목이 "빨간 글자 + 노란 막대"로
  // 모순됐다(P1-90, C8·E2·E3 실측). 막대와 같은 expiryBucket 하나로
  // 텍스트 색도 통일.
  const urgencyTextColor =
    expiryBucket === 'expired' || expiryBucket === 'today' ? 'text-[#DC2626]'
      : expiryBucket === 'soon' ? 'text-amber-600'
      : '';

  const style = STORAGE_STYLE[item.storageType];
  const Icon  = STORAGE_ICON[item.storageType];
  const season  = currentSeasonByMonth();
  const inSeason = isSeasonalProduce(item.name, season);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.18 } }}
      transition={{ ...springTransition, delay: Math.min(index, 6) * 0.03 }}
      className="relative overflow-hidden rounded-[32px]"
    >
      <div
        style={{ backgroundColor: 'rgb(255,255,255)', ...CARD_SHADOW }}
        onClick={toggleExpanded}
        // P2-44 — 클릭 핸들러만 있는 div라 키보드·스크린리더로는 펼칠
        // 방법이 없어 "다 먹었어요"·"정보 수정"에 닿지 못했다(C8 실측).
        // 자식에 버튼·입력칸이 중첩돼 있어 카드 전체를 <button>으로
        // 바꾸면 안 돼 role="button"+tabIndex로 전환 — 자식 클릭은
        // 전부 이미 stopPropagation()을 쓰므로, 엔터/스페이스도 카드
        // 자신을 눌렀을 때만(e.target===e.currentTarget) 반응한다.
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${item.name} 상세 정보 ${expanded ? '접기' : '펼치기'}`}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        className="rounded-[32px] border border-gray-50 p-5 flex flex-col cursor-pointer"
      >
        <div className="flex items-start gap-4">
          {/* 좌측: 큰 사진 — 탭하면 변경/추가. 사진이 배경처럼 영역 꽉 채움. */}
          {(() => {
            const tone = getFoodCategoryTone(item.foodCategory);
            return (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const file = await pickImage();
                  if (!file) return;
                  try {
                    const dataUrl = await resizeAndEncode(file);
                    onUpdate(item.id, { imageUrl: dataUrl });
                    showToast('사진이 변경됐어요.');
                  } catch {
                    showToast('사진 변경 실패');
                  }
                }}
                aria-label={item.imageUrl ? `${item.name} 사진 변경` : `${item.name} 사진 추가`}
                title={item.imageUrl ? '탭해서 사진 변경' : '탭해서 사진 추가'}
                className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center ${tone.bg} hover:ring-2 hover:ring-brand-primary/30 active:scale-95 transition-all`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl" aria-hidden>{tone.emoji}</span>
                )}
                {/* 변경 가능 표시 — 사진 우하단에 항상 작게 보임 */}
                <span
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/95 flex items-center justify-center text-[12px] shadow-md ring-1 ring-gray-100"
                  aria-hidden
                >
                  📷
                </span>
              </button>
            );
          })()}

          {/* 본문: 제목 + 메타 + 진행바 */}
          <div className="flex-1 min-w-0">
            {/* 제목 줄: 제품명 | D-Day | 펼침 화살표 */}
            <div className="flex items-center justify-between gap-2 mb-2">
              {/* truncate(1줄 고정폭 컷)는 150%/375px 같은 좁은 환경에서 이름이
                  통째로 사라지는(빈칸+말줄임만 보임) 사고를 냈다(P1-92, C1·C8
                  4회 반복 지적). line-clamp-2로 바꿔 좁아져도 2줄까지는 글자가
                  남게 한다 — 사진(w-24)·여백을 rem화하는 컨테이너 쿼리 전면
                  개편(E3 "full" 해법)은 범위 밖. */}
              <p className="text-[15px] font-bold text-brand-ink line-clamp-2 break-keep flex-1 leading-snug">{item.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <p className={`text-sm font-bold tabular-nums ${urgencyTextColor || 'text-gray-500'}`}>
                  {dDay < 0 ? EXPIRY_LABEL.over : `D-${dDay}`}
                </p>
                {!hideToggle && (
                  <ChevronDown
                    size={15}
                    strokeWidth={2.4}
                    className={`text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  />
                )}
              </div>
            </div>

            {item.memo && <p className="text-xs text-gray-400 truncate mb-2">{item.memo}</p>}

            {/* 핵심 정보: 만료일 — 한 줄 (펼치면 구매일도 자세히)
                예전엔 구매일(purchaseDate)을 라벨 없이 📅로만 보여줘 만료일로
                오인됐다(P0-52) — "09/20 · 3일 남음"처럼 산술이 안 맞아 보여
                D-day 전체를 못 믿게 만들었다(검토단 C1·C9·C8 독립 발견).
                이 줄에서 실제로 궁금한 값(언제까지 먹어야 하는가)을 보여준다.
                연도를 매번 지우면(구 slice(5)) baseShelfLifeDays가 1년을
                넘는 품목(간장 730일 등)이 "07/27까지"처럼 이미 지난 날짜로
                읽혔다(P0-55, 검토단 C4·C9 독립 발견) — expiryDateLabel()이
                해가 바뀔 때만 연도를 붙인다. dDay<0(기한 지남)일 때도
                "지남"을 붙여 무라벨 맨 날짜로 되돌아가지 않게 한다.
                shelfLifeSource가 'user'가 아니면(등록 시 기본값/이름
                추론값 그대로) 이 날짜는 앱의 추정이라 "쯤까지"로 톤을
                낮춘다 — 사용자가 포장지 날짜로 확정하면 "까지"로
                바뀐다(P0-33, 전문단 E1 설계). */}
            {/* 날짜줄 색 — 카드에서 가장 중요한 정보(언제까지 먹어야
                하는가)인데 gray-400(2.54:1)이라 WCAG AA(4.5:1) 미달,
                부차정보인 제품명(15.5:1)보다 훨씬 안 보여 위계가
                거꾸로였다(P1-70, C8·E3 실측). gray-500(4.83:1)로 상향.
                긴급 빨강도 텍스트용(#DC2626, 4.83:1)과 배경·바용
                (brand-warning #EF4444, 비텍스트라 대비 기준 다름)을
                분리 — 전체 brand-warning 토큰 재정의(66곳, P1-69)는
                범위 밖이라 이 카드의 텍스트 2곳만 스코프로 고정. */}
            <div className="flex items-center gap-2 text-xs text-gray-500 tabular-nums mb-3">
              <span>
                🗓 {expiryDateLabel(item)}
                {dDay >= 0 ? (item.shelfLifeSource === 'user' ? '까지' : '쯤까지') : ' 지남'}
              </span>
              <span className="text-gray-200">·</span>
              <span className={urgencyTextColor ? `${urgencyTextColor} font-medium` : ''}>
                {dDay < 0 ? EXPIRY_LABEL.over : dDay === 0 ? EXPIRY_LABEL.today : `${dDay}일 남음`}
              </span>
            </div>

            {/* 급함 게이지 — dDay 7일 이상이면 숨김(급할 게 없음) */}
            {urgencyFill > 0 && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${urgencyBarColor}`}
                  style={{ width: `${urgencyFill * 100}%` }}
                />
              </div>
            )}

            {/* 칼로리·영양소 — 한 줄 (펼치면 자세히) */}
            {item.nutritionFacts ? (
              <p className="text-xs text-gray-500 tabular-nums mt-2.5">
                🔥 <span className="font-semibold">{item.nutritionFacts.calories}</span>kcal
                <span className="text-gray-300"> · </span>
                단 {item.nutritionFacts.protein}g
                <span className="text-gray-300"> · </span>
                지 {item.nutritionFacts.fat}g
                <span className="text-gray-300"> · </span>
                탄 {item.nutritionFacts.carbs}g
              </p>
            ) : (
              <p className="text-[11px] text-gray-300 mt-2.5">영양 정보 없음</p>
            )}

          </div>
        </div>


        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-3">

                {/* 태그 칩 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
                    <Icon size={10} />{style.label}
                  </span>
                  {(() => {
                    const FoodIcon = FOOD_ICON[item.foodCategory] ?? FOOD_ICON['기타 식품'];
                    return (
                      <span className="inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap">
                        <FoodIcon size={11} strokeWidth={2} />{item.foodCategory ?? '기타'}
                      </span>
                    );
                  })()}
                  {inSeason && (() => {
                    const SeasonIcon = SEASON_ICON[season];
                    const seasonColor = SEASON_COLOR[season];
                    return (
                      <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${seasonColor.bg} ${seasonColor.text}`}>
                        <SeasonIcon size={10} strokeWidth={2.4} />제철
                      </span>
                    );
                  })()}
                  {owner && (
                    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      {owner.name}
                    </span>
                  )}
                </div>

                {/* ── 보기 모드: 정보 행 테이블 ── */}
                {!editing && (
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden text-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">구매일</span>
                      <span className="font-medium text-gray-700 tabular-nums">{item.purchaseDate}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 기한</span>
                      <span className={`font-medium tabular-nums ${urgencyTextColor || 'text-gray-700'}`}>
                        {expiryDateStr(item)}
                        <span className="ml-1.5 text-xs text-gray-400">({dDay < 0 ? EXPIRY_LABEL.over : `${dDay}일`})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 일수</span>
                      <span className="font-medium text-gray-700 tabular-nums">{item.baseShelfLifeDays}일</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">보관 위치</span>
                      <span className="font-medium text-gray-700">
                        {FRIDGE_SECTION_META[currentSection].emoji} {FRIDGE_SECTION_META[currentSection].label}
                        {!item.fridgeSection && <span className="text-gray-300 text-xs ml-1">(자동)</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <span className="text-xs text-gray-400">소유자</span>
                      <span className="font-medium text-gray-700">{owner ? owner.name : '공용'}</span>
                    </div>
                    {item.memo && (
                      <div className="flex items-start justify-between px-4 py-3 bg-gray-50 gap-4">
                        <span className="text-xs text-gray-400 shrink-0">메모</span>
                        <span className="font-medium text-gray-700 text-right">{item.memo}</span>
                      </div>
                    )}
                    {item.nutritionFacts && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">영양</span>
                        <span className="font-medium text-gray-600 tabular-nums text-xs">
                          🔥{item.nutritionFacts.calories}kcal · 단{item.nutritionFacts.protein} · 지{item.nutritionFacts.fat} · 탄{item.nutritionFacts.carbs}g
                        </span>
                      </div>
                    )}
                    {cycle && (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-400">재구매 주기</span>
                        <span className="font-medium text-gray-700">🔁 {cycle.cycleDays}일 <span className="text-xs text-gray-400">({cycle.occurrences}회)</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 수정 모드: 사각형 폼 필드 ── */}
                {editing && (
                  <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                    {item.imageUrl && (
                      <button
                        type="button"
                        onClick={() => { onUpdate(item.id, { imageUrl: undefined }); showToast('사진을 삭제했어요.'); }}
                        className="self-start text-xs text-gray-400 hover:text-rose-500 transition-colors"
                      >
                        🗑️ 사진 삭제
                      </button>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">상품명</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 상품명 수정`}
                        defaultValue={item.name}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== item.name) onUpdate(item.id, { name: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">구매일</label>
                      <input
                        type="date"
                        aria-label={`${item.name} 구매일 수정`}
                        defaultValue={item.purchaseDate}
                        max={todayLocalStr()}
                        onBlur={(e) => { const v = e.target.value; if (v && v !== item.purchaseDate) onUpdate(item.id, { purchaseDate: v }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 tabular-nums transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">
                        유통기한 <span className="text-gray-300 font-normal">— 포장에 적힌 날짜</span>
                      </label>
                      {/* 예전엔 "보관 가능 일수"(숫자) 입력만 있어 포장지에 찍힌
                          실제 날짜를 그대로 못 넣고 구매일 기준으로 역산해야
                          했다(P0-33, 검토단 C1·C4·C8 독립 발견) — 카드 앞면이
                          이미 만료일을 확정적으로 보여주는데(P0-52) 정작 그
                          값을 직접 확인해 넣을 곳이 없던 비대칭을 해소한다.
                          baseShelfLifeDays(상대일수)만 저장하면 확정 후
                          구매일을 고칠 때 확정값이 조용히 깨진다(재오픈,
                          검토단 E2·E3) — expiryDate(절대값)를 진실로 저장한다.
                          비제어 입력이라 값을 안 바꾸고 탭만 벗어나도(onBlur)
                          v가 defaultValue와 같아 예전엔 days===baseShelfLifeDays
                          비교가 우연히 어긋나 'user'로 잘못 확정되곤 했다 —
                          v를 원래 표시값과 직접 비교해 실제 변경 때만 반영. */}
                      <input
                        type="date"
                        aria-label={`${item.name} 유통기한 수정`}
                        defaultValue={expiryDateStr(item)}
                        min={item.purchaseDate}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (!v || v === expiryDateStr(item)) return;
                          const days = daysBetween(localMidnight(item.purchaseDate), localMidnight(v));
                          // 같은 날짜(days===0, 당일 소비 식품)는 "앞선" 게
                          // 아닌데 거부됐었다(P0-67, C4·E1·E2 실측) — 구매일
                          // "이전" 날짜일 때만 거부. 비제어 입력이라 거부
                          // 후에도 칸에 입력값이 남아 카드 앞면(저장값)과
                          // 다른 날짜가 동시에 보였다 — 저장된 값으로 되돌림.
                          if (days < 0) {
                            showToast('구매일보다 이전 날짜는 입력할 수 없어요.');
                            e.target.value = expiryDateStr(item);
                            return;
                          }
                          onUpdate(item.id, { expiryDate: v, baseShelfLifeDays: days, shelfLifeSource: 'user' });
                        }}
                        className="w-full bg-white border border-brand-primary/30 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 tabular-nums transition"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        {item.shelfLifeSource === 'user'
                          ? '직접 확인한 날짜예요'
                          : `네모아 추정값 — 구매일 기준 ${item.baseShelfLifeDays}일. 다르면 날짜를 고쳐주세요`}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">보관 위치</label>
                      <select
                        aria-label={`${item.name} 보관 위치 수정`}
                        value={currentSection}
                        onChange={(e) => { const next = e.target.value as FridgeSection; if (next !== currentSection) onUpdate(item.id, { fridgeSection: next }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                      >
                        {modelCells.map((cell) => {
                          const meta = FRIDGE_SECTION_META[cell.section];
                          return <option key={cell.section} value={cell.section}>{meta.emoji} {meta.label}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">소유자</label>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => onUpdate(item.id, { ownerId: undefined })}
                          className={`text-sm px-3 py-1 rounded-lg border transition-colors ${!item.ownerId ? 'bg-gray-700 text-white border-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          공용
                        </button>
                        {profiles.map((p) => (
                          <button key={p.id} onClick={() => onUpdate(item.id, { ownerId: p.id })}
                            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${item.ownerId === p.id ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 block mb-1.5">메모</label>
                      <input
                        type="text"
                        aria-label={`${item.name} 메모 수정`}
                        defaultValue={item.memo ?? ''}
                        placeholder="메모를 입력하세요"
                        onBlur={(e) => { const v = e.target.value.trim(); if (v !== (item.memo ?? '')) onUpdate(item.id, { memo: v || undefined }); }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                      />
                    </div>
                  </div>
                )}

                {/* ── 액션 버튼 ── */}
                {editing ? (
                  // 위 필드들은 전부 onBlur에서 즉시 저장되므로 이 버튼은
                  // 편집 모드를 닫을 뿐 그 자체로 뭔가를 저장하지 않는다.
                  // "저장하고 완료"라는 라벨은 반대로 읽혀 "버튼을 눌러야
                  // 반영된다"는 오해와 "안 누르고 닫으면 취소된다"는 오해를
                  // 동시에 만들었다(P0-66, 검토단 E3 발견) — 카피를 실제
                  // 동작과 맞춘다.
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(false); }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-white hover:opacity-90 transition-colors mt-1"
                  >
                    ✓ 완료
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    {recipeCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setRecipeBrowser(true); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-brand-primary/5 border border-brand-primary/15 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      >
                        📖 레시피 {recipeCount}개
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      ✏️ 정보 수정
                    </button>
                    {/* "소진 처리"는 일상어가 아니고, 🗑️(휴지통) 아이콘은
                        "먹어서 없앤 것"과 "상해서 버린 것"을 구분 못 하게
                        만들었다(P2-38, C8·C9 각 독립 지적·9/27 밤 재지적).
                        실제로 이 버튼이 호출하는 동작(removeItem)은 데이터
                        상 "먹었든 버렸든" 구분이 없는 단일 제거 동작이지만,
                        압도적으로 흔한 케이스("다 먹어서 없앰")를 기준으로
                        자연스러운 구어체 라벨을 쓴다 — 🍲는 TodayDishCard의
                        "조리 완료" 토스트와 같은 아이콘으로 "음식을 다
                        먹었다" 맥락을 재사용. */}
                    <button
                      onClick={(e) => { e.stopPropagation(); haptic('action'); onDiscard(item.id); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors"
                    >
                      🍲 다 먹었어요
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {recipeBrowser && (
        <RecipeBrowserModal
          initialSearch={item.name}
          onSelect={(recipe) => {
            setRecipeBrowser(false);
            setSelectedRecipe(recipe);
          }}
          onClose={() => setRecipeBrowser(false)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          matchedItems={[item.name]}
          isFavorite={isFavorite(selectedRecipe.id)}
          onToggleFavorite={() => toggle(selectedRecipe.id)}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </motion.div>
  );
}
