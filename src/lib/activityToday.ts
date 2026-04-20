import type { WearLog } from './wearLog';
import type { CookLog } from './recipeCookLog';

export interface TodayActivity {
  worn:      number;  // 오늘 착용 기록 건수 (의류)
  cooked:    number;  // 오늘 조리 기록 건수 (레시피)
  discarded: number;  // 오늘 소진 처리 건수 (식품/의류)
  total:     number;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** "YYYY-MM-DD" 문자열을 받아 오늘인지 판정. */
function isToday(iso: string): boolean {
  return iso.slice(0, 10) === today();
}

/** Mon Apr 20 2026 → "2026. 4. 20." 형태 (discardHistory는 toLocaleDateString('ko-KR') 저장 포맷). */
function isTodayLocale(koreanDate: string): boolean {
  const d = new Date();
  // ko-KR 기본 포맷: "2026. 4. 20." — 공백과 점 처리 유연하게
  const candidate = d.toLocaleDateString('ko-KR');
  return candidate === koreanDate;
}

export function countTodayActivity(
  wearLog:        WearLog,
  cookLog:        CookLog,
  discardHistory: ReadonlyArray<{ date: string }>,
): TodayActivity {
  const worn = Object.values(wearLog).reduce(
    (acc, dates) => acc + (Array.isArray(dates) && dates[0] && isToday(dates[0]) ? 1 : 0),
    0,
  );
  const cooked = Object.values(cookLog).reduce(
    (acc, dates) => acc + (Array.isArray(dates) && dates[0] && isToday(dates[0]) ? 1 : 0),
    0,
  );
  const discarded = discardHistory.filter((r) => isTodayLocale(r.date)).length;

  return { worn, cooked, discarded, total: worn + cooked + discarded };
}
