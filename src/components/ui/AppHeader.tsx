import type { ReactNode } from 'react';

/**
 * 디자인 시스템 Step 5(docs/design-system-scope.md, P2-16) — sticky 헤더의
 * 바깥 래퍼(`sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95
 * backdrop-blur-md border-b border-gray-50` + max-width 컨테이너)가
 * home/fridge/closet/mypage 4곳에 토씨 하나 안 틀리고 복제돼 있었다.
 * 화면별 제목 블록·액션 아이콘 구성·탭 스트립은 그대로 각 페이지가
 * 넘겨받아 렌더하고, 여기서는 "복제된 래퍼"만 한 곳으로 모은다 — 액션
 * 아이콘 순서/구성 자체를 강제로 통일하지는 않는다(화면마다 실제로
 * 다른 기능이라 강제 통일은 디자인 판단, 보류).
 */
interface AppHeaderProps {
  /** 제목+부제 블록 또는 로고 등 왼쪽 콘텐츠 */
  left: ReactNode;
  /** 오른쪽 액션 아이콘들 — 넘겨준 순서 그대로 렌더 */
  actions?: ReactNode;
  /** 액션 래퍼 div의 클래스 (페이지마다 gap이 달라 커스터마이즈 가능) */
  actionsClassName?: string;
  /** 제목 행 자체의 클래스 (padding/gap 등, 페이지마다 다름) */
  rowClassName?: string;
  /** 탭 스트립 등 제목 행 아래에 오는 콘텐츠 */
  below?: ReactNode;
}

export function AppHeader({
  left,
  actions,
  actionsClassName = 'flex items-center gap-1.5 shrink-0',
  rowClassName = 'px-4 py-3.5',
  below,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
      <div className="max-w-md min-[700px]:max-w-[680px] min-[1000px]:max-w-[880px] mx-auto">
        <div className={`flex items-center justify-between ${rowClassName}`}>
          {left}
          {actions && <div className={actionsClassName}>{actions}</div>}
        </div>
        {below}
      </div>
    </header>
  );
}
