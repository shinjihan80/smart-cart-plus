/**
 * 디자인 시스템 Step 6(docs/design-system-scope.md, P1-66) — 이름 배열을
 * `.join(', ')` 한 뒤 `truncate`(1줄 CSS ellipsis)로 자르는 패턴이 홈
 * 위젯 여러 곳에 반복돼, 항목 수가 늘면 단어 중간에서 잘리고도 몇 개가
 * 더 있는지 알 수 없었다(UrgentAlert 실측 — 개수 제한이 아예 없어 가장
 * 심했음). 처음 `max`개만 이름 그대로 보여주고 나머지는 "+N"으로 표시 —
 * 항상 완결된 단어 경계에서 끊기고, 남은 개수도 함께 전달된다.
 *
 * 재오픈(2026-10-15, C8·E2 비판 모드 재검토) — 위 설계는 맞았지만
 * UrgentAlert가 이 컴포넌트를 또 부모 `<p className="truncate">`로
 * 감싸서, 한 줄 제한이 "+N" 꼬리부터 잘라 먹었다(실측: 텍스트 칸
 * 189px인데 "...+1"은 244px 필요 — "+N"이 화면에 아예 안 보임).
 * 이 컴포넌트 스스로 레이아웃을 책임지도록 바꾼다 — 이름 부분만
 * truncate되는 flex 자식, "+N" 꼬리는 shrink-0 형제로 분리해 항상
 * 보이게 한다. 호출부는 더 이상 바깥에 truncate를 씌우면 안 된다
 * (씌우면 이 컴포넌트의 flex 레이아웃 자체가 추가로 잘릴 수 있음).
 */
interface NameChipsProps {
  names:      string[];
  max?:       number;
  separator?: string;
  className?: string;
}

export function NameChips({ names, max = 3, separator = ', ', className = '' }: NameChipsProps) {
  if (names.length === 0) return null;
  const shown     = names.slice(0, max);
  const remaining = names.length - shown.length;
  return (
    <span className={`flex min-w-0 items-baseline gap-1 ${className}`}>
      <span className="truncate">{shown.join(separator)}</span>
      {remaining > 0 && <span className="shrink-0 tabular-nums">+{remaining}</span>}
    </span>
  );
}
