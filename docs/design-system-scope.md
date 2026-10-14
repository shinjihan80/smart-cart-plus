# NEMOA 디자인 시스템 — 범위 정의

> `docs/nemoa-review/수정목록.md`의 P1/P2 중 "버그"가 아니라 "토큰·컴포넌트가 아예 없어서" 반복 재발하는 항목들을 모아 별도 트랙으로 분리한다. 2026-10-14, 비판 모드 재검토(C1~C10, E1~E3) 라운드에서 기술 버그 11건을 순차 수정하는 과정에서 "이건 버그가 아니라 디자인 시스템 부재가 원인"으로 판정해 보류한 항목들의 후속.

## 왜 지금 분리하나

이번 기술 버그 라운드에서 반복된 패턴: 같은 화면을 3~4라운드 연속 다른 페르소나가 "망가졌다"고 지적하는데, 매번 원인이 "공용 토큰/컴포넌트가 없어서 화면마다 각자 구현했고 그중 하나만 고쳐졌다"였다. 예:

- P1-75(냉장고 배지 오독)는 이번에 고쳤지만, 같은 그리드 셀 패턴이 `WardrobeView.tsx`에도 독립 구현돼 있어(P1-27) 다음에 같은 버그가 재발할 수 있다.
- P1-83(경고색 대비)에서 `brand-warning` 값 하나만 바꿨지만, 그 색이 "미백업"(권유)·"임박"(주의)·"결제 실패"(긴급) 전부에 같은 강도로 쓰이는 근본 원인(P2-4)은 그대로다.
- `CARD` 상수가 fridge/closet/mypage/home 4곳에 각각 다른 값으로 존재한다(P2-16) — 탭을 넘나들 때마다 카드 모서리가 바뀐다.

이 문서는 "토큰을 만들고 전역 치환하는" 작업을 하나의 트랙으로 묶어 범위·순서·완료 기준을 정의한다.

## 진행 상황

| 단계 | 상태 | 날짜 | 커밋 |
|---|---|---|---|
| 1. A+B+D 토큰 선언 | ✅ 완료 | 2026-10-14 | (아래 참고) |
| 2. B 전역 치환(`brand-warning`/`brand-accent` 재배치) | ✅ 완료 | 2026-10-14 | (아래 참고) |
| 3. A+D 전역 치환(text/radius 리터럴) | ✅ radius 완료 · text 부분 완료(28/89, 나머지는 Step 5로 이월) | 2026-10-14 | (아래 참고) |
| 4. C 아이콘 언어 통일 | ✅ 탭 스트립 3개 완료 · 전체 앱 전수 감사는 미착수 | 2026-10-14 | (아래 참고) |
| 5. D+E 컴포넌트화 | ✅ Field.tsx·Surface.tsx·AppHeader·EmptyState·WardrobeView(버그 해소+wide/narrow variant) 완료 — `FoodAttributeFields.tsx` 완전 통합·공용 그리드 셀 컴포넌트는 제품 판단 필요해 의도적 보류 | 2026-10-14 | (아래 참고) |
| 6. F 레이아웃 보강 | 🔶 진행 중 — FoodSummaryStats(P1-108)·touch-target-44 11곳(P1-17)·useScrollHint()+메인 탭 2곳(P1-59 일부)·NameChips+UrgentAlert(P1-66) 완료, 그리드→리스트 자동전환(P1-27 후반)·WaitlistBanner+RecipeDetailModal+InstallBanner(간격 부족)는 미착수 | 2026-10-14 | (아래 참고) |
| 7. B 다크모드 | 대기 | | |

## 이번 트랙에 포함되지 않는 것

아래는 디자인 시스템과 맞닿아 있지만 **제품/카피/정보구조 판단이 선행돼야** 해서 이 트랙에서 제외한다. 토큰 작업이 끝나면 이 항목들을 적용하기는 더 쉬워지지만, 토큰 자체가 이 항목들의 완료 조건은 아니다.

| ID | 내용 | 제외 이유 |
|---|---|---|
| P1-1 | 홈 진입점 과잉, 8칸 그리드 삭제 | IA 재설계 — 어떤 화면을 남기고 지울지는 제품 결정 |
| P1-3, P1-12, P1-22 | 온보딩 단계 축소·모달 중첩 | 온보딩 플로우 재설계 |
| P1-11 | 용어 통일("마이"→"내 정보" 등) | 카피/용어집 작업 |
| P1-24 | 요약 탭 12섹션 그룹핑 | 정보구조 재배치 |
| P1-78 | 홈 카피 톤 16종 재작성 | 카피 라이팅 |
| P1-6, P1-80 | 가치 증명 지표(절약 금액 등) 신설 | 새 기능 설계 + 데이터 모델 추가 |
| P2-11 | 제철·레시피·활동 홈 배치 재구성 | IA 재설계 |
| P1-13 | 빈 상태 1순위 CTA를 "등록"으로 전환 | 어떤 CTA가 1순위인지는 제품 결정(컴포넌트는 Workstream E가 지원) |
| P1-38 | 의류 등록 시 사진 유도 | 새 기능 |
| P2-48 | 알림 기본값 변경 | 이미 이전 라운드에서 "제품 판단 필요"로 정식 보류됨 |

## 포함 범위 — 7개 워크스트림

### A. 타이포그래피 토큰화
**대상:** P2-3, P2-28 (P1-48은 루트 `18px`→`112.5%` 전환까지는 이미 완료 — 이 둘은 그 위에 쌓을 정식 스케일이 없다는 다음 단계)

- 현재 `text-[Npx]` 리터럴 10종 97곳(실측: 10px×52, 11px×23, 9px×7, 13px×4, 12px×4, 8px×2, 15px×2, 32/24/16px×1) — 임의 하한이 계속 새로 생기는 구조
- `gray-400`(#99a1af) 본문 대비 2.6:1(WCAG AA 4.5:1 미달), 카드 제목·버튼에도 쓰임
- 산출물: 5단 타입 스케일 토큰(13px 하한) + `--text-muted` 등 시맨틱 텍스트 색 3단(4.83:1 하한), gray-400을 텍스트 팔레트에서 제외
- CI 대비 검사는 Workstream F(QA 인프라)로 분리

**완료 메모(일부, 2026-10-14)**: `text-[Npx]` 리터럴 89곳(재실측 — 원 발견 97곳에서 소폭 변동) 중 여유 공간이 있는 28곳만 `text-xs`(13.5px 하한)로 먼저 치환. 나머지 61곳(배지·그리드 셀·가격비교표·막대그래프·2열 폼 등)은 "그냥 키우면 깨짐" 범주라 Workstream D/E 컴포넌트화와 함께 재설계하는 게 맞다고 판단해 이월 — 자세한 기준은 커밋 메시지 참고. `--text-muted` 등 시맨틱 텍스트 색 2단(`ink-secondary`/`ink-muted`)은 Step 1에서 이미 선언 완료(브랜드 잉크는 기존 `--color-brand-ink` 재사용이라 3단째는 신설 안 함), 실사용 전역 치환은 아직.

### B. 색상 시스템 (다크모드 선행 조건)
**대상:** P2-4, P1-64, P1-69, P2-30 → **P2-7(다크모드)는 이 워크스트림 완료 후에만 착수 가능**

- `danger/caution/info` 3단은 이미 CSS 변수로 존재하지만 실사용 3곳뿐(실측) — `brand-warning`(#DC2626, 이번 라운드에서 대비는 이미 수정)이 30개 파일에서 여전히 유일한 경고색으로 쓰임 → "미백업 권유"와 "결제 실패"가 같은 강도로 보임
- `brand-accent` = `brand-primary` 동일값이라 urgent/insight를 색으로 구별 못 함(P1-69)
- 코디 카드 배경색(`categoryImages.ts` 13색)이 인접 카테고리 간 CIELAB ΔE*ab 1.78(JND 2.3 미만, 사실상 안 보임) — 별도 소규모 서브태스크(P2-30)
- 순서: ① 3단 색 의미 확정 → ② `brand-warning` 30곳을 danger/caution으로 의미별 재배치(히어로·냉장고카드·홈배너 ~15곳 우선, 나머지 점진) → ③ `brand-accent` 제거 또는 재바인딩 → ④ 색을 CSS 변수로 완전히 추출(다크모드 전제 조건) → **이후 P2-7은 별도 트랙으로 착수 가능**

**완료 메모(①②③, 2026-10-14)**: `brand-warning` 70곳(29파일)·`brand-accent` 8곳(3파일) 전수 재분류, 두 토큰 모두 `globals.css`에서 삭제(재유입 차단). 분류 기준: ①진짜 심각도 신호(expired/초기화/확정삭제=danger, 임박/미백업/복구가능한 안내=caution, 제안·인사이트=info) ②심각도가 아닌 장식용 강조(즐겨찾기 하트·난이도 배지 등 — brand_accent=brand_primary라 보조 강조색이 없어 빨강을 끌어쓰고 있었다는 P2-4의 진단이 실제로 다수 발견됨)는 brand-primary로 재배정. `SwipeFoodCard.tsx`의 expired+today 결합 버킷도 이번에 분리(expired=danger, today=caution). ④(CSS 변수 완전 추출)는 아직 — 지금은 Tailwind 유틸리티 클래스로만 참조되고 있어 다크모드 착수 전 별도 확인 필요.

### C. 아이콘 언어 통일
**대상:** P2-1, P2-29

- lucide 라인아이콘과 이모지(탭 라벨·썸네일)가 한 화면에 공존, `🧑‍🦳` 같은 ZWJ 이모지는 구형 안드로이드에서 깨짐
- 최근 라운드(옷장·코디 재설계)가 오히려 이모지를 확대한 역행 사례 있음(탭 스트립 컬러 이모지, 히어로 54px 이모지)
- 규칙: "이모지는 사용자 데이터(등록한 옷·음식)에만, 앱 크롬(탭·헤더·버튼)은 라인아이콘만" — 탭 데이터 스키마를 `{icon: LucideIcon, label}`로 타입 레벨 강제(`WARDROBE_SECTION_META.emoji`도 포함)해야 재발 방지가 됨, 단순 치환만으로는 다음 기능 추가 때 또 이모지가 섞여 들어옴

**완료 메모(탭 스트립 3개, 2026-10-14)**: mypage/fridge/closet의 `TABS`/`FRIDGE_TABS`/`CLOSET_TABS`를 `emoji: string` → `icon: LucideIcon`으로 타입 레벨 전환(가장 구체적으로 지목된 역행 사례). `inst.emoji`(냉장고·옷장 인스턴스명 커스텀 이모지)·`tone.emoji`(카테고리 대표 이모지)는 사용자 데이터라 그대로 유지 — `EmojiIcon.tsx`가 이미 구현해둔 "앱 크롬=라인아이콘/사용자 데이터=이모지" 원칙과 일치. "히어로 54px 이모지" 사례는 현재 코드에서 특정 안 됨(이전 스냅샷 기준으로 추정, 다른 수정 과정에서 이미 해소된 듯). `WARDROBE_SECTION_META.emoji` 등 앱 전체 이모지 전수 감사(냉장고/옷장 섹션 메타, 헤더 아이콘 등)는 Step 3의 text 리터럴 치환급으로 범위가 커 미착수 — 별도 후속 필요.

### D. Surface/Radius/카드 컴포넌트
**대상:** P2-5, P2-16, P1-27(그리드 셀 통합 부분)

- `CARD` 상수가 fridge(`rounded-[32px]`+border)/closet(fridge와 동일)/mypage(`rounded-[24px]`, border 없음)/home(자체 variant 시스템)에 각각 다르게 존재 — 실측 확인됨
- radius 리터럴 6종 68곳(32px×29, 28px×17, 24px×13, 20px×4, 18px×4, 22px×1), `rounded-3xl`(27px, rem 기반)과 `rounded-[28px]`(리터럴)이 1px 차이로 나란히 쓰임
- `border-gray-50` 대비 1.03:1 = 사실상 안 보이는 테두리
- 헤더 액션 배치가 화면마다 다름(홈: 종+아바타 / 옷장: 돋보기 / 마이: 돋보기+톱니)
- `FridgeView`/`WardrobeView`가 같은 "모델 그리드 + 칸 셀" 개념을 99줄/145줄로 각자 구현해, 한쪽만 고쳐지고 한쪽은 남는 패턴이 이번 라운드(P1-75)에서도 재현됨 — 공용 그리드 셀 컴포넌트로 통합
- 산출물: `Surface`(card/panel/sheet 3 variant) + `AppHeader`(액션 슬롯 순서 고정) + `--radius-card/chip/control` 3단 토큰 + 공용 그리드 셀 컴포넌트, arbitrary-value lint 차단(재발 방지)

**완료 메모(radius 토큰 선언+전역 치환, 2026-10-14)**: `rounded-[Npx]` 리터럴 80곳(방향 변형 포함, 재실측) 전수 치환 완료 — 3단 설계로 시작했다가 치환 착수 시 24px(mypage/home 카드 본체, 13곳)가 32px/18px 사이에서 실질적인 4번째 군집이라는 게 드러나 `--radius-panel`(24px)을 추가해 4단으로 확정. text 리터럴과 달리 radius는 레이아웃 overflow를 일으키지 않아 사례별 판단 없이 일괄 치환(32px+28px→card, 24px→panel, 22px/20px/18px→chip). `Surface`/`AppHeader`/공용 그리드 셀 컴포넌트는 아직(Step 5).

**완료 메모(P1-27 그리드 셀 버그, 2026-10-14)**: 완전한 공용 그리드 셀 컴포넌트 통합 대신, FridgeView(P0-51/G37에서 이미 검증된)의 고정px 전환 기법을 WardrobeView에도 동일 적용 — 역방향 스케일링 overflow 버그 자체는 해소(라이브로 루트 27px·32px에서 두 컴포넌트 모두 overflow 0 확인). 하나의 `.tsx` 파일로 합치는 완전한 통합은 두 칸의 바디 디자인(텍스트 목록 vs 이모지 썸네일)이 달라 강제 통일 시 시각 변경 위험이 있다고 판단해 보류 — `Surface`/`AppHeader`/`Field.tsx`/`FoodAttributeFields.tsx`/`EmptyState`는 전부 미착수로 남음.

**완료 메모(Surface.tsx, P2-16, 2026-10-14)**: fridge/closet/mypage/home 4개 `shared.ts`(.tsx)에 각각 복제돼 있던 `CARD`/`CARD_SHADOW` 리터럴 정의를 `src/components/ui/Surface.tsx` 한 곳(`SURFACE_CLASS`/`SURFACE_SHADOW`, `bordered`/`plain`/`compact` 3 variant)으로 모으고, 4개 `shared` 파일은 그 값을 재노출만 하도록 변경 — 기존 `CARD`/`CARD_SHADOW` import 경로를 쓰는 호출부는 단 한 곳도 안 건드림(API 동일 유지). 실측상 fridge/closet는 `bordered`(큰 모서리+옅은 테두리), mypage/home은 `plain`(작은 모서리, 테두리 없음)으로 이미 갈라져 있던 두 스타일을 하나로 합칠지는 디자인 판단이라 이번엔 보류하고 "복제 제거"만 처리. 새 코드에서 카드를 만들 때 쓸 `<Surface>` 컴포넌트도 함께 추가(기존 `Widget`/`CARD` 상수는 그대로 유지, 강제 마이그레이션 없음). `AppHeader`/`EmptyState`/`WardrobeView` wide·narrow 카드 variant는 전부 미착수로 남음.

**완료 메모(AppHeader.tsx, P2-16, 2026-10-14)**: home/fridge/closet/mypage 4곳에 토씨 하나 안 틀리고 복제돼 있던 sticky 헤더 바깥 래퍼(`sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50` + max-width 컨테이너)를 `src/components/ui/AppHeader.tsx` 한 곳으로 통합 — `left`(제목 블록/로고)·`actions`(오른쪽 아이콘들)·`below`(탭 스트립) prop으로 각 화면이 기존 콘텐츠를 그대로 넘겨받아 렌더. 스코프 메모에서 지적했던 "헤더 액션 배치가 화면마다 다름"(홈: 종+아바타 / 옷장: 토글+돋보기 / 마이: 돋보기+톱니) 자체는 그대로 남겨둠 — 각 아이콘이 실제로 다른 기능이라 순서를 강제로 맞추는 건 디자인 판단이고, 이번엔 "래퍼 복제 제거"만 처리. 4개 화면 전부 라이브 스크린샷으로 레이아웃 무변경 확인. `EmptyState`/`WardrobeView` wide·narrow 카드 variant는 미착수로 남음.

### E. 공용 폼/빈 상태 컴포넌트
**대상:** P1-73 + P2-39(**사실상 동일한 발견 — 서로 다른 라운드에서 중복 등록됨**, 하나로 처리), P2-41, P2-9, P2-31

- 등록 폼(`TextImportModal.tsx`)과 카드 편집 폼(`SwipeFoodCard.tsx`)이 같은 식품 속성을 2열/1열, `text-[10px]`/`text-xs`, 서로 다른 터치타깃(33px/47px)으로 각각 구현 — 필드 하나 추가할 때마다 두 곳을 고치거나 어긋날 위험이 실제로 존재(P0-33 때 이미 한 번 발생)
- 빈 상태가 화면마다 제각각(칸 상세 시트: 부제 중복 + CTA 없음 / 주간 인사이트: 빈 차트 프레임만 / 문구 띄어쓰기·마침표 불일치)
- `WardrobeView` 카드가 큰 칸(293×133)/작은 칸(89×156) 폭 3.3배 차이를 같은 컴포넌트로 렌더해 큰 카드는 공백, 작은 카드는 라벨이 빠듯함 — wide/narrow 2종 variant 필요(D의 그리드 셀 통합과 함께 처리하는 게 효율적)
- 산출물: `Field.tsx`+`FoodAttributeFields.tsx`(등록/편집 `compact` prop만 다르게 공유), `EmptyState` 컴포넌트(아이콘+한줄안내+1차행동버튼), 카드 variant 2종

**완료 메모(Field.tsx, 2026-10-14)**: `src/components/ui/Field.tsx`(label+helper 슬롯) + `FIELD_INPUT_CLASS`(44px 터치타깃 충족 공용 input/select 스타일) 신설, 등록·편집 폼 둘 다 적용 — 라벨 13.5px 하한 충족, 입력 높이 46~47px로 통일, 유통기한 칸의 상시 brand-primary 테두리(포커스 관용구 오용)도 제거. **필드 구성 자체(`FoodAttributeFields.tsx`로 완전 통합)는 보류** — 등록 폼은 카테고리·보관방법을 갖고 소유자·메모가 없고, 편집 폼은 반대인 데다 저장 방식도 다르다(등록=상태 객체에 모아 확정, 편집=`onBlur` 즉시 저장) — 이건 "어떤 필드를 어디서 편집 가능하게 할지"의 제품 결정이라 시각 통일과 분리해서 판단 필요. `EmptyState`·`WardrobeView` 카드 variant는 미착수.

**완료 메모(EmptyState.tsx, P2-41/P2-9, 2026-10-14)**: `src/components/ui/EmptyState.tsx`(제목+선택 설명+선택 CTA 버튼) 신설, 냉장고·옷장 칸 상세 시트(`SectionDetailSheet.tsx`/`WardrobeSectionSheet.tsx`)에 적용 — 두 시트 다 헤더 부제(`meta.hint`)를 빈 상태 문구에서 그대로(냉장고) 또는 "{hint} 의류를 추가해보세요"로 어색하게 이어붙여(옷장) 중복 노출하면서도 누를 수 있는 CTA가 없었다(실측 확인). 중복 문구를 제거하고 "식품/의류 등록하기" CTA로 교체 — 기존 `nemoa:open-register` 전역 이벤트(BottomNav/CommandPalette와 동일 패턴)를 재사용. 라이브 테스트 중 등록 모달(`z-50`)이 칸 상세 시트(`z-[60]`)보다 낮은 레이어라 시트가 열린 채로는 모달이 가려지는 걸 발견해, CTA가 시트를 먼저 닫은(`onClose()`) 뒤 이벤트를 디스패치하도록 같이 수정(냉장고 쪽 라이브 재확인). "주간 인사이트 빈 차트 프레임" 하위 발견은 현재 코드상 해당 컴포넌트(`WeeklyInsight`/`WeekdayPatternChart`)가 이미 빈 상태를 `return null` 또는 대체 문구로 처리 중이라 재현 못 함(기존 라운드에서 먼저 해소됐을 가능성, 추정) — 이번엔 손대지 않음. `WardrobeView` 카드 wide/narrow variant는 미착수로 남음.

**완료 메모(WardrobeView wide/narrow variant, P2-31, 2026-10-14)**: 큰 칸(293×133, `colSpan>1`)과 작은 칸(89×156, `colSpan=1`)이 같은 세로 쌓임 레이아웃을 써서 큰 칸은 라벨+썸네일 아래로 빈 공간이 크게 남고 작은 칸은 라벨이 빠듯했던 문제(실측)를 `colSpan>1`인 넓은 셀만 가로 레이아웃(아이콘·라벨+카운트·썸네일을 한 행)으로 전환해 해소 — 남는 폭을 썸네일 최대 8개 노출에 쓴다. 좁은 1칸 셀은 기존 세로 레이아웃(썸네일 3개 한도)을 그대로 유지. 라이브 테스트 중 두 레이아웃에서 카운트 배지를 똑같이 라벨과 한 줄에 두면 좁은 칸의 "액세서리"(4자)가 "액…"으로 잘리는 회귀를 발견해, 좁은 칸은 배지를 기존대로 아이콘 옆 헤더 행에 두는 구조로 되돌려 재확인. 27px/32px 루트 글자 크기 그리드 overflow 0도 재확인(역방향 스케일링 회귀 없음). 이걸로 Workstream D·E의 Step 5 항목은 모두 처리됐고, `FoodAttributeFields.tsx` 완전 통합과 공용 그리드 셀 컴포넌트(두 칸 디자인이 근본적으로 달라 강제 통일 시 시각 변경 위험)만 제품 판단이 필요해 의도적으로 보류 상태로 남긴다.

### F. 레이아웃 보강 — 터치 타깃 · 스크롤 어포던스 · 역방향 스케일링 잔여
**대상:** P1-17, P1-59, P1-108, P1-66, P1-27(그리드→리스트 자동전환 부분)

- 하단 링크/버튼 다수 44px 미만(섹션 링크 18px, 코디 버튼 110×29, "+" 32px 등으로 보고됨 — 정확한 현재 치수는 착수 시 재실측 필요), `min-height:44px` 선언 0건
- 탭 스트립이 `.scrollbar-hide`로 스크롤바를 지우면서 엣지 페이드·화살표 등 대체 어포던스가 전혀 없음 — 기본 폰트에서도 2px 초과해 경계선상
- `/fridge` 탭 스트립·`FoodSummaryStats`가 P0-51과 같은 뿌리(rem 패딩·gap)로 역방향 스케일링에 깨짐(이번 라운드에서 발견만 하고 미착수, P1-108)
- 홈 위젯 6곳(`UrgentAlert`/`SeasonalHintWidget`/`RebuyAlert`/`FridgeView`/`RecipeSection`/`OutfitCard`)이 "배열→join→truncate" 동일 패턴을 반복해 항목 수가 늘면 구조적으로 한 줄에 못 들어감(P1-66)
- 칸 폭이 임계 이하로 좁아지는 경우(극단적 확대) 그리드 대신 리스트 뷰로 자동 전환하는 안(P1-27 후반부)
- 산출물: 인터랙티브 공용 클래스(44px + 히트슬롭), `useScrollHint()` 훅, P1-108 고정px 전환(P0-51과 동일 기법, 이미 검증된 패턴이라 저위험), `<NameChips names max={2}/>` 컴포넌트

**완료 메모(FoodSummaryStats, P1-108, 2026-10-14)**: 착수 전 재실측 결과 당초 가설(rem 패딩·gap이 P0-51과 같은 뿌리)과 실제 원인이 달랐다 — 6칸 요약 행엔 애초에 decorative gap이 없고(flex-1만), overflow-x 처리 없는 고정폭 flex 행이 OS 글자 확대 시 라벨·숫자 텍스트 자체의 min-content 폭을 못 당해 그냥 잘렸다(32px 루트 63px, 그룹 보조 행은 94px). P0-51처럼 decorative 치수를 고정px로 바꾸는 대신, 두 행을 각각 `overflow-x-auto scrollbar-hide`로 감싸 평소엔 무변화·극단적 확대에서만 스크롤로 전환 — 라이브로 32px 루트에서 스크롤해 "기한초과" 칸 도달 가능 확인. `/fridge` 탭 스트립 자체는 이미 `overflow-x-auto`라 페이지 레벨 붕괴가 없었음(실측 `bodyOverflowX` 항상 0) — 탭 스트립의 진짜 문제는 "깨짐"이 아니라 `scrollbar-hide`로 인한 어포던스 부재였고, 이건 아래 `useScrollHint()` 항목과 중복이라 거기서 같이 처리. 44px 터치타깃 공용 클래스·`useScrollHint()`·`NameChips`·그리드→리스트 자동전환은 미착수로 남음.

**완료 메모(touch-target-44 적용 6곳, P1-17, 2026-10-14)**: 착수 전 재확인 결과 "인터랙티브 공용 클래스" 자체는 이미 globals.css에 `.touch-target-44`(히트슬롭 `::after`)로 존재했다 — P2-36 라운드에서 신설됐지만 실제 적용은 `NotificationOffBanner` 단 1곳뿐이었다(새로 안 만들고 기존 걸 넓게 적용하는 작업으로 범위 확정). `absolute top/right-{4,5} w-9 h-9`(28~36px) 구조를 공유하는 닫기(✕) 버튼을 전수 조사(14곳) 해 그중 같은 구조의 6곳(SectionDetailSheet·WardrobeSectionSheet·OutfitDetailModal·UpgradeSheet·ResetConfirmSheet·LoginSheet)에 적용. 적용 전 `.touch-target-44`의 알려진 실패 사례(P1-88, `NotificationOffBanner`에서 확장된 히트존이 이웃 "켜기" 버튼을 덮어 오탭 유발)를 참고해 각 버튼 주변 여백을 먼저 확인 — 3곳은 제목에 `pr-10`(40px) 예약 여백이 있어 9px 확장과 충분한 거리, LoginSheet는 뒤로가기·닫기가 400px+ 떨어진 양끝이라 안전. 라이브로 5곳 직접 확장된 히트 영역(시각 아이콘 바깥)을 클릭해 정상 동작 확인(LoginSheet는 동일 구조라 코드 대칭성으로 갈음). `WaitlistBanner`(env var 미설정으로 로컬 렌더 불가 + pr류 예약 여백 없음)와 static 배치라 `relative`부터 추가해야 하는 나머지 8곳(`RecipeBrowserModal`/`RecipeDetailModal`의 `w-10 h-10`, `p-1`만 있는 `RewardedAdModal`/`TextImportModal`/`InstallBanner`, 냉장고·옷장 compact 상세 시트 닫기)은 범위가 더 커 별도 패스로 남김.

**완료 메모(useScrollHint(), P1-59, 2026-10-14)**: `src/lib/useScrollHint.ts` 신설 — 대상 스크롤 컨테이너에 ref를 달면 `scroll`/`resize` 리스너와 `ResizeObserver`로 왼쪽/오른쪽 각각 더 스크롤할 수 있는지(`canScrollLeft`/`canScrollRight`)를 반환한다. `scrollbar-hide`를 쓰는 가로 스크롤러 7곳 중, 정말 "탭이 더 있는지 알 길이 없다"는 원 발견에 해당하는 역할(`role="tablist"`) 2곳(냉장고·마이페이지 메인 탭)에만 적용 — 각 스크롤 가능한 쪽에만 `pointer-events-none` 흰색 그라디언트 페이드를 겹쳐 그린다. 옷장 메인 탭은 이미 이전 라운드(P2-13)에서 `scrollbar-hide`를 빼고 네이티브 스크롤 힌트를 쓰도록 고쳐져 있어 제외 — `/fridge` 탭 스트립의 "깨짐"으로 지목됐던 P1-108도 사실 이 어포던스 부재였다는 게 여기서 같이 해소됐다. 라이브로 루트 27px에서 오른쪽 페이드 노출, 끝까지 스크롤 후 왼쪽 페이드 전환(DOM 확인)을 둘 다 확인. 나머지 5곳(`FoodSummaryStats`류 요약 행, `RecipeBrowserModal`/`RecipeSection`/`DailyBriefing`/인스턴스 전환 칩 등 `role="tablist"`가 아닌 캐러셀성 스크롤러)은 "탭이 더 있다"는 탐색 맥락이 아니라 범위를 좁혀 제외 — 필요성 재검토 후 별도 처리.

**완료 메모(NameChips.tsx, P1-66, 2026-10-14)**: `src/components/ui/NameChips.tsx` 신설 — 이름 배열을 `max`개까지만 그대로 보여주고 나머지는 "+N"으로 표시(항상 단어 경계에서 끊김, 개수도 함께 전달). 대상 6곳(`UrgentAlert`/`SeasonalHintWidget`/`RebuyAlert`/`FridgeView`/`RecipeSection`/`OutfitCard`) 재조사 결과 원 발견("항목 수가 늘면 구조적으로 한 줄에 못 들어감")에 실제로 해당하는 곳은 `UrgentAlert`(개수 제한 전혀 없이 `.join(', ')`+1줄 truncate) 하나뿐이었다 — `RebuyAlert`는 이미 `slice(0,3)`로 상한, `SeasonalHintWidget`은 `line-clamp-2`+별도 총 개수 문구 병행, `OutfitCard`의 `accentNames`는 구조적으로 최대 2개(신발+액세서리), `FridgeView`는 이미 `list.length > 3 ? ' 외 N' : ''` 로 같은 효과의 카운트 접미사가 있었다(라이브 확인) — 다섯 곳 모두 이미 다른 방식으로 해소돼 있어 변경 없이 유지. `UrgentAlert`에만 적용, 라이브로 n=1 케이스가 기존과 동일하게 렌더됨을 확인하고 n=3/5 경계값은 로직 단위로 검증(라이브 데이터로 4개 이상 재현은 안 함).

**완료 메모(touch-target-44 전체 11곳, P1-17 마무리, 2026-10-14)**: 1차(6곳, absolute 배치) 이후 나머지 static 배치 5곳도 처리 — `RecipeBrowserModal`(`w-10 h-10`)·`RewardedAdModal`/`TextImportModal`(`p-1`만)·냉장고/옷장 compact 상세 바텀시트 닫기(`w-7 h-7`)에 `relative`를 추가해 `.touch-target-44` 적용. 적용 전 각각 justify-between 헤더에서 닫기가 유일한 오른쪽 요소이거나 바텀시트 제목이 비클릭 `truncate` 텍스트뿐이라 이웃 요소 덮임 위험이 없음을 확인. 반대로 **적용을 보류한 2곳**: `RecipeDetailModal`(즐겨찾기+닫기 버튼이 `gap-2`=8px로 붙어 있어 양쪽 9px씩 확장 시 18px>8px로 서로의 히트존이 겹침)과 `InstallBanner`(설치+닫기가 `gap-3`=12px, 역시 18px>12px로 겹침) — 둘 다 `.touch-target-44`의 알려진 실패 유형(P1-88, 확장된 히트존이 이웃의 진짜 클릭 가능 버튼을 덮어 오탭 유발)과 같은 패턴이라 손대지 않았다. `WaitlistBanner`는 1차와 동일한 사유(env var 미설정으로 로컬 렌더 불가)로 계속 보류. 라이브로 4곳 직접 클릭 재확인, `RewardedAdModal`은 동일 구조라 코드 대칭성으로 갈음 — 이로써 P1-17 대상 14곳 닫기 버튼 중 11곳 적용 완료, 3곳(간격 부족 2 + 렌더 불가 1)은 설계 판단 또는 환경 문제로 별도 남김.

## 제안 순서

의존관계가 명시적인 것(B→P2-7, A/D 토큰 선언→전역 치환)과 작업량이 큰 것(색 재배치 30곳, radius 68곳, text 97곳)을 고려한 순서:

| 단계 | 워크스트림 | 비고 |
|---|---|---|
| 1 | A+B+D의 **토큰 선언만** (타입 스케일·색 3단·radius 3단 CSS 변수) | 아직 전역 치환 없음, 적용 전 토큰 자체의 합의가 먼저 필요 |
| 2 | B의 전역 치환 (`brand-warning` 30곳 재배치, `brand-accent` 정리) | 이번 라운드에서 이미 값 자체는 WCAG 통과로 고쳐둔 상태라 의미 재배치만 남음 |
| 3 | A+D의 전역 치환 (text 97곳, radius 68곳) | 기계적이지만 양이 많음 — 자동화 스크립트 고려 |
| 4 | C (아이콘 언어) | 타입 레벨 강제라 한 번에 끝나면 재발 안 함 |
| 5 | D의 컴포넌트화 (`Surface`/`AppHeader`/그리드 셀 통합) + E (`Field`/`FoodAttributeFields`/`EmptyState`) | 토큰이 먼저 있어야 컴포넌트가 그 위에 설 수 있음 |
| 6 | F (터치 타깃·스크롤 어포던스·P1-108·NameChips) | 컴포넌트와 독립적이라 4~5와 병행 가능 |
| 7 | B의 마지막 단계 — 다크모드(P2-7) | 1~3에서 색이 전부 CSS 변수로 추출된 뒤에만 착수 |
| 별도 | P2-15(QA 기준 뷰포트·CI 스냅샷·axe·Lighthouse) | 구현이 아니라 CI 인프라라 아무 때나 독립적으로 병행 가능 |

## 완료 기준 (워크스트림 공통)

- `npx tsc --noEmit` / `npx eslint` / `npm run build` / `npm test` 통과
- 치환 전후 기본 줌(100%) 스크린샷 대조로 시각 회귀 0건
- 이번 라운드에서 쓴 것과 같은 방식(루트 폰트 27px/32px 강제 후 `scrollWidth-clientWidth` 측정)으로 역방향 스케일링 회귀 없음 확인
- 각 워크스트림 완료 시 `수정목록.md`에 해당 P-ID들을 일괄 완료 처리하고 커밋 메시지에 이 문서를 참조
