@AGENTS.md

# Harness 포인터

## 트리거 규칙

다음 요청이 들어오면 해당 스킬을 즉시 호출한다:

| 트리거 키워드 | 호출 스킬 |
|-------------|---------|
| 텍스트 파싱, 쇼핑 정보 추가, 영수증 분석, 구매 내역 입력 | `/parse-orchestrator` |
| 하네스 구성, 에이전트 추가, 스킬 추가 | `/harness` |

## 에이전트 팀 구성

| 에이전트 | 파일 | 역할 |
|---------|------|------|
| receipt-parser | `.claude/agents/receipt-parser.md` | 텍스트 → FoodItem/ClothingItem 추출 |
| schema-validator | `.claude/agents/schema-validator.md` | 스키마 검증 + 듀얼 리뷰 |

## 스킬 목록

| 스킬 | 경로 | 설명 |
|------|------|------|
| parse-orchestrator | `.claude/skills/parse-orchestrator/` | 파서 팀 파이프라인 조율 |
| food-knowledge | `.claude/skills/food-knowledge/` | 식품 보관 기간 도메인 지식 |
| clothing-knowledge | `.claude/skills/clothing-knowledge/` | 의류 소재·사이즈 도메인 지식 |

## 변경 이력

| 날짜 | 변경 내용 | 버전 |
|------|---------|------|
| 2026-04-16 | 파서 에이전트 팀 초기 구축 (receipt-parser, schema-validator, parse-orchestrator) | v0.1 |
