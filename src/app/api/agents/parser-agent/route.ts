/**
 * parser-agent — 데이터 엔지니어 역할
 *
 * 역할: 외부 데이터(이메일/영수증 텍스트)를 Phase 1 스키마 구조의 JSON으로 정제한다.
 * 입력: { rawText: string }
 * 출력: { items: (FoodItem | ClothingItem)[] }
 *
 * 모델: claude-haiku-4-5 — 단순 구조화 추출만 수행, 추론 불필요 → 최저 비용
 *
 * 파이프라인:
 *   1. 입력 검증 (Harness)
 *   2. rawText → Primary LLM 분석
 *   3. Dual-Review (예외 케이스 자가 검토)
 *   4. 출력 검증 (Harness)
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateInput, validateOutput } from '@/lib/harness';
import { runWithDualReview } from '@/lib/agentPipeline';

const AGENT_INSTRUCTION = `
당신은 Smart Cart Plus의 **데이터 엔지니어 에이전트(parser-agent)**다.

## 역할
이메일, 영수증, 구매 확인 메시지 등 비정형 텍스트를 분석해
앱의 Phase 1 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## 처리 규칙
1. 텍스트에서 상품명, 카테고리, 구매일, 수량 등 핵심 정보를 추출한다.
2. 각 상품이 식품인지 의류/액세서리인지 판단한다:
   - 식품: storageType을 추론 (냉장/냉동/실온), baseShelfLifeDays를 상식적으로 설정
   - 의류: size, thickness, material을 텍스트에서 추출 (없으면 합리적 기본값 사용)
3. id는 "p" + 인덱스(1부터) 형식으로 자동 생성한다. 예: "p1", "p2"
4. purchaseDate는 텍스트에서 찾을 수 없으면 오늘 날짜(${new Date().toISOString().split('T')[0]})를 사용한다.

## 출력 형식 (반드시 이 구조만 반환)
{
  "items": [
    // FoodItem 예시
    {
      "id": "p1",
      "name": "...",
      "category": "식품",
      "storageType": "냉장",
      "baseShelfLifeDays": 7,
      "purchaseDate": "YYYY-MM-DD"
    },
    // ClothingItem 예시
    {
      "id": "p2",
      "name": "...",
      "category": "의류",
      "size": "M",
      "thickness": "보통",
      "material": "면"
    }
  ]
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    // Step 1: 입력 검증
    const inputCheck = validateInput(body, 'parser');
    if (!inputCheck.valid) {
      return NextResponse.json({ error: inputCheck.error }, { status: 400 });
    }

    // Step 2 & 3: Dual-Review 파이프라인
    const userContent = `다음 텍스트를 분석해서 Phase 1 스키마 JSON으로 변환해줘:\n\n${body.rawText}`;

    const result = await runWithDualReview({
      agentType:        'parser',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
      model:            'claude-haiku-4-5',  // 단순 추출 → 최저 비용
    });

    // Step 4: 출력 검증
    const outputCheck = validateOutput(result, 'parser');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `parser-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
