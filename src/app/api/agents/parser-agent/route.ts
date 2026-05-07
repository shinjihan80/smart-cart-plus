/**
 * parser-agent — 데이터 엔지니어 역할
 *
 * 역할: 외부 데이터(이메일/영수증 텍스트)를 Phase 1 스키마 구조의 JSON으로 정제한다.
 * 입력: { rawText: string }
 * 출력: { items: (FoodItem | ClothingItem)[] }
 *
 * 모델: gemini-2.5-flash — Vision 지원 (구조화 추출용)
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
import { inferWeatherTagsFallback, sanitizeWeatherTags } from '@/lib/clothingInference';
import { FASHION_GROUP, type FashionCategory, type Thickness, type WeatherTag } from '@/types';

const AGENT_INSTRUCTION = `
당신은 NEMOA(네모아)의 **데이터 엔지니어 에이전트(parser-agent)**다.

## 역할
이메일, 영수증, 구매 확인 메시지 등 비정형 텍스트를 분석해
앱의 Phase 1 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## 처리 규칙
1. 텍스트에서 상품명, 카테고리, 구매일, 수량 등 핵심 정보를 추출한다.
2. 각 상품이 식품인지 패션인지 판단한다:
   - 식품: foodCategory를 분류하고, storageType 추론, baseShelfLifeDays 설정
     foodCategory: "채소·과일" | "정육·계란" | "수산·해산" | "유제품" | "음료" | "간식·과자" | "양념·소스" | "면·즉석" | "빵·베이커리" | "건강식품" | "기타 식품"
   - 패션: category를 세분화, size/thickness/material 추출
     category: "상의" | "하의" | "아우터" | "원피스" | "신발" | "가방" | "모자" | "스카프" | "안경" | "선글라스" | "시계" | "주얼리" | "기타 액세서리"
3. id는 "p" + 인덱스(1부터) 형식. 예: "p1", "p2"
4. purchaseDate는 텍스트에서 없으면 오늘 날짜(${new Date().toISOString().split('T')[0]}) 사용
5. 금지어: "유통기한", "소비기한" → "보관 가능 기한" 사용
6. **패션 아이템은 weatherTags(["봄"|"여름"|"가을"|"겨울"|"우천"|"맑음"] 중 1~3개)를 반드시 부여한다:**
   - thickness "얇음" → ["봄","여름"] 또는 ["여름"]
   - thickness "보통" → ["봄","가을"]
   - thickness "두꺼움" → ["가을","겨울"] 또는 ["겨울"]
   - 아우터는 계절 하나 아래로 포함 (예: 얇은 아우터도 "가을" 포함)
   - 레인코트·방수 등은 "우천", 선글라스·썬캡 등은 "맑음" 추가
   - 신발·가방·액세서리는 계절 영향 낮으면 생략 가능

## 출력 형식 (반드시 이 구조만 반환)
{
  "items": [
    {
      "id": "p1",
      "name": "...",
      "category": "식품",
      "foodCategory": "유제품",
      "storageType": "냉장",
      "baseShelfLifeDays": 10,
      "purchaseDate": "YYYY-MM-DD"
    },
    {
      "id": "p2",
      "name": "...",
      "category": "상의",
      "size": "M",
      "thickness": "보통",
      "material": "면",
      "weatherTags": ["봄","가을"]
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
    });

    // Step 4: 출력 검증
    const outputCheck = validateOutput(result, 'parser');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    // Step 5: 의류 weatherTags 보정 — AI가 누락한 경우 thickness 기반 폴백
    const resultObj = result as { items?: unknown[] };
    if (Array.isArray(resultObj.items)) {
      resultObj.items = resultObj.items.map((item) => {
        const rec = item as Record<string, unknown>;
        if (rec.category === '식품') return rec;
        const cat = rec.category as FashionCategory | undefined;
        if (!cat || FASHION_GROUP[cat] === undefined) return rec;
        const cleaned: WeatherTag[] = sanitizeWeatherTags(rec.weatherTags);
        if (cleaned.length === 0) {
          const thickness = (rec.thickness as Thickness) ?? '보통';
          const fallback = inferWeatherTagsFallback(thickness, cat);
          if (fallback.length > 0) rec.weatherTags = fallback;
          else delete rec.weatherTags;
        } else {
          rec.weatherTags = cleaned;
        }
        return rec;
      });
    }

    return NextResponse.json(resultObj);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `parser-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
