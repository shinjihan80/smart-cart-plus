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
    },
  },
]);

export default eslintConfig;
