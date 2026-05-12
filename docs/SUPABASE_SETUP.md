# Supabase 연결 가이드 — Phase B-2 사용자 절차

옵션 B(Supabase 기반 정석 구축) Phase B-2는 사용자가 직접 가입·등록해야 하는 단계입니다.

이 문서를 따라 30분 안에 끝낼 수 있어요. 끝내고 알려주시면 Phase B-3 (admin/모바일 통합)을 자율 진행합니다.

---

## 사전 점검

- [ ] Vercel 로그인 가능 (shinjihan80 계정)
- [ ] 신용카드 (Supabase 무료 플랜은 카드 없이 가능 — 안 받아도 됨)
- [ ] 30분 시간

---

## 1단계 — Supabase 가입 + 프로젝트 생성 (10분)

1. https://supabase.com 접속 → **Start your project**
2. GitHub 계정으로 로그인 (이미 nemoa 저장소가 GitHub에 있어서 편함)
3. **New Project** 클릭
4. 입력
   - Name: `nemoa`
   - Database Password: 자동 생성 + **꼭 복사**해서 안전한 곳에 보관 (1Password 등)
   - Region: **Northeast Asia (Seoul) ap-northeast-2**
5. **Create new project** 클릭 — 2~3분 기다림

## 2단계 — DB 자격 4종 확보 (5분)

대시보드에서 좌측 **Settings → API** 메뉴:

| 키 | 어디서 | 어디 쓸지 |
|----|--------|----------|
| **Project URL** | `Project URL` 항목 | NEXT_PUBLIC_SUPABASE_URL |
| **anon public** | `Project API keys → anon public` | NEXT_PUBLIC_SUPABASE_ANON_KEY (브라우저에 노출 OK) |
| **service_role** | `Project API keys → service_role` | SUPABASE_SERVICE_ROLE_KEY (관리자 콘솔 전용, 절대 노출 금지) |
| **Project Ref** | Settings → General → Reference ID | supabase CLI 링크용 |

## 3단계 — Vercel 환경변수 등록 (5분)

**모바일 앱(`nemoa`)** + **관리자 페이지(`nemoa-admin`)** 두 프로젝트 모두 등록.

### 모바일 앱 (`nemoa`)
```bash
cd <이 저장소>
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 위에서 복사한 Project URL 입력

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# anon public 키 입력

vercel env add NEXT_PUBLIC_SUPABASE_URL preview     # 같은 값
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

### 관리자 페이지 (`nemoa-admin`)
```bash
cd <admin-app 디렉토리>  # 아직 main에 머지 안 됐으면 nice-herschel 워크트리
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production  # 관리자 콘솔만!
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 모바일 앱(`nemoa`)에는 **절대 등록하지 마세요**. RLS를 우회하는 위험 권한이라 클라이언트 측에 들어가면 모든 데이터를 누구나 쓸 수 있게 됩니다.

## 4단계 — DB 스키마 적용 (10분)

옵션 (가)나 (나) 중 편한 거 선택.

### (가) Supabase Dashboard SQL Editor — 가입 직후엔 가장 빠름
1. 대시보드 → 좌측 **SQL Editor**
2. `supabase/migrations/0001_init_extensions.sql` 파일 내용 복사 → 붙여넣기 → **Run** 버튼
3. `0002` → `0003` → `0004` → `0005` → `0006` 순서대로 같은 방식 반복
4. 좌측 **Table Editor**에서 5개 테이블 확인:
   - `profiles`, `items`, `notifications`, `partner_overrides`, `recipe_overlay`, `seasonal_overlay`

### (나) Supabase CLI — 향후 마이그레이션 추가할 때 편함
```bash
npm i -g supabase
cd <이 저장소>
supabase link --project-ref <Project Ref>
supabase db push
```

## 5단계 — 동작 확인

브라우저에서 https://nemoa.vercel.app 새로고침. 화면 변화는 **0** — 정상입니다 (overlay 데이터가 없으니 정적 카탈로그만 보임).

확인할 것:
- 페이지 정상 로드
- 콘솔에 Supabase 관련 에러 없음 (개발자 도구 → Console)

## 끝!

여기까지 끝났으면 Claude에게 알려주세요:
```
Phase B-2 완료 — Supabase 연결됨. Phase B-3 진행해줘.
```

그러면 자율로:
- 관리자 페이지(`nemoa-admin`)의 `nemoaApi.ts`를 Supabase 직접 호출로 교체
- 모바일 앱(`nemoa`)에서 카탈로그에 overlay 병합
- 양쪽 빌드 + 배포

---

## 트러블슈팅

### 마이그레이션 실패: `relation "profiles" already exists`
- 누군가가 이전에 일부 마이그레이션을 실행한 상태. 영향받는 마이그레이션만 건너뛰고 다음부터 적용.

### 마이그레이션 실패: `function set_updated_at() does not exist`
- 0001 마이그레이션이 적용 안 됨. 그것부터 적용.

### Vercel 환경변수 입력 시 줄 끝에 `\n` 들어감
- vercel CLI는 표준 입력을 파싱. `echo "값" | vercel env add ...` 패턴 권장.

### 환경변수 등록 후 변화 없음
- 환경변수 등록은 **다음 배포부터** 적용. `vercel --prod` 다시 실행해야 반영.
