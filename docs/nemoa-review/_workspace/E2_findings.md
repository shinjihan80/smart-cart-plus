# E2 (이현석 / 20년차 프론트엔드·풀스택) — 부정적/비판적 전문가 검토

대상: https://nemoa.vercel.app (커밋 515270d) · customer_findings: C1/C2/C4/C6/C8

- screen: 옷장 > 코디 탭 히어로 캐러셀 (src/lib/outfitMatcher.ts)
  observed: generateOutfits() 코드 직접 확인. (1) 111~112행 — 루프 안에서 `const sh = scoredShoes[0]?.item; const ac = scoredAccs[0]?.item;`로 매 조합마다 동일한 최고점 1개를 재대입. 113행 아우터도 scoredOuters[0] 고정. (2) 109~157행 — top5×bottom5 중첩 루프 + `result.length >= count` break → count=6일 때 첫 상의가 하의 5벌과 짝지어져 6장 중 5장 차지. (3) 149행 라벨이 `${t.item.name} 코디`라 그 5장 제목이 완전 동일. (4) seenSig가 accessory를 시그니처에 안 넣어 "거의 동일" 조합도 통과.
  problem: "6개 추천" UI(1/6 카운터+점6+화살표)로 약속해놓고 실제론 하의만 바뀐 같은 코디를 6장 보여줌. 카피↔동작 모순 — 신뢰 훼손. ba6c5bf 히어로 재설계가 버그를 만든 게 아니라 기존 결함을 전면에 드러낸 것.
  lens: 데이터 무결성 / 카피↔동작 정합성
  priority_guess: P0
  fix: 후보 곱집합 전부 점수화 → shoes/accessory/outer를 라운드로빈 배정 → 최종 선택은 그리디 MMR(이미 뽑힌 코디와 슬롯 겹칠 때 상의−2.0/하의−1.0/신발−0.5). label을 `${top.name} × ${bottom.name}`으로. seenSig에 accessory·outer 포함. 단위테스트: "상의2·하의5·신발3 → 결과6장 shoes.id distinct≥3, label distinct=6".
  effort: M

- screen: 홈 UrgentAlert/WeeklyInsight/QuickLinks배지/하단탭배지 — "1 vs 6 vs 6 vs 6" 불일치
  observed: 임박 판정 술어 4종 분기 확인. UrgentAlert.tsx:21 → today(0~1). WeeklyInsight.tsx:33-36 → today||soon(0~3). BottomNav.tsx:39/FridgeView.tsx:49 → !=='fresh'(expired 포함, 음수까지). QuickLinks.tsx:47 → classifyExpiry 안 거친 원시 `<= EXPIRY_SOON_DAYS` 비교(P0-30과 동일 패턴, 하한 없음).
  problem: 이번 세션 폰트 변경과 무관한 독립 결함(확정 — f2b1fdd는 className만 변경, 판정 술어 불변). QuickLinks의 하한 없는 비교는 P0-30 재발 패턴이 라이브에 살아있음 — 상한 지난 식품이 홈 배지 숫자에 포함.
  lens: 화면 간 수치 불일치의 코드적 원인
  priority_guess: P0
  fix: expirySelectors.ts 신설 — selectExpiring(items)가 {expired,today,soon,urgentTotal} 반환, 모든 화면이 이 필드만 사용(직접 calcRemainingDays 호출 금지). 배지는 urgentTotal(today+soon, expired 제외)로 통일. ESLint no-restricted-imports로 calcRemainingDays 직접 import 금지(위반 9곳: recipes.ts:960, nutritionAnalysis.ts:57, QuickLinks.tsx:47 등).
  effort: M

- screen: 옷장 전체 — C1 "URL 튕김·흰 깜빡임·혼자 홈으로" 건 판정
  observed: /wardrobe 라우트 존재 안 함(app 하위 15개 page.tsx 전수 확인). next.config.mjs에 redirects/rewrites 없음. 미들웨어 없음. closet/page.tsx:118은 useState('closet')뿐 — ?tab= 처리 자체가 없음(mypage/page.tsx:97엔 있음).
  problem: 이 코드베이스에서 해당 URL 튕김을 발생시킬 경로가 없음 — 셰어드 브라우저 아티팩트로 판정, P0에서 하향. 대신 진짜 결함: 옷장 4탭이 URL에 없어 딥링크 무시, 새로고침/PWA 재개 시 항상 '옷장' 탭 리셋, 코디 공유 URL 자체가 없음(C2 요구와 직결). 마이페이지는 되는데 옷장은 안 되는 일관성 붕괴.
  lens: 재현 조건 / 라우팅 구현
  priority_guess: P1 (원 P0 하향, 딥링크 부재를 신규 P1로 대체)
  fix: mypage 패턴을 옷장에 이식 — useSearchParams로 초기 탭 결정, router.replace('/closet?tab=outfit',{scroll:false})(push 아님), useSearchParams 사용 컴포넌트는 Suspense 경계 필요(Next16). 공통 useTabParam(key,allowed,fallback) 훅으로 마이페이지와 공유. 404 페이지 "⌘K" 안내는 모바일 조건부 숨김/문구 교체(S).
  effort: S

- screen: 전역 — globals.css:49-55 + f2b1fdd 폰트 위계 정리
  observed: `html { font-size: 18px }` 하드코딩 — 사용자 브라우저/OS 글자 크기 설정 완전 무시. text-[10px] 50곳, text-[11px] 17곳이 rem기반 text-xs(499곳)와 혼용(WeeklyInsight 요일/범례, WardrobeView:113 카운트배지, OutfitCard:75,88,94 compact라벨 등 전부 이번 세션 변경 영역).
  problem: 이번 세션 "폰트 위계 정리"는 rem축만 내리고 px축은 안 건드려 위계가 더 뭉개짐(C1 지적과 일치). font-size:18px + text-size-adjust:100% 조합은 시스템 글자 확대를 해도 앱 글자가 안 커지게 함 — WCAG 2.1 SC 1.4.4 실패. C8(눈 침침한 42세)이 핵심 페르소나인 앱에서 제품 결함.
  lens: 접근성 구현 / 타이포 시스템
  priority_guess: P1
  fix: html { font-size: 112.5% }로 교체(기본16px 환경에서18px 유지, 사용자 확대시 비례). 의미기반 6단계 rem 토큰 정의(caption/meta/body-sm/body/title/hero). text-[10px]/[11px] 67곳 codemod 치환. ESLint no-restricted-syntax로 text-[Npx] 신규 금지. 치환 후 시스템 글자 "가장 크게" 상태로 375×812 3화면 오버플로 회귀 확인(E3 연계).
  effort: M

- screen: 옷장 > 코디 탭 캐러셀 컨트롤 (OutfitGrid.tsx:106-141)
  observed: 화살표 w-9 h-9=36×36px 실측. 점 인디케이터 h-1.5 w-1.5=6×6px(활성만 w-5). 둘 다 패딩 없어 히트영역=시각크기. 카드 본체엔 스와이프 제스처 없음(포인터 캡쳐 우려로 의도적 생략, 주석 확인).
  problem: 44×44px(WCAG 2.5.5/HIG) 기준 미달. 6px 점은 모바일에서 조준 사실상 불가. 화살표가 카드 위 absolute로 얹혀 그림을 가림(C1·C2 공통).
  lens: 터치 타깃 44px / 인터랙션 구현
  priority_guess: P1
  fix: 점은 시각크기 유지, 버튼에 p-2.5 -m-2.5로 44px 히트박스 확보. 화살표는 w-11 h-11(44px)로 키우고 카드 바깥 하단 행으로 이동. 순수 포인터 이벤트 스와이프 추가(pointerdown/up deltaX>40, touch-action:pan-y). 1/6→6/6 순환은 양끝 disabled+opacity-40 처리 또는 점으로 순환임을 명시.
  effort: S

- screen: 옷장 > 코디 탭 "아직 안 입어본 옷" ↔ 마이 옷장정리제안 (C1 "21/4/5" 보고)
  observed: closet/page.tsx:505-508 — activeClothing(현재 옷장+비보관)→의류만→wearLog 0→**slice(0,5)**, 그리고 514행이 `아직 안 입어본 옷 {untried.length}벌`로 **이미 5개로 잘라낸 배열의 length를 표시**. ClosetCleanupSection.tsx:86은 candidates.length(60일 미착용+미착용 전체, 신발·가방·액세서리·다른 옷장인스턴스 전부 포함). 세 화면 모집단 정의가 전부 다름.
  problem: slice(0,5)한 배열의 length를 개수로 쓰는 건 명백한 구현 버그 — 실제 12벌이어도 영원히 "5벌"로 표시. 신뢰 훼손.
  lens: 데이터 무결성
  priority_guess: P1
  fix: untriedAll(전체 필터)과 untried=untriedAll.slice(0,5) 분리, 라벨은 untriedAll.length 사용. closetCleanup.ts에 selectUnworn(items,wearLog,{scope}) 공통 셀렉터 추가해 옷장·마이 공유. 카드 부제에 모집단 한 줄 명시.
  effort: S

- screen: 옷장 > 옷장 탭 (WardrobeView.tsx) — 이번 세션 f4a115d·515270d 수정분 검증
  observed: 515270d의 justify-between→flex-col gap-2로 3칸 제목 높이 어긋남 해소 확인(C1·C2·C6 지적 건 해결). 단, 122/124행 라벨·힌트가 1행 truncate라 좁은 3칸에서 한국어 라벨 잘림 가능. 큰 2칸 카드(걸이·서랍)는 정보밀도가 낮아 우측·하단 절반이 빈 공간으로 남음(C1·C2 지적).
  problem: 두 커밋이 증상 대증 요법 — 줄이면 잘리고 맞추면 빈 공간 남는 순환. 옷 이름이 한 개도 안 나옴(냉장고 FridgeView는 이름 표시).
  lens: 텍스트 오버플로우 / 컴포넌트 일관성
  priority_guess: P2
  fix: truncate→line-clamp-2 + break-keep(한국어 단어 끊김 방지). 빈 공간에 상위 아이템 이름 2~3개 칩으로(FridgeView 패턴 재사용). 좁은 칸 썸네일은 grid-template-columns auto-fill로 폭에 맞춰 자동 결정.
  effort: M

- screen: 옷장 > 코디 탭 (성능)
  observed: closet/page.tsx의 allClothing/activeClothing/items가 useMemo 없이 매 렌더 새 배열 생성 → OutfitGrid의 useMemo 의존성이 매번 바뀌어 구조적으로 히트 안 함. season도 매 렌더 new Date() IIFE.
  problem: 검색어 입력 등 리렌더마다 generateOutfits() 전체 재실행. 옷장 규모 커지면 저사양 안드로이드에서 입력 지연.
  lens: 성능 / 렌더 비용
  priority_guess: P2
  fix: closet/page.tsx의 파생값들을 useMemo로 감싸고 의존성 명시. season은 useMemo(()=>currentSeasonByMonth(),[]). OutfitGrid를 React.memo로.
  effort: S
