/**
 * 한국어 조사 자동 선택 유틸.
 *
 * 화면에 그대로 노출되던 "주스이(가)", "옷을(를)" 같은 자리표시자를 없앤다.
 * 반드시 **최종 문자열(접미사·따옴표 포함)의 마지막 글자** 기준으로 판별해야 한다.
 * 예: `josa(`${name} 외 ${n}개`, '이/가')` → "…개" 의 받침 없음 → "가"
 */

/** 문자열 끝 글자의 받침(종성) 유무. 한글·숫자·영문 예외 처리 포함. */
export function hasJongseong(word: string): boolean {
  const cleaned = word.trim().replace(/["'”’」』)\]】]+$/, '');
  if (cleaned.length === 0) return false;
  const code = cleaned.charCodeAt(cleaned.length - 1);

  // 완성형 한글: (code - 0xAC00) % 28 !== 0 이면 받침 있음
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0;
  }
  // 숫자 발음 기준 받침: 0(영) 1(일) 3(삼) 6(육) 7(칠) 8(팔) → 받침 있음
  if (code >= 0x30 && code <= 0x39) {
    return [0, 1, 3, 6, 7, 8].includes(code - 0x30);
  }
  // 영문·기타: 관례상 받침 없음으로 처리
  return false;
}

type JosaPair = '이/가' | '을/를' | '은/는' | '과/와' | '으로/로';

/**
 * 단어 뒤에 알맞은 조사를 붙여 돌려준다.
 * @example josa('주스', '이/가')            // '주스가'
 * @example josa('감귤 외 2개', '이/가')     // '감귤 외 2개가'
 * @example josa('"셔츠"', '을/를')          // '"셔츠"를'
 */
export function josa(word: string, pair: JosaPair): string {
  const [withJong, withoutJong] = pair.split('/');
  const jong = hasJongseong(word);
  // '으로/로' 은 ㄹ 받침도 '로' 를 쓴다
  if (pair === '으로/로') {
    const cleaned = word.trim().replace(/["'”’」』)\]】]+$/, '');
    const code = cleaned.charCodeAt(cleaned.length - 1);
    const isRieul = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
    return word + (jong && !isRieul ? withJong : withoutJong);
  }
  return word + (jong ? withJong : withoutJong);
}
