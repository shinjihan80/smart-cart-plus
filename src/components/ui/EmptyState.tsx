import type { ReactNode } from 'react';

/**
 * 디자인 시스템 Step 5(docs/design-system-scope.md, P2-41/P2-9) — 칸 상세
 * 시트(냉장고·옷장) 빈 상태가 헤더 부제(`meta.hint`)를 빈 상태 문구에서
 * 그대로 또는 어색하게 이어붙여 반복 노출하면서도, 실제로 누를 수 있는
 * CTA는 없었다(실측 확인). 공용 컴포넌트로 분리해 "제목 + (선택)
 * 설명 + (선택) CTA 버튼" 구조를 고정한다.
 */
interface EmptyStateProps {
  title:      string;
  message?:   string;
  icon?:      ReactNode;
  action?:    { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ title, message, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 text-gray-400 ${className}`}>
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="text-xs mt-1 leading-relaxed">{message}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}
