# NEMOA — App Store 제출 메타데이터 (iOS)

## 기본 정보
- **앱 이름**: NEMOA
- **부제목**: 스마트 냉장고 & 옷장 비서
- **Bundle ID**: com.nemoa.app
- **SKU**: nemoa-app-001
- **카테고리**: 라이프스타일 (주), 음식 및 음료 (부)
- **가격**: 무료

## 설명 (한국어 — 4000자 이내)

네모아(NEMOA)는 냉장고와 옷장을 하나로 연결하는 AI 라이프스타일 비서입니다.

**냉장고 관리**
- 식품 유통기한 추적 · D-Day 알림
- AI 영양 분석 · 레시피 24종 추천
- 냉장고 구역별 시각화 (양문형/4도어/1도어/김치냉장고)
- 장보기 목록 자동 생성

**옷장 관리**
- 의류 아이템 등록 · 날씨 기반 코디 추천
- 시즌 알림 · 착용 로그 · 처분 안내 (중고/기부/보관)
- 옷장 구역별 시각화

**AI 기능**
- 영수증·텍스트 사진으로 식품/의류 자동 등록
- 제철 식재료 달력
- 날씨 연동 코디 추천

**Pro 기능** (₩4,900/월)
- 무제한 AI 스캔
- 다기기 클라우드 동기화
- 파트너 쇼핑몰 연동

## 키워드 (100자 이내)
냉장고,유통기한,식품관리,옷장,코디,레시피,AI,라이프스타일,장보기,날씨코디

## 스크린샷 요구 규격
- iPhone 16 Pro Max: 1320×2868px (필수)
- iPhone SE (3세대): 1290×2796px (필수)
- iPad Pro 13인치: 2064×2752px (선택)

## 심사 정보
- **지원 URL**: https://nemoa.vercel.app
- **개인정보처리방침**: https://nemoa.vercel.app/legal
- **심사 메모**: 
  - AI 기능은 Google Gemini API를 사용합니다
  - 카메라 권한: 식품/의류 영수증 촬영용
  - 알림 권한: 유통기한 D-Day 알림용

## Info.plist 권한 설명 (필수)
```xml
<key>NSCameraUsageDescription</key>
<string>식품·의류 영수증을 촬영해 자동으로 등록합니다.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>갤러리에서 영수증 사진을 선택해 자동으로 등록합니다.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>식품 유통기한 만료 및 중요 일정을 알려드립니다.</string>
```

## 연령 등급
4+ (폭력·성인 콘텐츠 없음)
