import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 테스트 파일 — Node 네이티브 .mts (ESLint 파서가 .mts 부분 지원 안 됨)
    "tests/**",
    // Capacitor 네이티브 프로젝트 — 앱 소스가 아니라 빌드 산출물·서드파티 브릿지 코드 포함
    "android/**",
    "ios/**",
  ]),
  {
    rules: {
      // _ 로 시작하는 변수·인자·캐치 변수는 의도적으로 미사용 — 경고 제외
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern:         "^_",
          varsIgnorePattern:         "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // calcRemainingDays를 화면마다 직접 불러 서로 다른 경계값(<=1/<=2/<=3/!=='fresh')으로
      // "임박" 개수를 세는 바람에 같은 냉장고를 두고 배지가 화면마다 갈리는 회귀가
      // 3회 연속 재발했다(2026-09 페르소나 검토). src/lib/expirySelectors.ts를
      // 유일한 창구로 강제 — 판정이 필요하면 selectExpiring()/getRemainingDays()만 쓴다.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/FoodTags",
              importNames: ["calcRemainingDays"],
              message:
                "calcRemainingDays를 직접 import하지 마세요 — src/lib/expirySelectors.ts의 selectExpiring()/getRemainingDays()를 쓰세요 (화면마다 다른 '임박' 개수 재발 방지).",
            },
          ],
        },
      ],
      // `new Date().toISOString().split('T')[0]`(또는 .slice(0,10))는 UTC
      // 기준이라 KST(UTC+9)에서 00~09시 사이 "오늘"이 하루 전으로 찍힌다
      // (P1-85, E2 실측 — 코디 전환이 자정 아닌 오전 9시, "오늘 입었어요"
      // 버튼 상태 미반영, AI 일일 한도가 오전 9시에 풀림 등 6곳 재발).
      // 클라이언트는 todayLocalStr(), 서버(API 라우트)는 todayKstStr()을
      // 쓴다(@/lib/dateMath) — 둘 다 이 패턴을 안 쓰고 직접 계산한다.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(split|slice)$/][callee.object.type='CallExpression'][callee.object.callee.property.name='toISOString']",
          message:
            "new Date().toISOString().split/slice로 날짜만 뽑지 마세요 — UTC라 KST 00~09시에 하루 밀립니다. 클라이언트는 todayLocalStr(), 서버는 todayKstStr()을 쓰세요 (@/lib/dateMath, P1-85).",
        },
      ],
    },
  },
  {
    // expirySelectors.ts/expiryThresholds.ts만 calcRemainingDays를 직접 부를 수 있는 예외 —
    // 이 두 파일이 곧 단일 소스이므로 위 규칙에서 제외한다.
    files: ["src/lib/expirySelectors.ts", "src/lib/expiryThresholds.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // dateMath.ts 자신은 이 패턴을 금지 대상 삼을 수 없다 — todayLocalStr/
    // todayKstStr의 구현 자체가 아니라 주석 속 "나쁜 예" 설명이라 실제 호출은
    // 없지만, 미래에 성능 비교용 등으로 의도적으로 써야 할 유일한 예외 지점.
    files: ["src/lib/dateMath.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
