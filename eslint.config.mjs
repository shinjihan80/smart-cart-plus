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
]);

export default eslintConfig;
