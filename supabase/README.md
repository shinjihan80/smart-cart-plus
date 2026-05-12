# NEMOA Supabase 스키마 (Phase 7.0)

Phase A(MAU 1,000 임계) 진입 시 클라우드 동기화에 사용할 PostgreSQL 스키마.
**현재 NEMOA 베타는 클라이언트 only(localStorage)이며, 본 디렉토리는 미적용 상태입니다.**

## 파일 구성

```
migrations/
├── 0001_init_extensions.sql      pgcrypto + ENUM + set_updated_at 함수
├── 0002_init_profiles.sql         profiles + auth.users 자동 동기화 트리거
├── 0003_init_items.sql            하이브리드 items + JSONB attributes + 인덱스
├── 0004_init_notifications.sql    5단계 알림 큐 + 발송 대기 인덱스 + 중복 차단
└── 0005_rls_policies.sql          모든 테이블 RLS owner-only 정책
```

순서대로 적용 — 의존성 있음 (0001 → 0002 → 0003 → 0004 → 0005).

## 적용 절차 (Phase A 진입 시)

### 1. Supabase 프로젝트 생성
[supabase.com](https://supabase.com) → New Project → 한국 리전(`ap-northeast-2`) 권장.

### 2. CLI 초기화
```bash
npm i -g supabase
cd /path/to/nemoa
supabase init
supabase link --project-ref <your-project-ref>
```

### 3. 마이그레이션 적용
```bash
# dev/staging
supabase db reset                  # 새 스키마로 리셋 (dev 환경만)

# production
supabase db push                   # migrations/ 디렉토리 기반 적용
```

### 4. 환경변수 등록
```bash
echo "NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>"           | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "SUPABASE_SERVICE_ROLE_KEY=<service_role>"           | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### 5. TypeScript 타입 활용
```ts
import type { Database, ItemRow, isWardrobeItem } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// items 조회
const { data } = await supabase.from('items').select('*');

// 도메인 좁히기로 attributes 타입 자동 추론
data?.forEach((item) => {
  if (isWardrobeItem(item)) {
    item.attributes.size;          // ✓ string | undefined
  } else if (isFridgeItem(item)) {
    item.attributes.expiry_date;   // ✓ string | undefined
  }
});
```

## 핵심 설계 결정

### 하이브리드 items 테이블 (단일 테이블 + JSONB)
- `domain` ENUM으로 wardrobe/fridge 분기
- `attributes` JSONB로 도메인별 다른 스키마 유연하게 저장
- 자주 조회하는 키(`expiry_date`)는 expression index로 정렬·필터 가속
- TypeScript discriminated union으로 앱 측 타입 안전성 확보

### RLS (Row Level Security)
- 모든 테이블 활성화 — 사용자는 본인 데이터만 접근
- `auth.uid() = user_id` 매칭으로 다른 사용자 데이터 격리
- 서버 worker(cron)는 `SERVICE_ROLE_KEY`로 RLS 우회

### 5단계 알림 (notifications)
- Phase 6.5/6.6 명세를 DB 형태로 영속화
- `trigger_at` cron worker가 발송 시점 결정
- `(user_id, item_id, domain, step_level, date)` 유니크 제약으로 중복 차단

### auth.users → profiles 자동 동기화
- 신규 가입 시 `handle_new_auth_user` 트리거가 profiles 행 자동 생성
- `display_name` 기본값 = email local part
- 사용자가 명시 설정 안 해도 RLS 통과 가능

## 향후 확장 (Phase 7.1+)

| 작업 | 시점 |
|------|------|
| `families` + `family_members` 테이블 (다중 멤버 가족) | Phase B (MAU 3,000) |
| `shopping_lists`, `recipes`, `outfits` 테이블 | Phase B |
| Edge Function — cron worker (notifications 발송) | Phase 7.1 |
| Storage 버킷 (이미지) — Vercel Blob 대체 또는 병행 | Phase 7.2 |
| `expiry_date` GENERATED COLUMN (purchase_date + base_shelf_life_days) | Phase 7.1 |
| Zod 런타임 검증 (`src/lib/supabaseSchemas.ts`) | Phase 7.1 |
| supabase gen types typescript 자동 생성 통합 | Phase 7.1 |

## 베타 단계와의 관계

**현재 베타**: 클라이언트 only — localStorage / IndexedDB / Upstash Redis(admin overlay).

**Phase A(MAU 1,000)**: 결제 인프라 + Supabase 클라이언트 인증 도입. 본 스키마 적용.

**Phase B(MAU 3,000)**: Pro 차등화 — Pro 사용자만 Supabase 클라우드 동기화. 베이직은 localStorage 유지.
