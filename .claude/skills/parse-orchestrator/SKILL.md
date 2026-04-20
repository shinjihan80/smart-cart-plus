---
name: parse-orchestrator
description: "비정형 텍스트(영수증·이메일·메모)를 NEMOA FoodItem/ClothingItem JSON으로 변환하는 파서 에이전트 팀 오케스트레이터. '텍스트 파싱', '쇼핑 정보 추가', '영수증 분석', '구매 내역 입력' 요청 시 사용. 후속 작업: 파싱 결과 수정, 누락 항목 보완, 재파싱 요청 시에도 반드시 이 스킬 사용."
---

# Parse Orchestrator

비정형 텍스트를 NEMOA Phase 1 스키마(FoodItem / ClothingItem)로 변환하는 파서 에이전트 팀을 조율한다.

## 실행 모드: 에이전트 팀 (생성-검증 패턴)

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
|------|-------------|------|------|------|
| receipt-parser | 커스텀 | 텍스트 → 구조화 데이터 추출 | food-knowledge, clothing-knowledge | `_workspace/01_parsed.json` |
| schema-validator | 커스텀 | 스키마 검증 + 듀얼 리뷰 | system-rules.json | `_workspace/02_validated.json` |

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `_workspace/` 디렉토리 존재 여부 확인
2. 실행 모드 결정:
   - **미존재** → 초기 실행. Phase 1로 진행
   - **존재 + 부분 수정 요청** → 해당 에이전트만 재호출, 기존 산출물 수정
   - **존재 + 새 텍스트 제공** → `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1 진행

### Phase 1: 준비

1. 사용자 입력에서 `rawText` 추출
2. `_workspace/` 디렉토리 생성
3. `rawText`를 `_workspace/00_input.txt`에 저장
4. 오늘 날짜를 `YYYY-MM-DD` 형식으로 확인

### Phase 2: 팀 구성

```
TeamCreate(
  team_name: "parser-team",
  members: [
    {
      name: "receipt-parser",
      agent_type: "general-purpose",
      model: "opus",
      prompt: "receipt-parser 에이전트 정의(.claude/agents/receipt-parser.md)에 따라 _workspace/00_input.txt를 파싱하고 _workspace/01_parsed.json을 생성하라. food-knowledge와 clothing-knowledge 스킬을 참조하라."
    },
    {
      name: "schema-validator",
      agent_type: "general-purpose",
      model: "opus",
      prompt: "schema-validator 에이전트 정의(.claude/agents/schema-validator.md)에 따라 receipt-parser의 [PARSE_COMPLETE] 메시지를 수신하면 _workspace/01_parsed.json을 검증하고 _workspace/02_validated.json을 생성하라. harness/system-rules.json 기준을 따르라."
    }
  ]
)
```

작업 등록:
```
TaskCreate(tasks: [
  {
    title: "텍스트 파싱",
    description: "_workspace/00_input.txt 읽기 → FoodItem/ClothingItem 구조로 추출 → _workspace/01_parsed.json 저장 → schema-validator에게 [PARSE_COMPLETE] SendMessage",
    assignee: "receipt-parser"
  },
  {
    title: "스키마 검증",
    description: "_workspace/01_parsed.json 읽기 → system-rules.json 기준 검증 → 누락 필드 보완 → 듀얼 리뷰(자기 검토) → _workspace/02_validated.json 저장 → 오케스트레이터에게 [VALIDATION_COMPLETE] SendMessage",
    assignee: "schema-validator",
    depends_on: ["텍스트 파싱"]
  }
])
```

### Phase 3: 파이프라인 실행

1. receipt-parser 시작 신호 전송
2. `[PARSE_COMPLETE]` 메시지 대기
3. schema-validator 시작 신호 전송 (자동 연쇄 가능)
4. `[VALIDATION_COMPLETE]` 메시지 대기

### Phase 4: 결과 반환

1. `_workspace/02_validated.json` 읽기
2. `validationReport` 요약 출력
3. 최종 JSON을 호출자(API route 또는 사용자)에게 반환
4. 항목 수, 수정 사항, 경고 요약 제공

## 에러 핸들링

- receipt-parser가 항목을 찾지 못하면: 사용자에게 "파싱 가능한 항목을 찾지 못했습니다. 더 구체적인 텍스트를 입력해주세요." 안내
- schema-validator가 모든 항목을 거부하면: `validationReport.rejected` 내용을 사용자에게 표시하고 수동 입력 안내
- 타임아웃(에이전트 응답 없음): 단계별 로그를 확인하고 마지막 성공 단계부터 재시작

## 출력 형식

```json
{
  "items": [...],
  "summary": {
    "total": 3,
    "food": 2,
    "clothing": 1,
    "fixed": 1,
    "warnings": []
  }
}
```
