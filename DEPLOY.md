# NEMOA 배포 가이드

## 환경변수

`.env.local`에 다음 키를 설정합니다. **절대 Git에 커밋하지 마세요** (`.gitignore`에 이미 제외됨).

```bash
# Anthropic Claude API — 필수 (AI 기능 없이는 앱 핵심 흐름 동작 안 함)
ANTHROPIC_API_KEY=sk-ant-...

# AI 호출 일일 한도 (베이직 무료 사용자당) — 옵션, 기본값 앱 내 하드코딩
# NEMOA_DAILY_AI_LIMIT=30

# 에러 리포팅 (옵션) — Sentry 등 도입 시
# SENTRY_DSN=https://...
```

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
2. 환경변수 `ANTHROPIC_API_KEY` 추가 (Settings → Environment Variables)
3. Framework: Next.js 자동 감지
4. 배포 후 커스텀 도메인 연결

**주의**:
- API 라우트는 서버에서만 실행되므로 API 키가 노출되지 않음
- Vercel Edge 함수 사용 시 Anthropic SDK가 fetch 기반으로 잘 작동
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

- [ ] `.env.local` 커밋 안 됨 (`git status` 확인)
- [ ] `ANTHROPIC_API_KEY` 프로덕션에 설정됨
- [ ] `/legal` 페이지 정상 접근
- [ ] 신규 사용자 첫 방문 시 ConsentGate 모달 표시
- [ ] 빌드 성공 (`npm run build` 에러 없음)
- [ ] manifest.json의 start_url·scope이 배포 URL과 일치
- [ ] lighthouse 점수 점검 (PWA 설치 가능, a11y 90+)

## 사용자 데이터 마이그레이션

NEMOA는 서버에 데이터를 저장하지 않으므로 마이그레이션이 불필요하지만,
사용자가 기기를 바꿀 때는 **백업 JSON 다운로드 → 새 기기에서 복원** 흐름을 안내하세요.

- 마이페이지 → "지금 백업하기" 버튼
- 새 기기에서 설정 → "백업에서 복원"

## 운영 체크

- **AI 비용**: Anthropic 호출마다 과금. 베이직 무료 사용자 제한 로직 필수 (`useAiQuota` 훅 참조).
- **localStorage 용량**: 브라우저당 5-10MB. 이미지 첨부가 많으면 용량 경고 필요. 설정의 "📦 저장 용량" 카드에서 확인.
- **백업 주기**: 앱이 7일 이상 백업 안 되면 홈에 배너 노출 (기존 구현).
