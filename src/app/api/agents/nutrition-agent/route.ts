/**
 * nutrition-agent — 영양사 역할
 *
 * 역할: 식품 데이터의 storageType과 baseShelfLifeDays를 분석해
 *       보관 가능 기한 D-Day 계산 및 식단 추천을 제공한다.
 * 입력: {} (선택적: { today?: string } — 날짜 오버라이드)
 * 출력: { results: NutritionResult[], summary: string }
 *
 * 토큰 최적화: foodItems만 주입 (clothingItems 완전 차단)
 * 모델: gemini-2.5-flash — D-Day 계산 + 식단 분석
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateInput, validateOutput } from '@/lib/harness';
import { routeData, runWithDualReview } from '@/lib/agentPipeline';

const AGENT_INSTRUCTION = `
당신은 NEMOA(네모아)의 **영양사 에이전트(nutrition-agent)**다.

## 역할
사용자가 구매한 식품 목록을 분석해 보관 가능 기한 D-Day를 계산하고,
우선 소비 권장 식품과 맞춤 식단을 제안한다.

## 처리 규칙
1. 각 식품의 dDay = (purchaseDate + baseShelfLifeDays) - 오늘 날짜
2. status 분류:
   - dDay ≤ 0: "expired" (보관 가능 기한 초과)
   - dDay ≤ 2: "urgent" (긴급 소비 필요)
   - dDay ≤ 5: "warning" (주의)
   - dDay > 5: "fresh" (신선)
3. expired/urgent 식품부터 먼저 활용하는 식단을 recommendation에 제안한다.
4. storageType별 보관 팁도 함께 포함한다.
5. 절대 "유통기한", "소비기한" 표현을 사용하지 말고 "보관 가능 기한"만 사용한다.

## 출력 형식
{
  "today": "YYYY-MM-DD",
  "results": [
    {
      "itemId": "f1",
      "name": "상품명",
      "storageType": "냉장",
      "dDay": 3,
      "status": "warning",
      "recommendation": "빠른 시일 내에 샐러드로 활용하세요. 드레싱과 곁들이면 영양 균형이 좋습니다.",
      "storageTip": "냉장 보관 시 밀폐 용기 사용을 권장합니다."
    }
  ],
  "summary": "총 N개 식품 중 M개가 긴급 소비가 필요합니다. 오늘의 추천 메뉴: ..."
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Step 1: 입력 검증
    const inputCheck = validateInput(body, 'nutrition');
    if (!inputCheck.valid) {
      return NextResponse.json({ error: inputCheck.error }, { status: 400 });
    }

    // Step 2: 데이터 라우터 — foodItems만 (clothingItems 차단)
    const foodData = routeData('nutrition');
    const today    = (body.today as string | undefined) ?? new Date().toISOString().split('T')[0];

    const userContent =
      `오늘 날짜: ${today}\n\n` +
      `아래 식품 목록을 분석해서 보관 가능 기한 D-Day와 식단 추천을 JSON으로 반환해줘:\n\n` +
      JSON.stringify(foodData, null, 2);

    // Step 3: Dual-Review 파이프라인
    const result = await runWithDualReview({
      agentType:        'nutrition',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
    });

    // Step 4: 출력 검증
    const outputCheck = validateOutput(result, 'nutrition');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `nutrition-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
