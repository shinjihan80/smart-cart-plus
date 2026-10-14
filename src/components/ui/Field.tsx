'use client';

import type { ReactNode } from 'react';

/**
 * 디자인 시스템 Step 5(docs/design-system-scope.md, P1-73/P2-39) —
 * 등록 폼(TextImportModal.tsx `FoodConfirmDetail`)과 카드 편집 폼
 * (SwipeFoodCard.tsx)이 같은 식품 속성을 편집하는데 라벨 크기
 * (`text-[10px]` 절대px, 13.5px 스케일 하한 미달)·입력 높이(33px,
 * 터치타깃 44px 미달)·보조설명 유무가 서로 달랐다(전문단 E3 실측).
 * 두 폼의 필드 구성(등록=카테고리/보관방법, 편집=소유자/메모 등
 * 서로 다른 필드 보유)과 저장 방식(등록=상태 객체에 모아뒀다 확정,
 * 편집=onBlur 즉시 저장)은 제품 설계가 서로 달라 이번엔 건드리지
 * 않고, 라벨·입력 "생김새"만 공용 컴포넌트로 통일한다.
 */
interface FieldProps {
  label:      string;
  helper?:    ReactNode;
  className?: string;
  children:   ReactNode;
}

export function Field({ label, helper, className = '', children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
      {helper && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{helper}</p>}
    </div>
  );
}

/**
 * input/select 공용 스타일 — 편집 폼에 이미 있던(터치타깃 44px를
 * 만족하는) 규격을 등록 폼에도 맞춘다. 강조가 필요한 필드(유통기한
 * 등)도 테두리는 동일하게 gray-200으로 둔다 — 평소에 켜진
 * brand-primary 테두리가 포커스/오류 관용구를 "여기 봐주세요" 장식
 * 으로 오용하고 있었다(전문단 E3 지적).
 */
export const FIELD_INPUT_CLASS =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition';
