'use client';

import type { Outfit } from './outfitMatcher';
import { getFashionCategoryTone } from './categoryImages';
import type { ClothingItem } from '@/types';

/**
 * 코디 카드 공유 — navigator.share/canShare 번들이 0건이었다(P2-8, E2
 * 실측). 실제 옷 사진이 없어도(이모지 썸네일 상태) 성립하도록, 저장된
 * imageUrl은 쓰지 않고 OutfitCard와 같은 "톤 배경 + 이모지" 콜라주를
 * 오프스크린 canvas에 직접 그려 공유 이미지를 만든다.
 */

// Tailwind 클래스(예: 'bg-emerald-50')의 실제 배경색을 런타임에 읽어온다 —
// 카테고리별 hex를 따로 하드코딩해 테마와 어긋날 위험을 피한다.
function resolveBgColor(twClass: string): string {
  const el = document.createElement('div');
  el.className = twClass;
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  const color = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  return color || '#F3F4F6';
}

function drawSlot(
  ctx: CanvasRenderingContext2D,
  item: ClothingItem | undefined,
  x: number, y: number, w: number, h: number,
  emojiPx: number,
) {
  const tone = item ? getFashionCategoryTone(item.category) : null;
  ctx.fillStyle = tone ? resolveBgColor(tone.bg) : '#F3F4F6';
  ctx.fillRect(x, y, w, h);
  if (tone) {
    ctx.font = `${emojiPx}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tone.emoji, x + w / 2, y + h / 2);
  }
}

async function renderOutfitImage(outfit: Outfit): Promise<Blob | null> {
  const s = outfit.slots;
  const skeleton: ClothingItem[] = (
    s.onepiece ? [s.onepiece, s.outer]
               : [s.outer ?? s.top, s.outer ? s.top : s.bottom]
  ).filter(Boolean).slice(0, 2) as ClothingItem[];
  const accents: ClothingItem[] = [s.shoes, s.accessory].filter(Boolean).slice(0, 2) as ClothingItem[];

  const W = 800;
  const IMG_H = 800;
  const LABEL_H = 140;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = IMG_H + LABEL_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const leftW = accents.length > 0 ? Math.round(W * 3 / 5) : W;
  const rightW = W - leftW;

  const rows = Math.max(skeleton.length, 1);
  const rowH = IMG_H / rows;
  (skeleton.length > 0 ? skeleton : [undefined]).forEach((item, i) => {
    drawSlot(ctx, item, 0, i * rowH, leftW, rowH, 140);
  });

  if (accents.length > 0) {
    const aRowH = IMG_H / accents.length;
    accents.forEach((item, i) => {
      drawSlot(ctx, item, leftW, i * aRowH, rightW, aRowH, 72);
    });
  }

  // 라벨 밴드 — OutfitCard와 동일하게 불투명 어두운 바
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, IMG_H, W, LABEL_H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(outfit.label, 32, IMG_H + 26, W - 64);

  const accentNames = accents.map((i) => i.name);
  const sublabel = accentNames.length > 0 ? accentNames.join(' · ') : 'NEMOA 추천 코디';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '22px sans-serif';
  ctx.fillText(sublabel, 32, IMG_H + 82, W - 64);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export type ShareOutfitResult = 'shared' | 'cancelled' | 'downloaded' | 'unsupported';

/**
 * 코디를 이미지로 만들어 OS 공유 시트로 넘긴다. Web Share API(파일 공유)를
 * 지원하지 않는 환경(대부분의 데스크톱 브라우저 등)에서는 PNG 다운로드로
 * 대체한다.
 */
export async function shareOutfit(outfit: Outfit): Promise<ShareOutfitResult> {
  const blob = await renderOutfitImage(outfit);
  if (!blob) return 'unsupported';

  const file = new File([blob], `${outfit.label}.png`, { type: 'image/png' });

  if (
    typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: outfit.label, text: 'NEMOA에서 추천받은 코디예요' });
      return 'shared';
    } catch (err) {
      // 사용자가 공유 시트를 그냥 닫은 경우(AbortError) — 실패가 아니라 취소.
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      // 그 외 실패는 다운로드로 폴백.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${outfit.label}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'downloaded';
}
