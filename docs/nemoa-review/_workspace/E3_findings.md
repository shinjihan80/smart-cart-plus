# E3 (박세라 / 20년차 UX·UI 디자이너) — 2026-09-27

대상: https://nemoa.vercel.app · 375x812 · 샘플 41건 + 소스 대조
방법: 전용 탭 DOM 실측(루트 18/24/27px 3단) + grep + 커밋 이력 대조.
이전 산출물 없음 — 이번이 E3 초판.

## 오케스트레이터 질문 선답

**Q1(회귀 vs 구조적 한계)**: 구조적 한계, P1-51/52 회귀 아님. `b2facaf`가 건드린 파일은 page.tsx/HeroMessage.tsx/RebuyAlert.tsx/UrgentAlert.tsx/dailyMessage.ts뿐. QuickLinks.tsx는 `b351485` 이후 미변경, ScrollToTop.tsx/globals.css는 `2b3cacf` 이후 미변경. 다만 P1-51이 `seasonalExpiring` 분기를 우선시켜 최장문자열 노출 확률을 올려 **노출 빈도는 증폭**시킴.

**근본 원인 — 역방향 스케일링**: 뷰포트 375px 고정인데 패딩/아이콘/배지가 rem이라 루트 폰트 확대 시 내용은 커지고 그릇은 줄어듦.
| 루트 | 그리드 트랙 폭 | 타일 폭 | 결과 |
|---|---|---|---|
| 18px | 82.5px | 63px | 여유 19.5px |
| 24px | 78.75px↓ | 84px↑ | 6쌍 5px 겹침 |
| 27px | 76.875px↓ | 95px↑ | 6쌍 18px 겹침 |
교차점 루트≈21px(약 120% 확대)부터 깨짐 — 133/150%만의 문제 아님. viewport 브레이크포인트로 해결 불가(파손 변수가 뷰포트가 아니라 루트 폰트). rem 기반 auto-fit 리플로우 필요: `grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))]` + 타일 `max-w-14 aspect-square` + `gap-x-2`.

## 발견

- screen: 전역 (냉장고 칸 그리드·하단 탭바·배지)
  observed: 홈 한 화면 font-size 8종(54/24/20.25/18/15.75/13.5/11/10px) — 13.5~20.25는 rem(확대 추종), 10·11px은 절대값(고정). 텍스트 노드 56개 중 13개(23%) 미추종. `text-[Npx]` 85곳/29파일.
  problem: 타이포 시스템 이원화 — WCAG 1.4.4 위반. P1-48(루트 %화)은 옳았으나 말단 px 85곳이 남아 절반만 적용.
  cause: 하단 스케일(13.5px 아래) 토큰 부재가 `text-[10px]` 탈출의 구조적 유인.
  fix: ① `@theme inline`에 `--text-2xs:0.611rem`(11px@18)/`--text-3xs:0.556rem`(10px@18) 신설, 기본렌더값 보존. ② 85곳 일괄 치환. ③ ESLint `no-restricted-syntax`로 `text-[Npx]` 신규 차단(`b351485` 선례와 동일 패턴). ④ lucide `size={N}`도 동결 문제 — `size="1em"`+폰트상속 전환.
  effort: L
  priority_guess: P0

- screen: 홈 오늘 할 일·오늘의 나 / 냉장고 칸 그리드 (전역 패턴)
  observed: 텍스트 가용폭이 확대할수록 축소. "무항생제 달걀…" have193→109px/need294→441px(소실률34%→75%). "친환경 샐러드…" have184→96px(17%→71%). 냉장고 칸 제목은 폰트가 11px 고정인데 have49→26px(need는 그대로 50px인데도 48% 잘림).
  problem: 유일한 오버플로 전략이 truncate/line-clamp-1이라 "글자를 키워달라"는 요청에 앱이 "덜 보여주겠다"로 응답 — C1/C4/C8/C9 각자 다른 화면에서 제기한 잘림의 단일 근본원인.
  cause: `flex-1 min-w-0`+`truncate` 전역 기본값. rem 형제(아이콘·배지·패딩)가 커지며 px고정 뷰포트 안에서 텍스트 박스를 압박, truncate가 이를 "정상"으로 흡수.
  fix: ① 정보텍스트는 truncate 금지, `line-clamp-2 break-keep`로 세로 성장 허용(카드 높이 auto). ② 진짜 한줄이 필요한 곳만 truncate+`title` 속성 병기. ③ 품목나열은 "A, B" 대신 "A 외 1개" 유계 요약 포맷으로(기존 "외 N" 패턴 확장).
  effort: M
  priority_guess: P0

- screen: 홈 > 카테고리 8칸 그리드
  observed: 루트24px 6쌍 전부 5px 겹침, 27px 18px 겹침. computed `column-gap:normal`(=0). 타일 3.5rem vs 트랙 82.5→76.875px.
  problem: 아이콘 타일 상호 침범, 소속 붕괴. "7" 배지가 겹침구간에서 옆 타일 위에 뜸(C8 "소속 불명" 지적과 동일 현상).
  cause: 열수 상수(grid-cols-4) vs 타일 rem변수, 가로 gap 0.
  fix: 위 Q1의 auto-fit + max-w-14 aspect-square + gap-x-2. E1의 그리드 6칸 축소안과 결합하면 auto-fit이 자연 흡수.
  effort: S
  priority_guess: P1

- screen: 홈 > 히어로 배너 (레이아웃 붕괴)
  observed: 동일 문구가 루트18/24/27px에서 3→5→7줄, 카드높이245→378→516px, 뷰포트 점유율30%→47%→64%. "오늘 할일" 제목 y 377→553→713px(사실상 첫화면 밖). 워터마크 `-right-3 w-24 h-24`가 95px(27px일땐142px) 침범하는데 방어패딩 `pr-12`=54px(27px일땐81px)뿐 — 항상 부족. 인사말 줄은 pr 자체 없어 27px에서 82px 겹침("요"가 삼각형에 먹힘).
  problem: 히어로에 콘텐츠 계약 없음 — 7배 변동 문자열에 line-clamp/max-height 없음. P1-51/52가 "오늘 할일 맨 위로" 올린 성과를 히어로가 되밀어냄.
  cause: 짧은 인사말용 설계에 이후 16종 메시지가 얹혔는데 레이아웃 상수는 그대로.
  fix: ① 본문 `line-clamp-3`+`min-h` 높이상한. ② 워터마크 침범폭·본문패딩을 동일 토큰(`--hero-gutter:6rem`)으로 결속, 인사말 줄에도 적용. ③ 워터마크를 더 크고 옅게(opacity 40→20) 또는 확대시 hidden. ④ `dailyMessage.ts` 문자열 40자 상한 규약화, 초과시 축약형 필드 분리.
  effort: M
  priority_guess: P1

- screen: 홈 > 히어로 배너 — 카피 톤 (확정안)
  observed: `dailyMessage.ts:81` "가을철 "제주 감귤 주스"가 곧 만료예요. 지금 아니면 내년까지 기다려야 해요!" + CTA "레시피 찾기", 아이콘 AlertTriangle, priority urgent.
  problem: 한 문장에 발화행위 2개 — (a)내 소비기한 경고 (b)제철 희소성 마케팅. (b)는 사실도 아님(주스 상한다고 감귤을 내년까지 못 사는 게 아님) — "톤이 헷갈린다"의 정체는 거짓 긴급성. 인사말(반가움)+경고아이콘(위협)+느낌표까지 감정신호 3개 충돌. C1·C8 재지적.
  cause: `seasonalExpiring` 분기가 조건 중첩(제철+임박)을 문장 접합으로 처리 — 조건 중첩과 문장 결합은 별개인데 구분 없음.
  fix(확정): 한 줄에 한 가지만.
    - 권장(A): 헤드라인 "제주 감귤 주스, 오늘까지예요." + 아래 칩 "🍂 가을 제철"(TONE[].chip 토큰 기존 정의, 히어로 미사용분 재활용) + CTA 유지.
    - 한문장 유지시(B): "제주 감귤 주스, 오늘까지 드세요. 지금이 가을 제철이라 맛이 가장 좋아요." — 경고 먼저, 제철은 근거로 종속, 거짓 희소성 삭제.
    - 구조적(C): 희소성 카피를 urgent에서 빼내 비긴급 insight 티어로("가을 제철 감귤, 지금이 가장 맛있어요" — 임박 품목 없을 때만 노출).
    - 추가: urgent 메시지 전반 "!" 제거(색·아이콘이 이미 긴급 전달), urgent일 때 인사말 행 숨김.
  effort: S
  priority_guess: P1

- screen: 냉장고 > 🧊냉장고 탭 (칸 그리드)
  observed: `FridgeView.tsx:39-40` `gridTemplateColumns: minmax(0,1fr)`, `gridTemplateRows: minmax(64px,auto)`. 루트18→27px 열폭71.25→60px(축소), 행은 일부만 성장(75.75→100.5) 빈칸행은 64px 고정. 칸제목 11px 고정, have49→26px.
  problem: 가로 최소값 0(무한 찌그러짐), 세로 최소값 px상수(확대 무시) — 접근성 확대에 정반대로 설정. 공간 은유(어느칸이 어디) 붕괴, 제목 절반 잘림. C8의 2026-09-23 지적 미해소.
  cause: `minmax(0,1fr)` 오버플로방지 관용구가 "칸 내용이 읽혀야 한다" 요구와 충돌. 공간 다이어그램 컴포넌트가 텍스트 컴포넌트처럼 취급됨.
  fix: ① 행 최소값 `64px`→`4rem` 즉시 rem화(1줄, 렌더 동일). ② 칸 제목/내용 `text-2xs`/`text-3xs` 토큰화(finding1 연동). ③ 근본해법: 칸폭 임계 이하/루트폰트 확대 감지시 그리드 대신 칸 목록(리스트) 뷰로 자동전환 — 음식탭의 기존 리스트/컴팩트 토글(`role="tablist" aria-label="보기 방식"`) 패턴 재사용.
  effort: M
  priority_guess: P1

- screen: 전역 — 컬러·radius·다크모드 토큰
  observed: ① P2-4가 3단 상태색 정의(danger/caution/info) 했으나 실사용 `text-caution` 1회+`bg-caution` 1회뿐. 구형 `--color-brand-warning`(#EF4444)은 `text-brand-warning` 49회/28파일, `bg-`27회, `border-`9회. #EF4444 18px bold on white = 3.76:1(4.5 미달), 대체 토큰 #DC2626은 4.83:1(통과). ② 홈 한화면 radius 6종(4.5/18/24/27/28/full)공존, 27px(`rounded-3xl`)과 28px(`rounded-[28px]`)가 1px차로 나란히. `rounded-[Npx]` 68곳/6종. ③ `dark:` 변형 0회, `prefers-color-scheme` 블록 0개 — `themeColor:"#4F46E5"`까지 뒀지만 다크정의 없어 다크모드 폰에서 전면 백색.
  problem: 토큰이 문서로만 존재하고 시스템으로 작동 안 함 — 접근성 수정(P2-4)이 코드베이스에 도달 못함. C6·C2가 반복한 "디자인 시스템이 없어 보인다"의 실체.
  cause: 토큰 신설시 기존 사용처 마이그레이션·구형 토큰 폐기를 함께 안 함 — 구형 토큰이 살아있어 자동완성이 계속 재유입.
  fix: ① `text-brand-warning`→`text-danger`/`text-caution` 49곳 의미별 치환 후 `--color-brand-warning` 정의 삭제(재유입 차단). ② radius 3단(`--radius-card:1.75rem`/`--radius-chip:1rem`/`--radius-control:0.75rem`) 토큰화, 68곳 치환+ESLint 차단. ③ 다크모드는 ①②선행 후 `@media(prefers-color-scheme:dark)`에서 배경/전경/브랜드색 재정의.
  effort: L(①S ②M ③M, 순차)
  priority_guess: P1

- screen: 홈 > 오늘 할 일 > 가을 옷장 정리 카드 — 카피 확정
  observed: `SeasonChangeAlert.tsx:64-67` `push(\`${toStow}벌 보관할 때\`)`/`push(\`${toUnstow}벌 꺼낼 때\`)`, `join(' · ')`. 렌더 "가을 옷장정리시즌—3벌"+"3벌 보관할 때"+별도span"·정리하기". 루트24px에서 "3벌 보관할 때" 24/96px로 눌려 "·정리하기"만 남음.
  problem: "~할 때"는 종속절이라 미완성 문장, "·정리하기" 형제span이 붙어 파편 2개가 구분점으로 이어짐. 제목·본문 "3벌" 중복(C1). 4인 여러 라운드 반복 제기, 미해소.
  cause: 문장을 조각조립해 join(' · ')하는 구조 — 어떤 조합에서도 완결문장 불가. 술어를 조각에 넣은 게 원인, 구분점 목록은 명사구여야 함.
  fix(확정): 명사구 병렬로 전환, 술어는 카드에서 제거.
    - 제목: "가을 옷장 정리 시즌"(— N벌 삭제, 본문과 중복)
    - 본문: "보관할 옷 3벌 · 꺼낼 옷 2벌"(0이면 해당 조각 생략, 각각 단독 완결 명사구라 잘려도 파편 안 됨)
    - "· 정리하기" span 삭제(카드 전체가 Link+chevron이라 중복), 필요하면 우측 pill 버튼으로 분리.
    코드: `push(\`보관할 옷 ${toStow}벌\`)`/`push(\`꺼낼 옷 ${toUnstow}벌\`)` + span 제거로 끝.
  effort: S
  priority_guess: P2

- screen: 홈 전역 FAB(↑) (`ScrollToTop.tsx:27`)
  observed: `bottom-28 right-5 w-12 h-12` 전부 rem — 루트27px에서 54→81px로 커지고 x299→260/y632→542로 콘텐츠 쪽 이동. 스크롤 9지점 중 6지점에서 본문 덮음(scrollY700 "레시피", 900 "설정"+"전체 레시피", 1200 "가장 맛있을 때예요", 1500 "·✓통밀식빵+3"+"기록", 1800 "현재16°흐림", 2200 "네모아의 주간인사이트"+"최근7일"). C8의 "전체레시피·주간인사이트 가림" 관측 정확 — 특정 위치 우연이 아니라 상시 현상.
  problem: 콘텐츠 열 25~350px인데 FAB이 260~341px 점유 — 본문폭 23% 상시 점유하는 떠있는 판. 2b3cacf가 "가려도 안보이던" 문제는 고쳤으나 "가리는 것 자체"는 그대로.
  cause: 오버레이 컨트롤에 콘텐츠측 회피거터 미확보. `bottom-28` rem이라 확대시 하단탭에서 더 멀어져(간극38→68px) 본문 속으로 파고듦.
  fix: ① 크기를 rem성장에서 분리 — `w-12 h-12`→고정 44px(터치최소), 아이콘만 키움. ② 위치를 하단탭 기준 고정 — `bottom-28`→`bottom:calc(var(--nav-h)+0.75rem)`. ③ 근본: 홈에서 FAB 제거 권고(문서높이1909px, 확대시3431px지만 하단탭 "홈" 재탭이 자연스러운 상단이동 관용구) — 긴 목록화면(냉장고 음식탭)에만 유지.
  effort: S
  priority_guess: P2

- screen: 냉장고·옷장·마이 상단 탭줄 / 홈 알림카드 ✕·> 인접
  observed: ① **C8 관측 정정** — 탭줄은 overflow-x:auto, 루트27px scrollWidth563 vs client375 = 188px(탭1개분) 스크롤 가능. "🛒장보기"는 사라진 게 아니라 스와이프하면 나옴. 문제는 scrollbar-hide로 어포던스(엣지페이드·화살표·peek)가 전무, 기본크기에선 숨은폭 2px뿐이라 스크롤가능성을 배울 기회조차 없음. ② 홈 알림카드 ✕는 기본27×27px, 확대해도 41×41px로 끝내 44px 미도달. ✕-chevron 중심간43~47px·가장자리간15~19px. 홈 기본상태 44px미만 터치타깃 9개.
  problem: ①은 "기능없음"이 아니라 어포던스 부재(오버플로 수정 아니라 스크롤힌트 추가가 정답). ②는 파괴적동작(오늘하루숨김)과 내비게이션이 15px간격 인접 — 카드 열려다 알림 삭제 위험, 되돌리기 UI 없음.
  cause: ① `.scrollbar-hide` 전역 미학적용시 대체 어포던스 누락. ② ✕가 `absolute top-2 right-2 w-6 h-6`로 카드모서리, chevron은 Link내부 우측중앙 — 좌표계가 달라 간격 설계된 적 없음.
  fix: ① 스크롤러 좌우 mask-image 엣지페이드 + 마지막탭 4~8px 걸치는 peek 패딩. 탭3개이하로 안줄면 확대시 2행 wrap 허용. ② ✕ 최소44×44px(시각크기유지, ::before 히트영역확장)+chevron과 세로분리 또는 카드밖 우상단 이동(최소24px 이격, WCAG2.5.8). dismiss 후 "되돌리기" 스낵바.
  effort: S
  priority_guess: P2

## 다른 전문가와 상충 가능 지점

- **FAB 제거 권고**(finding 9-③) — E1이 "긴 홈에서 상단복귀 수단 필요"로 유지 주장 가능. E3 근거는 상시 본문23% 점유, 절충안은 "홈만 제거, 냉장고 음식탭 유지".
- **냉장고 칸 리스트뷰 전환**(finding 6-③) — Phase 8.0 공간시각화 컨셉을 확대시 포기하는 안이라 기획의도와 충돌 가능. 컨셉 유지시 ①②만 적용하고 잘림 감수해야 하며 그 경우 C8계열 사용자에겐 여전히 안 읽힘.
- **히어로 칩 분리**(finding 5-A) — 제철마케팅 노출량 감소가 제휴/수익 관점(E1)과 상충 가능. 다만 현재 문구가 사실 아닌 희소성 주장이라 유지는 비권장.

## 오케스트레이터 참고
- C4의 "전역 자동 전환" — E3 세션에서도 공유 pane 아티팩트로만 나타남(전용 탭 재확보 후 재측정), 앱 코드 근거 없음(E2·C8과 동일 결론, 4인째 독립 확인).
- E3_findings.md 이전 파일 없음 — 이번이 초판.
