# NEMOA 피그마 디자인 체크리스트

피그마에서 직접 디자인하실 때 필요한 에셋·컴포넌트 전체 목록.
우선순위 순으로 정리 — **A급(필수)**·**B급(표준)**·**C급(선택)**.

관련: [README.md](./README.md) · 코드: `src/lib/iconMap.ts`·`src/types/index.ts`·`src/lib/recipes.ts`

---

## 작업 범위 요약 (한눈에)

| 범주 | 항목 수 | 우선순위 | 파일 포맷 |
|------|--------|---------|----------|
| 로고 & 브랜드 | 4 (로고·앱 아이콘·OG·스플래시) | A | SVG + PNG |
| 탭바 아이콘 | 5 | A | SVG |
| 카테고리 아이콘 (홈 그리드) | 8 | A | SVG |
| 식품 카테고리 아이콘 | 11 | B | SVG |
| 패션 카테고리 아이콘 | 13 | B | SVG |
| 계절·날씨 아이콘 | 4 + 6 | B | SVG |
| 액션·상태 아이콘 | ~18 | B | SVG |
| 레시피 고유 아이콘 | 42 | C | SVG |
| 제철 재료 아이콘 | 48 | C | SVG |
| 쇼핑몰·파트너 로고 | 9 | C | SVG |
| UI 컴포넌트 | ~20종 | A/B | Figma 컴포넌트 |
| 화면 레이아웃 | 7 페이지 × 상태 | A | Figma 프레임 |
| **총 아이콘 수** | **~130개** | | |

A급만 해도 출시 가능. B·C는 단계적.

---

## 1. 브랜드 자산 (A급)

### 1-1. 로고 (현재 "네모 안에 다른 색 두 네모 겹침")
- 기존: `design-kit/logo/nemoa-logo.svg`
- **피그마에서 재디자인할 요소**:
  - 심볼 (정사각 비율) — 200×200 기준
  - 워드마크 (NEMOA) — SUIT font-black, tracking-tight
  - 로고+워드마크 가로 조합 — 3 사이즈 (sm/md/lg)
  - 단색 버전 (브랜드 primary만)
  - 흑백 버전 (프린트/저 컬러 대응)

### 1-2. 앱 아이콘
- **iOS maskable**: 1024×1024 PNG (배경 포함, safe zone 중앙 80%)
- **Android adaptive**:
  - Foreground 108×108 (safe zone 72dp)
  - Background 단색 또는 그라디언트
- **Favicon**: 32×32, 16×16 (`favicon.ico` 업데이트)

### 1-3. 오픈그래프 이미지 (SNS 공유 카드)
- 1200×630 (Twitter/Kakao/Facebook 공용)
- 로고 + 워드마크 + 태그라인 + 3 키워드

### 1-4. 스플래시 스크린 (선택)
- iOS: 2436×1125 (iPhone), 2048×2732 (iPad)
- 배경: `#F9FAFB`
- 중앙에 로고

---

## 2. 탭바 아이콘 5종 (A급)

`BottomNav`에서 사용. 각 **활성/비활성 2가지** 상태.

| 탭 | 현재 Lucide | 피그마에서 재디자인 시 필요 |
|----|-----------|-----------------------|
| 홈 | `Home` | 집·집 안의 박스 느낌 |
| 냉장고 | `Refrigerator` | 냉장고 실루엣 |
| 등록 (중앙) | `Plus` | 둥근 사각 배경 + + |
| 옷장 | `Shirt` | 셔츠 or 행어 |
| 마이 | `User` | 사람 |

**권장 사이즈**: 24×24 기준, stroke 1.8-2.0
**파일명**: `tab-home.svg`, `tab-fridge.svg`, `tab-add.svg`, `tab-closet.svg`, `tab-mypage.svg`

---

## 3. 홈 카테고리 아이콘 그리드 8종 (A급)

`QuickLinks`에서 사용. **56×56 타일 + 24 아이콘**.

| 순서 | 라벨 | Lucide 이름 | 파일 제안 |
|------|------|-----------|----------|
| 1 | 냉장고 | Refrigerator | `cat-fridge.svg` |
| 2 | 옷장 | Shirt | `cat-closet.svg` |
| 3 | 제철 | Flower2 | `cat-seasonal.svg` |
| 4 | 레시피 | ChefHat | `cat-recipe.svg` |
| 5 | 쇼핑 | ShoppingCart | `cat-shopping.svg` |
| 6 | 활동 | BarChart3 | `cat-activity.svg` |
| 7 | 프로필 | Users | `cat-profile.svg` |
| 8 | 설정 | Settings | `cat-settings.svg` |

샘플: `design-kit/icons/category-fridge.svg` 참고.

**변형**: 활성(탭 시 primary) + 비활성(회색)

---

## 4. 식품 카테고리 아이콘 11종 (B급)

`FOOD_ICON` — 식품 카드 썸네일·배지에 사용.

| FoodCategory | 현재 Lucide | 파일 제안 |
|-------------|-----------|----------|
| 채소·과일 | Apple | `food-veggie.svg` |
| 정육·계란 | Beef | `food-meat.svg` |
| 수산·해산 | Fish | `food-seafood.svg` |
| 유제품 | Milk | `food-dairy.svg` |
| 음료 | GlassWater | `food-drink.svg` |
| 간식·과자 | Cookie | `food-snack.svg` |
| 양념·소스 | CookingPot | `food-sauce.svg` |
| 면·즉석 | UtensilsCrossed | `food-noodle.svg` |
| 빵·베이커리 | Croissant | `food-bakery.svg` |
| 건강식품 | Pill | `food-health.svg` |
| 기타 식품 | Package | `food-etc.svg` |

**권장 사이즈**: 20×20 기준 (카드 썸네일), stroke 1.8

---

## 5. 패션 카테고리 아이콘 13종 (B급)

`FASHION_ICON`.

| FashionCategory | 현재 Lucide | 파일 제안 |
|-----------------|-----------|----------|
| 상의 | Shirt | `fashion-top.svg` |
| 하의 | Shirt | `fashion-bottom.svg` (바지 느낌 새 그리기) |
| 아우터 | Shirt | `fashion-outer.svg` (재킷) |
| 원피스 | Shirt | `fashion-dress.svg` (드레스) |
| 신발 | Footprints | `fashion-shoes.svg` |
| 가방 | ShoppingBag | `fashion-bag.svg` |
| 모자 | (없음, Shirt 대체) | `fashion-hat.svg` **신규 그리기** |
| 스카프 | (없음) | `fashion-scarf.svg` **신규** |
| 안경 | Glasses | `fashion-glasses.svg` |
| 선글라스 | Glasses | `fashion-sunglasses.svg` (변형) |
| 시계 | Watch | `fashion-watch.svg` |
| 주얼리 | Gem | `fashion-jewelry.svg` |
| 기타 액세서리 | Sparkles | `fashion-etc.svg` |

**피그마에서 직접 그릴 필요**: 모자·스카프·바지 형태 (Lucide에 딱 맞는 아이콘 없음)

---

## 6. 계절·날씨 아이콘 10종 (B급)

### 계절 4종 (`SEASON_ICON`)
| 계절 | Lucide | 색 토큰 | 파일 제안 |
|------|--------|--------|----------|
| 봄 | Flower2 | pink-500 | `season-spring.svg` |
| 여름 | Sun | amber-500 | `season-summer.svg` |
| 가을 | Leaf | orange-600 | `season-autumn.svg` |
| 겨울 | Snowflake | sky-500 | `season-winter.svg` |

### 날씨 6종 (`weatherIcon`)
| 조건 | 주간 | 야간 | 파일 제안 |
|------|------|------|----------|
| 맑음 | Sun | Moon | `weather-clear-day.svg` / `weather-clear-night.svg` |
| 구름조금 | CloudSun | CloudMoon | `weather-cloudy-day.svg` / `weather-cloudy-night.svg` |
| 흐림 | Cloud | Cloud | `weather-overcast.svg` |
| 비 | CloudRain | CloudRain | `weather-rain.svg` |
| 눈 | Snowflake | Snowflake | `weather-snow.svg` |
| 안개 | CloudFog | CloudFog | `weather-fog.svg` |

---

## 7. 액션·상태 아이콘 ~18종 (A/B급)

앱 전반 버튼·배지에서 사용.

| 아이콘 | 용도 | 현재 Lucide |
|--------|------|-----------|
| 검색 | 헤더 검색 버튼 | Search |
| 설정 | 마이페이지 헤더 | Settings |
| 뒤로 | 서브 페이지 헤더 | ChevronLeft |
| 닫기 | 모달 상단 | X |
| 더보기 화살표 | 섹션 헤더 "더보기 →" | ChevronRight |
| 펼치기 | 접이식 섹션 | ChevronDown |
| 더 보기 (메뉴) | 카드 메뉴 | MoreVertical |
| 공유 | 각종 공유 | Share2 |
| 즐겨찾기 | 레시피 하트 | Heart |
| 북마크 | 저장된 코디 | Bookmark |
| 경고 | 임박 식품 | AlertTriangle |
| 체크 | 완료·성공 | Check |
| 삭제 | 휴지통 | Trash2 |
| 편집 | 연필 | Pencil |
| 추가 | + 버튼 | Plus |
| 복사 | 코드·텍스트 복사 | Copy |
| 다운로드 | 백업 저장 | Download |
| 업로드 | 백업 복원 | Upload |

**권장 사이즈**: 20×20 기본, 스크롤탑/FAB은 24×24

---

## 8. 레시피 고유 아이콘 42종 (C급 — 선택)

`src/lib/recipes.ts`에 현재 이모지로 정의된 42개 레시피.
피그마에서 각 레시피를 고유 아이콘으로 그릴지, 아니면 **카테고리 통합 아이콘 5종**으로 줄일지 결정 필요.

### 옵션 A: 개별 아이콘 42종
- 각각 `recipe-{id}.svg`
- 제작 시간 크지만 시각 가치 높음

### 옵션 B (추천): 카테고리 통합 5-7종
- `recipe-soup.svg` (국·찌개)
- `recipe-rice.svg` (덮밥·볶음밥)
- `recipe-noodle.svg` (면)
- `recipe-salad.svg` (샐러드)
- `recipe-grill.svg` (구이·튀김)
- `recipe-dessert.svg` (디저트·간식)
- `recipe-beverage.svg` (음료)

각 레시피의 `recipe.category`를 추가해서 카테고리별 아이콘 사용.

---

## 9. 제철 재료 아이콘 48종 (C급)

`src/lib/seasonalProduce.ts`에 48개 제철 재료. 마찬가지 선택:

### 옵션 A: 개별 48종
- 실제 재료 모양 (딸기·수박·참외…)
- 이모지의 대체이므로 시각 인식 좋지만 제작 부담 큼

### 옵션 B (추천): 식품 카테고리 아이콘 재사용
- 이미 `food-veggie/meat/seafood…` 있으면 그걸로 충분
- 대신 **대표 몇 개만 고유 아이콘** (딸기·수박·귤 같이 상징적인 것)

---

## 10. UI 컴포넌트 ~20종 (A급 + B급)

피그마 컴포넌트(Components)로 만들어 재사용.

### A급 (필수)
| 컴포넌트 | 상태 변형 |
|---------|----------|
| **Card** (Primary) | default / hover / pressed |
| **Button** (Primary) | default / hover / disabled / loading |
| **Button** (Secondary) | default / hover / disabled |
| **Button** (Ghost) | default / hover |
| **Badge** | info / success / warning / neutral |
| **Chip** (선택 가능) | off / on / disabled |
| **Input** | default / focus / error / disabled |
| **Search Bar** | placeholder / filled |
| **BottomNav Tab** | active / inactive / with badge |
| **Section Header** | 제목 only / 제목 + 더보기 / 접이식 |
| **Hero Card** | 3 톤 (urgent/insight/gentle) |
| **Modal** | fullscreen / bottom-sheet |
| **Toast** | info / success / warning |

### B급 (확장)
- **Skeleton** (로딩) — 카드·리스트·차트
- **Empty State** (빈 화면) — 3종 (첫 방문·검색 결과 없음·오프라인)
- **Divider** — 얇은 구분선
- **Avatar** — 원형 프로필 이미지
- **Progress Bar** — D-Day, 영양 밸런스
- **Switch (Toggle)** — 햅틱·알림음 설정
- **Tab Pills** — 필터 바 (예: 전체/이번계절/즐겨찾기)
- **List Item** — 설정 메뉴 행
- **Avatar Group** — 프로필 여러 명
- **Carousel Dots** — 가로 스크롤 인디케이터

---

## 11. 화면 레이아웃 7페이지 (A급)

각 페이지의 **3가지 상태** — 기본/빈/로딩.

### 페이지 목록
| 페이지 | 주요 섹션 |
|-------|----------|
| **홈** `/` | 헤더·검색·Hero·카테고리그리드·오늘기록·지금바로·오늘추천·이번주 |
| **냉장고** `/fridge` | 필터·검색·카드 리스트·영양 밸런스·레시피 섹션·재구매 |
| **옷장** `/closet` | 필터·코디 추천·가상코디·카드 리스트·계절 꺼내기 |
| **마이** `/mypage` | 프로필카드·통계·쇼핑·기록 분석·파트너 로드맵·Pro 배너 |
| **설정** `/settings` | 백업배너·프로필·알림·AI한도·오류기록·저장용량·메뉴·AppInfo |
| **제철** `/seasonal` | 계절 탭·월별/계절별 토글·재료 카드 |
| **약관** `/legal` | 약관 텍스트·요약 박스 |

### 상태
- **기본** (샘플 데이터 22개 로드된 상태)
- **빈 상태** (완전 빈 화면)
- **로딩** (스켈레톤)

### 모달·오버레이 별도
- ConsentGate (첫 실행 동의)
- 레시피 상세 모달
- 레시피 브라우저 모달
- 상품 등록 모달 (사진·URL·텍스트·빠른 추가 4 탭)
- CommandPalette (⌘K 검색 오버레이)
- 오늘 한 마디 Hero 3 톤

---

## 12. 색상 시스템 (A급)

피그마 Color Styles로 등록. `design-kit/README.md`에 전체 HEX 있음.

### 핵심 팔레트 (최소)
```
Brand
  primary       #4F46E5  (로고·CTA·활성 탭)
  accent        #EC4899  (로고 B·포인트)
  success       #10B981
  warning       #F43F5E

Grayscale
  900  #111827  (제목·중요 텍스트)
  700  #374151  (본문·네비 비활성)
  500  #6B7280  (부제)
  400  #9CA3AF  (Caption)
  300  #D1D5DB  (placeholder·border)
  100  #F3F4F6  (카드 배경 보조)
  50   #F9FAFB  (카드 배경)

App Background
  app  #EEF0F3  (전체 바탕)
```

### 의미 색상 (배지·상태)
- 임박: 경고색 10% 배경 + 경고색 텍스트
- 제철: 계절별 100% 배경 + 600 텍스트
- 단골: amber-100 / amber-700
- Pro: brand-primary / 10% 배경

---

## 13. 타이포그래피 (A급)

피그마 Text Styles로 등록. 베이스 18px (`html { font-size: 18px }`).

| 스타일 | Tailwind | px | 굵기 | 용도 |
|-------|---------|-----|------|------|
| Display | text-3xl | 33.75 | 800 | 히어로 큰 숫자 |
| H1 | text-2xl | 27 | 700 | 페이지 제목 |
| H2 | text-lg | 20.25 | 700 | 섹션 타이틀 |
| H3 | text-base | 18 | 700 | 카드 제목 |
| Body | text-sm | 15.75 | 400 | 본문 |
| Small | text-xs | 13.5 | 400 | 부연·캡션 |

**폰트**: SUIT (Bold·Regular 2 굵기)
**줄간격**: 본문 1.55, 제목 leading-tight
**자간**: 한글 -0.005em, 제목 tracking-tight

---

## 14. 간격·반경 시스템 (A급)

### Spacing
| 토큰 | px | 용도 |
|------|-----|------|
| xs | 4 | 배지 내부 |
| sm | 8 | 아이콘+텍스트 |
| md | 12 | 카드 내부 그룹 |
| lg | 16 | 섹션 내 카드 간 |
| xl | 20 | 페이지 좌우 padding |
| 2xl | 24 | 카드 내부 padding |
| 3xl | 32 | 섹션 사이 간격 |

### Border Radius
| 토큰 | px | 용도 |
|------|-----|------|
| sm | 8 | 칩·작은 배지 |
| md | 12 | 입력·버튼 |
| lg | 16 | 아이콘 타일 |
| xl | 20 | 카드 (현재 기본) |
| full | 9999 | 원형 버튼·프로필 |

---

## 15. 내보내기 가이드 (피그마 → 코드)

디자인 완료 후 코드 반영 워크플로우:

### 아이콘 내보내기
1. 각 아이콘을 **단일 프레임으로** (예: 24×24)
2. **SVG export** (빈 공간 없이)
3. `design-kit/icons/` 에 파일명 규칙대로 저장
4. 코드에선 `<Image src="/icons/..." />` 또는 import로 사용

### 스크린 내보내기
- 주요 화면 **3배수 PNG** (예: 모바일 iPhone 14 Pro 기준 1179×2556)
- 문서에 참고용으로 `design-kit/screens/` 에 저장

### 컴포넌트 치수 추출
- 피그마 Inspect 패널에서 padding·border-radius·color 수치 확인
- `design-kit/README.md` 업데이트 → Claude에게 "이 문서 기준으로 코드 반영" 요청

---

## 16. 추천 작업 순서

시간 제한 고려한 현실적 순서:

### 1차 (1-2일) — 출시 가능 최소
- [ ] **로고 3 사이즈** + 앱 아이콘 1024×1024 + OG 1200×630
- [ ] **탭바 아이콘 5종** (활성/비활성)
- [ ] **홈 카테고리 아이콘 8종**
- [ ] **액션 아이콘 핵심 10종** (검색·설정·뒤로·닫기·체크·+·하트·경고·더보기·삭제)
- [ ] **Color Styles + Text Styles** 피그마 등록
- [ ] **Card + Button + Badge** 기본 컴포넌트

### 2차 (2-3일) — 퀄리티 올리기
- [ ] 식품 카테고리 아이콘 11종
- [ ] 패션 카테고리 아이콘 13종
- [ ] 계절·날씨 아이콘 10종
- [ ] 화면 레이아웃 **홈 1개만** 상세 (기본/빈/로딩)

### 3차 (선택) — 완전체
- [ ] 레시피 카테고리 통합 아이콘 5-7종
- [ ] 제철 재료 대표 아이콘 10개
- [ ] 파트너 9개 로고
- [ ] 나머지 6개 페이지 레이아웃
- [ ] 모달·오버레이 3종

---

## 17. 질문이 생기면

- **컬러 정확한 HEX** → `design-kit/README.md` 컬러 토큰 표
- **현재 아이콘 실제 코드 매핑** → `src/lib/iconMap.ts`
- **Tailwind 클래스 → 피그마 수치 변환** → README의 간격·타이포 표
- **특정 컴포넌트 실제 생김새** → 배포된 앱 https://nemoa.vercel.app

---

## 체크리스트 제출

디자인 작업 완료 후 저한테 다음을 알려주시면 코드 반영합니다:

1. **SVG 파일 모음** (design-kit/icons/ 경로에 넣으시거나 zip 공유)
2. **변경된 컬러·타이포·간격 수치** (README 업데이트)
3. **스크린 PNG 참고용** (선택)

그러면 제가:
- SVG → 적절한 React 컴포넌트로 변환
- iconMap.ts·shared.tsx·globals.css 반영
- 컴포넌트 레이아웃 조정
- 빌드·배포

진행하시다 중간에 막히는 부분도 언제든 물어보세요 — 특정 컴포넌트 치수나 색 코드만 필요하면 그 부분만 바로 알려드립니다.
