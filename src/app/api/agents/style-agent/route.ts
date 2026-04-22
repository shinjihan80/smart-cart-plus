/**
 * style-agent — 스타일리스트 역할
 *
 * 역할: 날씨 데이터와 의류의 thickness, material 정보를 분석해
 *       오늘 날씨에 어울리는 코디를 제안한다.
 * 입력: { weather?: string } — 날씨 설명 (예: "맑음 23도", "비 15도")
 * 출력: { weather, outfits: OutfitResult[] }
 *
 * 토큰 최적화: clothingItems만 주입 (foodItems 완전 차단)
 * 모델: gemini-2.0-flash — 날씨 + 코디 분석
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateInput, validateOutput } from '@/lib/harness';
import { routeData, runWithDualReview } from '@/lib/agentPipeline';

const AGENT_INSTRUCTION = `
당신은 NEMOA(네모아)의 **스타일리스트 에이전트(style-agent)**다.

## 역할
사용자가 보유한 의류 및 액세서리와 오늘의 날씨 정보를 분석해
최적의 코디 조합을 제안한다.

## 처리 규칙
1. 날씨(기온, 날씨 상태)와 각 아이템의 thickness를 매칭한다:
   - 더운 날씨 (25도 이상): 두꺼움 → 비추천, 얇음 → 추천
   - 서늘한 날씨 (15도 이하): 얇음 → 비추천, 두꺼움 → 추천
   - 중간 날씨: 보통 → 추천
2. weatherTags가 있으면 현재 계절/날씨와 매칭해 우선 추천한다.
3. material 정보를 활용해 소재별 특성(통기성, 보온성)을 코디 제안에 반영한다.
4. 액세서리는 선택된 의류와의 어울림(colorFamily 기준)을 고려해 매칭한다.
5. 착용 가능(추천) / 보관 권장(비추천) 두 가지로 분류한다.

## 출력 형식
{
  "weather": "입력된 날씨 정보 또는 '날씨 정보 없음'",
  "outfits": [
    {
      "itemId": "c1",
      "name": "상품명",
      "category": "의류",
      "outfitSuggestion": "이 날씨에 잘 어울리는 코디 제안 설명",
      "weatherMatch": true,
      "reason": "리넨 소재는 통기성이 좋아 무더운 날씨에 적합합니다.",
      "pairingTip": "같은 어스톤 계열의 베이지 팬츠와 매치를 추천합니다."
    }
  ],
  "todayRecommendation": "오늘 날씨에 가장 추천하는 코디 조합 한 줄 요약"
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Step 1: 입력 검증
    const inputCheck = validateInput(body, 'style');
    if (!inputCheck.valid) {
      return NextResponse.json({ error: inputCheck.error }, { status: 400 });
    }

    // Step 2: 데이터 라우터 — clothingItems만 (foodItems 차단)
    const clothingData = routeData('style');
    const weather      = (body.weather as string | undefined) ?? '날씨 정보 없음';

    const userContent =
      `오늘 날씨: ${weather}\n\n` +
      `아래 의류/액세서리 목록 중 오늘 날씨에 어울리는 코디를 JSON으로 제안해줘:\n\n` +
      JSON.stringify(clothingData, null, 2);

    // Step 3: Dual-Review 파이프라인
    const result = await runWithDualReview({
      agentType:        'style',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
    });

    // Step 4: 출력 검증
    const outputCheck = validateOutput(result, 'style');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `style-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
