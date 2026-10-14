/**
 * 디자인 시스템 Step 6(docs/design-system-scope.md, P1-66) — 이름 배열을
 * `.join(', ')` 한 뒤 `truncate`(1줄 CSS ellipsis)로 자르는 패턴이 홈
 * 위젯 여러 곳에 반복돼, 항목 수가 늘면 단어 중간에서 잘리고도 몇 개가
 * 더 있는지 알 수 없었다(UrgentAlert 실측 — 개수 제한이 아예 없어 가장
 * 심했음). 처음 `max`개만 이름 그대로 보여주고 나머지는 "+N"으로 표시 —
 * 항상 완결된 단어 경계에서 끊기고, 남은 개수도 함께 전달된다.
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
    <span className={className}>
      {shown.join(separator)}
      {remaining > 0 && ` +${remaining}`}
    </span>
  );
}
