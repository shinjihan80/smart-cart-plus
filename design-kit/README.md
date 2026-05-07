# NEMOA Design Kit

NEMOA v1.5 디자인 토큰·에셋 모음. 피그마에서 import해서 직접 편집 가능.

관련 코드: `src/app/globals.css` · `src/components/layout/NemoaLogo.tsx` · `tailwind` 설정

---

## 1. 피그마 시작 가이드 (3단계)

1. 피그마 새 파일 생성
2. `design-kit/logo/`, `design-kit/icons/` 폴더의 **SVG 파일을 드래그** → 피그마 캔버스에 붙여넣음
3. 아이콘·컬러 스타일 라이브러리로 등록

### Lucide 아이콘 추가 (카테고리 아이콘 8개)

피그마에서 쉽게 가져오는 법:

- **방법 A (추천)**: [Lucide Icons Figma Plugin](https://www.figma.com/community/plugin/1343588444103660001/lucide-icons) 설치 → 플러그인에서 아이콘 선택 → 캔버스에 삽입
- **방법 B**: [lucide.dev/icons](https://lucide.dev/icons) 웹사이트에서 각 아이콘 SVG 다운로드

### NEMOA가 쓰는 Lucide 아이콘 목록

| 용도 | 아이콘 이름 | 사이즈 | 색 |
|------|-----------|-------|----|
| 냉장고 | `Refrigerator` | 24 | `text-sky-600` |
| 옷장 | `Shirt` | 24 | `text-indigo-600` |
| 제철 | `Flower2` | 24 | `text-pink-600` |
| 레시피 | `ChefHat` | 24 | `text-amber-600` |
| 쇼핑 | `ShoppingCart` | 24 | `text-emerald-600` |
| 활동 | `BarChart3` | 24 | `text-violet-600` |
| 프로필 | `Users` | 24 | `text-rose-600` |
| 설정 | `Settings` | 24 | `text-gray-700` |

모든 아이콘은 `strokeWidth={2}`, 배경 타일은 `rounded-[16px] w-14 h-14` (56×56 px).

---

## 2. 컬러 토큰

피그마 컬러 스타일에 등록할 값 (HEX 복사용):

### Brand
| 이름 | HEX | 용도 |
|------|-----|------|
| `brand/primary` | **#4F46E5** | 메인 (indigo-600) — 로고 프레임·내부 A |
| `brand/accent` | **#EC4899** | 포인트 (pink-500) — 로고 내부 B |
| `brand/primary-soft` | #EEF2FF | primary 배경 틴트 (indigo-50) |
| `brand/success` | **#10B981** | 성공·긍정 |
| `brand/warning` | **#F43F5E** | 경고·임박 |

### 앱 배경
| 이름 | HEX | 용도 |
|------|-----|------|
| `bg/app` | **#EEF0F3** | 앱 전체 바탕 (카드와 대비) |
| `bg/card` | #FFFFFF | 카드 배경 |

### Grayscale
| 이름 | HEX | 용도 |
|------|-----|------|
| `gray/900` | #111827 | 제목 |
| `gray/700` | #374151 | 본문 |
| `gray/500` | #6B7280 | 부제 |
| `gray/400` | #9CA3AF | Caption |
| `gray/300` | #D1D5DB | placeholder |
| `gray/100` | #F3F4F6 | 배경 카드 |
| `gray/50`  | #F9FAFB | 앱 바탕 |

### 카테고리 파스텔 (아이콘 타일 배경)
| 카테고리 | 배경 HEX | 아이콘 HEX |
|---------|---------|-----------|
| 냉장고 | #E0F2FE | #0284C7 |
| 옷장 | #E0E7FF | #4F46E5 |
| 제철 | #FCE7F3 | #DB2777 |
| 레시피 | #FEF3C7 | #D97706 |
| 쇼핑 | #D1FAE5 | #059669 |
| 활동 | #EDE9FE | #7C3AED |
| 프로필 | #FFE4E6 | #E11D48 |
| 설정 | #E5E7EB | #374151 |

### 쇼핑몰 브랜드 (파트너 칩용)
| 이름 | HEX |
|------|-----|
| `mall/kurly` | #5F0080 |
| `mall/naver` | #03C75A |
| `mall/coupang` | #EA2328 |
| `mall/musinsa` | #000000 |
| `mall/zigzag` | #FF147A |
| `mall/oliveyoung` | #9FC93C |
| `mall/bmart` | #2AC1BC |

---

## 3. 타이포그래피

### 폰트 패밀리
- **SUIT** (한국어 전용) — [sunn-us/SUIT](https://github.com/sunn-us/SUIT)
- Web CDN: `https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/webfonts/css/suit.css`

### 사이즈 (rem 기준 1rem = 18px)

| 토큰 | Tailwind | px |
|------|---------|-----|
| 3xl | `text-3xl` | 33.75 |
| 2xl | `text-2xl` | 27 |
| xl  | `text-xl`  | 22.5 |
| lg  | `text-lg`  | 20.25 |
| base | `text-base` | 18 |
| sm  | `text-sm`  | 15.75 |
| xs  | `text-xs`  | 13.5 |

### 제목 계층
| 레벨 | 사이즈·굵기 | 용도 |
|------|-----------|------|
| H1 | `text-2xl font-bold` | 페이지 제목 |
| H2 | `text-lg font-bold` | 섹션 타이틀 |
| H3 | `text-base font-bold` | 카드 제목 |
| Body | `text-sm` | 본문 |
| Caption | `text-xs text-gray-500` | 부연 설명 |

### 자간
- 한국어 본문: `letter-spacing: -0.005em`
- 제목: `tracking-tight`

### 줄 간격
- 본문: `line-height: 1.55`
- 제목: `leading-tight`

---

## 4. 간격 (Spacing)

| 토큰 | Tailwind | px |
|------|---------|-----|
| xs | `gap-1`·`p-1` | 4 |
| sm | `gap-2`·`p-2` | 8 |
| md | `gap-3`·`p-3` | 12 |
| lg | `gap-4`·`p-4` | 16 |
| xl | `gap-5`·`p-5` | 20 |
| 2xl | `gap-6`·`p-6` | 24 |
| 3xl | `gap-8`·`p-8` | 32 |

### 화면 좌우 여백
- 기본: `px-5` (20px)

### 섹션 간격
- 같은 섹션 내 카드: `gap-3` (12px)
- 섹션 사이: `mt-8` (32px)

---

## 5. 컴포넌트 치수

### 카드
```css
bg-white
border border-gray-100
rounded-[20px]
p-5
shadow: 0 2px 12px -4px rgba(0,0,0,0.05)
```

### 버튼 (Primary)
```css
bg-brand-primary
text-white
rounded-xl
py-2.5 px-4
text-sm font-semibold
```

### 카테고리 아이콘 타일
- 크기: 56×56 (`w-14 h-14`)
- 라운드: 16 (`rounded-2xl`)
- 아이콘: 24×24 (Lucide `size={24}`)

### 하단 네비게이션
- 높이: 약 70px (내부 아이콘 28×28, `py-3`)
- 중앙 등록 버튼: 56×56 (`w-14 h-14`), 상단 -20px (`-mt-5`) 돌출
- 배지 링: `ring-2 ring-white`

### 로고 (큰 네모 안에 색 다른 두 네모)
- viewBox: `48 48`
- 외곽 프레임: `x=3 y=3 w=42 h=42 rx=10`, `stroke=#4F46E5 width=2.5 fill=none`
- 내부 A (왼쪽 위): `x=11 y=11 w=18 h=18 rx=4`, `fill=#4F46E5`
- 내부 B (오른쪽 아래, 겹침): `x=19 y=19 w=18 h=18 rx=4`, `fill=#EC4899 opacity=0.92`
- 두 내부 네모 겹침 영역: Pink가 앞, 자연스러운 색 차이로 "식(食)·의(衣) 두 도메인"을 시각화

---

## 6. 피그마 스타일 라이브러리 만들기 (권장 순서)

1. **컬러 스타일**: 위 `2. 컬러 토큰` 표를 보고 `Brand/Primary`·`Gray/900` 식 계층적 이름으로 등록
2. **텍스트 스타일**: 위 `3. 타이포그래피` 제목 계층 5개 (H1·H2·H3·Body·Caption)
3. **컴포넌트**: `design-kit/logo/*.svg` 드래그 → 컴포넌트(Ctrl+Alt+K)로 변환
4. **로컬 라이브러리 발행**: Figma → Assets 패널 → Publish library

---

## 7. 실제 앱 재현 체크리스트

피그마에서 NEMOA 홈 화면을 그대로 그려보려면:

- [ ] SUIT 폰트 설치 (Figma `Text` 패널에서 검색)
- [ ] 배경 `#F9FAFB`
- [ ] 상단 헤더 `max-w-md` (480px) 컨테이너
- [ ] 로고 드래그 → 왼쪽 정렬
- [ ] "N개 관리 중" 배지 → `px-3 py-1 rounded-full bg-gray-100`
- [ ] 검색 바 → `h-11 rounded-2xl bg-gray-100`
- [ ] Hero 카드 → `rounded-[24px] bg-white shadow`
- [ ] 카테고리 4×2 → `gap-y-4`
- [ ] 섹션 헤더 `text-base font-bold` + `더보기 →` 링크
- [ ] 하단 네비 5탭 → 중앙 등록 버튼만 돌출

---

## 8. 디자인 변경 → 코드 반영 워크플로우

1. 피그마에서 스펙 변경 (예: 카드 rounded 값 변경)
2. 변경한 수치를 **이 문서에 먼저 업데이트** (source of truth)
3. Claude/개발자에게 "이 문서 기준으로 `rounded-[20px]`→`rounded-[24px]` 반영해줘" 요청
4. `src/components/home/shared.tsx` 같은 곳의 변경
5. 빌드 확인 → 배포

---

## 9. 파일 구조

```
design-kit/
├── README.md                    ← 이 파일 (토큰·가이드)
├── logo/
│   ├── nemoa-logo.svg           ← 3 네모 혼합 로고 (200×200)
│   └── nemoa-app-icon.svg       ← 앱 아이콘 512×512 (iOS maskable)
└── icons/
    └── category-fridge.svg      ← 카테고리 타일 샘플
```

나머지 카테고리 7개 타일은 이 README의 `1. Lucide 아이콘 추가` 방식으로 피그마에서 직접 조합하는 걸 권장합니다 (색 변경·조합이 훨씬 유연함).
