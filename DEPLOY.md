# NEMOA 배포 가이드

## 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 실제 값을 채워 넣으세요.
**`.env.local`은 절대 Git에 커밋하지 마세요** (`.gitignore`에 이미 제외).

```bash
cp .env.example .env.local
# 편집기로 열어서 GEMINI_API_KEY 입력
```

필수: `GEMINI_API_KEY` 하나만.
선택: `NEXT_PUBLIC_SITE_URL` (SEO · sitemap용) · Supabase/Toss (Pro 도입 후).

Open-Meteo 날씨 API는 키 불필요.

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

## 프로덕션 빌드

```bash
npm run build
npm start
```

## Vercel 배포 (권장)

1. https://vercel.com/new → GitHub 저장소 연결
2. 환경변수 `GEMINI_API_KEY` 추가 (Settings → Environment Variables)
3. Framework: Next.js 자동 감지
4. 배포 후 커스텀 도메인 연결

**주의**:
- API 라우트는 서버에서만 실행되므로 API 키가 노출되지 않음
- Vercel Edge 함수 사용 시 Google Gemini SDK가 fetch 기반으로 잘 작동
- 이미지 최적화는 Next.js 자체 기능으로 충분 (Vercel 무료 티어 포함)

## Netlify 대안

1. `netlify.toml` 추가 (Next.js 플러그인 사용)
2. 환경변수 설정
3. Build command: `npm run build`
4. Publish directory: `.next`

## 앱 스토어 배포 (Capacitor 래핑)

웹 PWA만으로 충분하다면 별도 래핑 불필요. 앱 스토어 등록이 필요하면:

```bash
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/ios @capacitor/android
npx cap init NEMOA com.nemoa.app
npx cap add ios android
npx cap sync
```

## 사전 체크리스트

**코드**
- [ ] `.env.local` 커밋 안 됨 (`git status` 확인)
- [ ] `GEMINI_API_KEY` 프로덕션에 설정됨
- [ ] `NEXT_PUBLIC_SITE_URL` 프로덕션 URL로 설정 (SEO · sitemap용)
- [ ] 빌드 성공 (`npm run build` 에러 없음)
- [ ] 테스트 통과 (`npm test` — 36 passes)

**기능 검증**
- [ ] 신규 사용자 첫 방문 시 ConsentGate 모달 표시
- [ ] `/legal` 약관·개인정보 페이지 정상 접근
- [ ] AI 한도 카드 (설정)에서 4개 에이전트 모두 10/20/5/5 표시
- [ ] 오류 기록 카드 — 일부러 에러 만들어 기록 확인
- [ ] 네트워크 끊고 새로고침 → `/offline.html` 표시 (프로덕션 빌드에서만)
- [ ] PWA 홈 화면 추가 — manifest 인식

**배포 인프라**
- [ ] manifest.json의 start_url·scope이 배포 URL과 일치
- [ ] `/sw.js` 응답 헤더 `Cache-Control: no-store` 확인
- [ ] lighthouse 점검 (PWA 설치 가능, a11y 90+, SEO 90+)
- [ ] robots.txt · sitemap.xml 접근 가능

**법적**
- [ ] 약관·개인정보 최종 검토 (이메일 주소, 문의처 채움)
- [ ] Google Gemini API 정책 준수 (사용자 입력 → AI 경유 고지)

## 사용자 데이터 마이그레이션

NEMOA는 서버에 데이터를 저장하지 않으므로 마이그레이션이 불필요하지만,
사용자가 기기를 바꿀 때는 **백업 JSON 다운로드 → 새 기기에서 복원** 흐름을 안내하세요.

- 마이페이지 → "지금 백업하기" 버튼
- 새 기기에서 설정 → "백업에서 복원"

## 운영 체크

- **AI 비용**: Gemini 호출마다 과금. 베이직 무료 사용자 제한 로직 필수 (`useAiQuota` 훅 참조).
- **localStorage 용량**: 브라우저당 5-10MB. 이미지 첨부가 많으면 용량 경고 필요. 설정의 "📦 저장 용량" 카드에서 확인.
- **백업 주기**: 앱이 7일 이상 백업 안 되면 홈에 배너 노출 (기존 구현).
