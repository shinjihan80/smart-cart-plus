# NEMOA — Capacitor 앱 빌드 가이드

## 아키텍처

```
웹 (Vercel) ──────────────────────────────
  Next.js 앱 + API 라우트 (AI·Supabase)
  ↑
  WebView (원격 서버 방식)
  ↑
Capacitor Shell ─────────────────────────
  iOS (Xcode) / Android (Android Studio)
  네이티브 플러그인:
    - PushNotifications (APNs·FCM)
    - Camera (네이티브 카메라 UI)
    - Haptics (진동 피드백)
    - StatusBar (상태바 제어)
    - Network (온·오프라인 감지)
```

> **왜 원격 서버 방식?**  
> NEMOA는 Next.js API 라우트(Gemini AI, Supabase 동기화)를 사용하므로  
> Static Export가 불가능합니다. Capacitor WebView가 Vercel 서버를 로드합니다.

---

## 사전 요구사항

| 플랫폼 | 필요 항목 |
|--------|---------|
| iOS    | macOS + Xcode 16+ + Apple Developer 계정 ($99/년) |
| Android| Android Studio Ladybug+ + JDK 17+ + Google Play 계정 ($25 1회) |
| 공통   | Node.js 20+ |

---

## 초기 설정 (최초 1회)

```bash
# 1. 네이티브 프로젝트 생성
npx cap add ios
npx cap add android

# 2. 의존성 동기화
npx cap sync

# 3. iOS: CocoaPods 설치
cd ios/App && pod install && cd ../..
```

---

## 개발 워크플로

```bash
# 로컬 웹 서버 실행
npm run dev          # http://localhost:3000

# (별도 터미널) 네이티브 앱 실행 — 로컬 서버에 연결
npx cap run ios      # Simulator 또는 실 기기
npx cap run android  # Emulator 또는 실 기기
```

> capacitor.config.ts의 `server.url`이 개발 시 `http://localhost:3000`으로 자동 설정됩니다.

---

## 프로덕션 빌드

### iOS (App Store)

```bash
# 1. 웹앱이 Vercel에 배포된 상태 확인
# 2. iOS 프로젝트 열기
npx cap open ios

# Xcode에서:
# 3. Signing & Capabilities → Team 선택
# 4. Product → Archive
# 5. Distribute App → App Store Connect
```

**필수 Info.plist 키** (Xcode > Info.plist):
```
NSCameraUsageDescription    = 식품·의류 영수증을 촬영해 자동으로 등록합니다.
NSPhotoLibraryUsageDescription = 갤러리에서 영수증 사진을 선택합니다.
```

### Android (Google Play)

```bash
# 1. Android 프로젝트 열기
npx cap open android

# Android Studio에서:
# 2. Build → Generate Signed Bundle / APK
# 3. Android App Bundle 선택 → keystore 생성/선택
# 4. Google Play Console → 프로덕션 트랙에 업로드
```

---

## 아이콘 & 스플래시 설정

### 아이콘
- `public/icon-1024.png` (1024×1024 마스터 아이콘)

```bash
# capacitor-assets 설치 (최초 1회)
npm install -D @capacitor/assets

# 모든 해상도 자동 생성
npx capacitor-assets generate --ios --android
```

### 스플래시 (Android)
- `public/splashes/splash-1320x2868.png` → Android `res/drawable/splash.png`

---

## FCM 설정 (Android 푸시)

1. Firebase 콘솔 → 새 프로젝트 → Android 앱 추가 (com.nemoa.app)
2. `google-services.json` 다운로드 → `android/app/` 에 배치
3. `android/build.gradle`에 Google Services 플러그인 추가:
   ```groovy
   classpath 'com.google.gms:google-services:4.4.0'
   ```
4. `android/app/build.gradle` 맨 아래:
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```

## APNs 설정 (iOS 푸시)

1. Apple Developer → Certificates → Keys → 새 키 생성 (APNs 체크)
2. `.p8` 다운로드
3. Supabase Dashboard → Authentication → Push Notifications에 업로드

---

## 앱스토어 제출 체크리스트

### 공통
- [ ] Supabase 환경변수 Vercel에 설정
- [ ] 개인정보처리방침 URL 접속 확인 (nemoa.vercel.app/legal)
- [ ] 앱 아이콘 1024px PNG 준비

### iOS
- [ ] Apple Developer Program 등록
- [ ] Bundle ID `com.nemoa.app` 등록
- [ ] App Store Connect에 앱 생성
- [ ] 스크린샷 준비 (iPhone 16 Pro Max, iPhone SE)
- [ ] Info.plist 권한 설명 추가
- [ ] Archive → 업로드

### Android  
- [ ] Google Play Console 등록 ($25)
- [ ] FCM 연동 (google-services.json)
- [ ] 서명 키스토어 생성 (분실 주의 — 재발급 불가)
- [ ] AAB 업로드 → 내부 테스트 → 프로덕션
