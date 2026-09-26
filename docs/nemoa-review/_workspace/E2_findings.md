# E2 (이현석 / 20년차 개발자) — 2026-09-27 재검토

대상: https://nemoa.vercel.app · 375px 고정 + 루트폰트 18→24→27px 실측 · 소스 대조 `src/`

## 발견

- screen: 전역 — 접근성 확대 시 레이아웃 (냉장고 > 🍽️음식 탭에서 측정)
  observed: 루트 18→24→27px 실측. 카드 내 rem 치수 전부 커짐(썸네일 108→162px, 패딩 22.5→33.75px, gap 18→27px, D-day 블록 52→70px) → 제목 가용폭 166→97→**63px**로 역전 축소.
  problem: 확대할수록 텍스트 자리가 좁아짐 — C8이 관측한 모든 확대 증상(냉장고 칸 축소·홈 카드 183→124px·카테고리 타일 겹침·히어로 7줄 붕괴)의 **단일 공통 원인**. WCAG 1.4.4 실패.
  cause: Tailwind v4 spacing이 전부 rem 기반인데 P1-48의 `html{font-size:112.5%}`로 폰트뿐 아니라 **모든 레이아웃 치수가 루트에 연동**됨. 뷰포트(px)는 고정이므로 확대분(+103.5px)이 장식 치수(썸네일·패딩·갭)에 먼저 먹히고 차액이 텍스트 영역에서 빠짐. P1-48이 "장식 치수는 확대를 따라가면 안 된다"는 구분을 안 둔 게 누락.
  fix: (1) 확대 비추종 고정 px 토큰 신설(`--size-thumb:96px`, `--pad-card:20px`, `--gap-card:16px`). (2) 썸네일·카드패딩·그리드갭·아이콘박스를 임의값(`w-[var(--size-thumb)]` 등)으로 교체 — 대상: SwipeFoodCard/SwipeClothingCard/FridgeView/WardrobeView/홈 알림카드 3종/카테고리 그리드. 폰트·line-height·radius는 rem 유지. (3) Playwright 회귀 테스트로 루트 27px에서 `scrollWidth>0 && clientWidth===0`인 요소 0건 단정.
  effort: L (규칙 S, 적용 M, 테스트 S — 합 1주)
  priority_guess: P0 (신뢰 훼손 — 확대 사용자에게 핵심 정보 소실)

- screen: 냉장고 음식 카드 제목 (`SwipeFoodCard.tsx:123`) · 옷장 카드 제목(`SwipeClothingCard.tsx:129`, 동일 코드 복제)
  observed: `text-[15px] truncate flex-1` + 형제 D-day(`text-sm shrink-0`, rem이라 확대시 커짐). clientWidth: 기본105→133%21→150%**0**(scrollWidth 84~110 그대로). 20개 카드 전부 동일.
  problem: 확대하면 이름이 통째로 0px로 사라짐 — 사진·D-day만 남아 "뭐가 D-0인지" 알 수 없음.
  cause: (1) `text-[15px]` 절대값이라 정작 커져야 할 이름만 고정. (2) `truncate`가 flex item의 `min-width:auto`를 무효화해 하한 없음. (3) 형제가 `shrink-0`+rem이라 확대시 혼자 커져 남는 폭을 다 가져가고 이름이 0까지 압축.
  fix: `text-[15px]`→`text-[0.9375rem]`(렌더 동일, 확대 추종), `truncate`→`line-clamp-2 break-keep`, 컨테이너 `min-w-[8rem]` 하한. D-day는 `shrink-0` 유지하되 컨테이너 `flex-wrap`으로 좁을 때 아래줄로. 두 파일 동일 수정. ESLint로 `text-\[\d+px\]` 신규 유입 차단(아래 항목과 공통 가드).
  effort: S (반나절)
  priority_guess: P0 (신뢰 훼손)

- screen: 전역 (냉장고 칸 그리드·하단 탭바·배지·주간 인사이트) — 절대 px 폰트 85곳
  observed: `src` 전체 `text-[Npx]` 85곳(10px 50/11px 17/9px 6/12px 4/8px 2/15px 2/13px 2). 최다: ProPreviewCard 13, TextImportModal 10, FridgeView 5, WeeklyInsight 4, TodayDishCard 4, FridgeSectionPicker 4, BottomNav 3. 루트 18→27px에도 개수·크기 불변. `text-size-adjust:100%`는 `layout.tsx:23`의 `width=device-width, initialScale:1`로 인해 애초에 no-op — 원인 아님, 순수 절대px 85곳이 범인.
  problem: OS 글자 확대해도 화면 작은 글자 절반이 안 커짐. 8~11px는 기본 상태서도 모바일 최소 가독(12px) 미달. WCAG 1.4.4 실패.
  cause: 타이포 스케일 토큰이 없어 "Tailwind 프리셋보다 작게"가 매번 임의 px로 해결됨. P1-48이 루트를 %로 바꿨지만 하위 절대px 85곳을 같이 정리 안 해 스케일이 두 갈래로 갈림.
  fix: (1) `@theme`에 `--text-2xs:0.6875rem`(11px 상당)/`--text-3xs:0.625rem`(10px 상당) 추가, 기본 렌더값 보존(시각 회귀 0). (2) `text-[10px]`→`text-3xs`, `text-[11px]`→`text-2xs`, `text-[9/8px]`→`text-3xs`, `text-[12/13px]`→`text-xs` 일괄 치환(79곳, sed 가능). (3) ESLint `no-restricted-syntax`로 `text-[Npx]` 신규 차단 — 핵심, 없으면 재발. (4) 하단탭바 라벨/배지 최소 12px 상향 여부는 E3 판단 연계.
  effort: M (토큰+치환 반나절, ESLint 가드 반나절, 79곳 육안회귀 1~2일)
  priority_guess: P0 (접근성 — 신뢰 훼손)

- screen: 냉장고 > 🧊냉장고 탭 (칸 그리드, `FridgeView.tsx`)
  observed: `grid gap-2 p-3` + `minmax(64px, auto)`(line 40), 제목 `text-[11px] truncate`(101), 내용 `text-[10px] line-clamp-1`(103/105). 실측(11칸): 기본에서 "냉동실 위칸" 49/50(이미 1px 잘림). 루트27px에서 칸폭 71→**60px**(gap-2·p-3가 rem), 제목26/50·내용26/26. 칸 높이는 265→350px로 커짐(세로만 확장). WardrobeView는 제목이 `text-sm`이라 상대적으로 양호.
  problem: 냉장고 칸 이름이 기본상태서도 잘리고 확대시 폭이 더 줄어 더 잘림 — C8의 2026-09-23 지적 미해소.
  cause: 칸 크기 제약이 높이만 있고(`minmax(64px,auto)`) 폭 하한이 없음(`minmax(0,1fr)`). 375px에서 p-3·gap-2 제하면 칸당 60px인데 "냉동실 아래칸"(6자)엔 59px 필요. 확대시 p-3/gap-2가 rem이라 더 깎임.
  fix: (1) `p-3`/`gap-2`를 고정px 토큰(`p-[12px] gap-[8px]`)으로 — 확대해도 칸폭 유지. (2) 제목 `truncate`→`line-clamp-2 break-keep`, `text-[11px]`→`text-2xs`. (3) 장기: `FRIDGE_SECTION_META`에 `shortLabel`("냉동↑" 등) 추가 — 그리드는 축약형, 상세시트는 정식 라벨(E3 협의).
  effort: M (1·2는 S, shortLabel은 11칸×4모델이라 M)
  priority_guess: P1(기본상태 1px 잘림이라 P0 후보 — 오케스트레이터 판단)

- screen: 냉장고 음식 카드 접힌 상태 — 구매일 무라벨 (`SwipeFoodCard.tsx:142-149`)
  observed: 코드 주석 "구매일 + 만료일 — 한 줄"인데 실제 렌더는 `📅{purchaseDate}` 하나뿐, 라벨 없음. 만료일은 상대값("3일 남음")으로만. 펼친 상세(224-230)는 "구매일"/"보관 기한" 라벨 정상 — **접힌 카드만 문제**. 무라벨 절대날짜 출력은 전역 grep으로 이 한 줄이 유일.
  problem: 달력아이콘+날짜는 관례상 기한으로 읽힘 — "09/20·3일 남음"(오늘 09/27)이 산술 안 맞아 보여 D-day를 못 믿게 됨(C1·C9·C8 3인 독립 지적).
  cause: 카드 압축 과정에서 "구매일+만료일" 설계가 만료일 절대값만 누락된 채 구현(주석↔코드 불일치가 증거), 남은 하나에 라벨 미부착.
  fix: 만료일 중심으로 교체 — `🗓 {expiryStr}까지 · {dDay}일 남음`. `expiryStr`은 line230 계산을 `dateMath.ts`에 `expiryDateStr(item)` 헬퍼로 추출해 공유. 구매일을 남기려면 `📅 산 날 09/20`(C9 제안).
  effort: S (헬퍼 1개+1줄 교체, 반나절 — **투입 대비 신뢰회복 효과 이번 라운드 최고, 최우선 착수 권고**)
  priority_guess: P0 (신뢰 훼손 — 날짜 데이터 오해)

- screen: 홈 > 오늘 할 일 > 임박 식품 카드 (P1-51 dedup 사후 검증)
  observed: `UrgentAlert.tsx:22` `selectExpiring(items).today` — `EXPIRY_TODAY_DAYS=1`이라 dDay 0·1이 같은 'today' 버킷. line48 "오늘까지 먹어야 할 식품 N개" 고정. dedup(line24 excludeNames)이 유일한 진짜 D-0을 빼면 남은 2건이 전부 D-1인데도 "오늘까지" 유지. line23에서 dDay를 map으로 가져오지만 렌더에 미사용.
  problem: 라벨-실제D-day 불일치(C4·C8 독립 지적) — **P1-51의 회귀는 아니나 P1-51이 노출시킨 기존 결함**.
  cause: 임계값 상수(`EXPIRY_TODAY_DAYS=1`)와 표시 문구(`EXPIRY_LABEL.today='오늘까지'`)가 같은 파일에 있으나 의미가 다름(버킷=오늘+내일, 라벨=오늘). 경계 변경 시 라벨 동반검토 장치 없음.
  fix: dDay가 이미 엔트리에 있으므로 렌더 분기. (1) `allToday = urgent.every(u=>u.dDay===0)`로 "오늘까지 N개"/"오늘·내일 N개" 선택. (2) 더 나은 안: 품목별 "이름(오늘)"/"이름(내일)" 칩 — 아래 NameChips 항목과 통합 해결. (3) `EXPIRY_LABEL`에 `todayOrTomorrow:'오늘·내일'` 추가, `EXPIRY_TODAY_DAYS` JSDoc에 "값 변경시 EXPIRY_LABEL.today도 같이 고칠 것" 명시.
  effort: S (반나절)
  priority_guess: P1 (신뢰 훼손 — 카피↔데이터 불일치)

- screen: 전역 — C4의 "자동 화면 전환" P0 주장 코드 판정
  observed: 클라이언트 내비게이션 호출 12곳 전수 확인, 조건 없는 자동 실행 0건, 타이머 내 내비게이션 0건. 내역 전부 onClick/사용자액션/OAuth 서버 리다이렉트. `useEffect` 내 내비게이션은 closet/seasonal 2곳뿐이고 둘 다 같은 경로 `?tab=` 쿼리 동기화용(다른 라우트로 안 보냄). 라이브 검증 중 E2 전용 탭이 `/fridge`→`/`로 실시간 이동, 뷰포트가 임의로 375x812로 변경되는 것을 직접 관측 — 다른 세션의 동시 조작 확인.
  problem: **코드상 근거 없음 — 공유 브라우저 탭 아티팩트로 최종 판정.** C8의 정정이 코드로 뒷받침됨. 단, C4가 같이 보고한 URL↔DOM 불일치는 별개의 실재 버그(아래).
  cause(URL-DOM 불일치, 실재): `mypage/page.tsx`에 `useRouter` 자체가 없음(grep 0건). 탭 전환(204-209)이 `setActiveTab`+`scrollTo`만 하고 URL 미갱신, `?tab=` 파싱 useEffect(98-124)는 `[]` 의존성 마운트 1회뿐. `/mypage?tab=profile` 진입 후 쇼핑탭 클릭 시 주소는 `?tab=profile`인데 화면은 쇼핑 — C4 관측 그대로, 단독세션 100% 재현. `usePersistedState('nemoa-mypage-tab')`로 localStorage 기억해 쿼리없는 진입시 지난 탭 복원 → 공유링크/뒤로가기 깨짐. `fridge`도 `useRouter` 없음. `closet`만 `router.replace` 동기화 — 3개 탭 구현이 서로 다른 규칙.
  fix: `useUrlTab<T>(key, tabs, storageKey?)` 훅 신설 — 마운트시 `location.search`에서 초기값, selectTab에서 `router.replace`, popstate 구독. mypage/fridge/closet 3페이지 교체(closet 중복로직 제거). localStorage persist는 쿼리 없을 때만(우선순위: 쿼리>localStorage>기본값).
  effort: M (훅 S + 3페이지 교체·회귀 M, 2~3일)
  priority_guess: 자동전환=미등록(아티팩트) / URL-DOM 불일치=P1

- screen: 냉장고·옷장·마이페이지 상단 탭 스트립
  observed: `overflow-x-auto scrollbar-hide` + `shrink-0 whitespace-nowrap`(fridge/closet/mypage 동일구조). 실측 375px: 기본폰트 clientWidth375/scrollWidth**377**(이미 2px 넘침), 마지막 탭 "🛒장보기" right=377. 루트27px에서 scrollWidth563/right563. `.scrollbar-hide`가 스크롤바 완전 은닉.
  problem: **C8 진단 정정** — 탭이 "사라지는" 게 아니라 가로스크롤은 정상 동작하되 어포던스가 0. 확대 사용자에겐 "장보기 탭이 없는 앱"으로 보임. 기본폰트도 2px 초과.
  cause: `overflow-x-auto`+`scrollbar-hide` 조합이 스크롤 가능성을 시각적으로 지움 — 대체 어포던스 부재. 4탭 구성 자체가 375px에 2px 초과해 기본상태도 경계선.
  fix: (1) `scrollLeft/scrollWidth` 구독해 좌우 `mask-image` 페이드 토글하는 `useScrollHint()` 훅, 3페이지 스트립+closet 캐러셀에 공용 적용. (2) `scroll-snap-type:x mandatory`+`snap-start`로 스와이프 촉각 피드백. (3) 활성탭 전환시 `scrollIntoView({inline:'nearest'})`로 화면밖 활성탭 방지.
  effort: M (훅+3페이지+캐러셀 재사용, 2~3일)
  priority_guess: P1

- screen: 홈 > 오늘 할 일(임박카드 본문·옷장정리카드) > 지금 가을철 식탁 — join+truncate 패턴
  observed: 기본375px에서 잘림 2건, 둘다 `truncate`+`join`. `UrgentAlert:53-54` join(', ') → 184/223. `SeasonalHintWidget:72` join(' · ') → 193/294. 동일패턴 `RebuyAlert:46`, `FridgeView:106`, `RecipeSection:134`, `OutfitCard:40`. 별건: `SeasonChangeAlert:66` `messageParts.push(\`${toStow}벌 보관할 때\`)` — 조각 1개만 남으면 짝없이 "3벌 보관할 때 · 정리하기" 미완성 문장(C1·C4·C8·C9 4인, 2라운드 미해소).
  problem: "오늘 뭘 해야 하는지" 답인 품목명이 기본상태서도 잘려 냉장고 재진입 필요.
  cause: "N개→문자열1개→한줄truncate"가 홈 위젯 공통 패턴. flatten하면 길이 제어권 상실.
  fix: (1) 공용 `<NameChips names max={2}/>` 신설 — 개별 span칩, 넘치면 +N. 잘림 원천 차단, 위 "오늘/내일" 표기도 칩에 얹으면 동시 해결. 적용: UrgentAlert:53/RebuyAlert:46/SeasonalHintWidget:43,72/FridgeView:106/OutfitCard:40. (2) SeasonChangeAlert은 join 버리고 `<ul>` 렌더 또는 완결형 문구("${toStow}벌 보관할 때예요").
  effort: M (컴포넌트S+6곳적용M, SeasonChangeAlert만이면 S)
  priority_guess: P1 (문장조각 건은 P2)

- screen: 홈 > 오늘 할 일 카드 닫기(✕) (`UrgentAlert.tsx:60-67`)
  observed: `w-6 h-6`=1.5rem=기본환경 27px. 카드 전체가 `<Link>`이고 우측중앙에 ChevronRight도 있음. ✕는 absolute 배치.
  problem: WCAG 2.5.5 최소 터치타깃(44px) 미달. 10px만 놓쳐도 의도와 반대로 냉장고 이동. 반대로 ✕ 오탭시 "오늘 안 보기" 적용되고 되돌리기 UI 없음(C1·C8 지적).
  cause: 시각크기=터치타깃(`w-6 h-6`이 곧 히트영역). 히트영역만 확장하는 공통 유틸 부재.
  fix: (1) `.touch-target-44::after{content:'';position:absolute;inset:-9px}` 유틸 추가해 ✕에 적용(아이콘은 작게, 히트영역만 44px+, inset은 px로 확대비추종). (2) ✕를 카드 바깥 또는 >와 충분히 이격. (3) dismiss 직후 "오늘 안 보기 적용—되돌리기" 토스트(ToastContext 기존 활용). (4) `w-6 h-6` 이하 아이콘버튼 전역 grep 일괄 적용.
  effort: S (유틸+UrgentAlert 반나절, 전역 일괄이면 M)
  priority_guess: P2

## 오케스트레이터 참고 (finding 아님)

1. **P1-51/52 사후검증: 구조는 정상 배포.** DOM 실측으로 3존 순서 확인(오늘할일 y=377→그리드→오늘의나 y=842→둘러보기 y=1439). 콘솔에러 0, SW active. excludeNames dedup 코드·렌더 양쪽 확인. **P1-51/52 자체 회귀는 없음** — "오늘까지" 라벨 문제는 P1-51 이전부터 있던 `EXPIRY_TODAY_DAYS=1` 설계 결함이며 dedup이 가시화했을 뿐(E1과 동일 결론, 독립 확인).
2. C4의 "전역 자동 전환" P0 → **코드상 근거 없음, 공유 브라우저 탭 아티팩트로 최종 판정**(E2 실시간 관측으로 재확인). URL↔DOM 불일치(mypage `useRouter` 부재)는 실재 버그로 별도 등록.
3. 다음 라운드 권고: 세션마다 전용 `tabId`로 `preview_start` 하되 다른 세션이 `tabId` 없이 호출하면 활성탭이 간섭받음 — 확대/내비게이션 검토는 병렬 세션 없는 시간대에 단독 권장.
4. 착수 순서 권고: ①📅구매일 라벨(S, 신뢰회복 최대) → ②"오늘까지" 라벨 정확화(S) → ③절대px 85곳 토큰화+ESLint가드(M) → ④rem/px 역할분리+확대회귀테스트(L). ③④를 가드 없이 하면 재발.
5. E3와 상충 가능: `text-3xs`(10px상당) 토큰화는 렌더값 보존안 — E3가 "10~11px 자체를 12px+로 올려야" 판단하면 하단탭바·배지 재설계 대상. E2는 "1단계 값보존 토큰화 → 2단계 크기상향" 순서 권장(한번에 하면 회귀원인 분리 불가).
6. 미확인 범위: Lighthouse 정식실행(공유pane 간섭 미수행), 오프라인/SW캐시, 실기기 Android 글자슬라이더(루트폰트 시뮬레이션으로 대체). `text-size-adjust:100%`는 `width=device-width`라 무해한 no-op으로 판단, 실기기 확인 권장.
