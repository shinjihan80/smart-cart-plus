/**
 * image-agent — 이미지 분석 역할
 *
 * 역할: 영수증·제품 태그·식품 포장 등 이미지를 분석해 Phase 1 스키마 JSON으로 변환한다.
 * 입력: FormData { image: File }
 * 출력: { items: (FoodItem | ClothingItem)[] }
 *
 * 모델: claude-haiku-4-5 — Vision 지원, 구조화 추출 → 저비용
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateOutput } from '@/lib/harness';
import { runWithDualReview } from '@/lib/agentPipeline';
import Anthropic from '@anthropic-ai/sdk';

const AGENT_INSTRUCTION = `
당신은 Smart Cart Plus의 **이미지 분석 에이전트(image-agent)**다.

## 역할
영수증, 제품 태그, 식품 포장, 택배 송장 등의 이미지를 분석해
앱의 Phase 1 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## 처리 규칙
1. 이미지에서 상품명, 카테고리, 구매일, 보관 방법 등 핵심 정보를 추출한다.
2. 각 상품이 식품인지 의류/액세서리인지 판단한다:
   - 식품: storageType(냉장/냉동/실온), baseShelfLifeDays를 라벨 또는 상식으로 추정
   - 의류: size, thickness(얇음/보통/두꺼움), material을 태그에서 추출
3. id는 "p" + 인덱스(1부터) 형식. 예: "p1", "p2"
4. purchaseDate는 이미지에서 찾을 수 없으면 오늘 날짜를 사용한다.
5. 보관 가능 기한 관련 표현 시 "유통기한", "소비기한" 금지 → "보관 가능 기한" 사용

## 출력 형식 (반드시 이 구조만 반환)
{
  "items": [
    {
      "id": "p1",
      "name": "상품명",
      "category": "식품",
      "storageType": "냉장",
      "baseShelfLifeDays": 5,
      "purchaseDate": "YYYY-MM-DD"
    }
  ]
}
`.trim();

type AllowedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
const ALLOWED_TYPES: AllowedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type as AllowedMediaType)) {
      return NextResponse.json({ error: 'JPG, PNG, GIF, WEBP 형식만 지원합니다.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `이미지 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.` }, { status: 400 });
    }

    // File → base64 변환
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // 이미지 + 텍스트 지시를 함께 전달하는 콘텐츠 블록 구성
    const userContent: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: 'image',
        source: {
          type:       'base64',
          media_type: file.type as AllowedMediaType,
          data:       base64,
        },
      },
      {
        type: 'text',
        text: '이 이미지를 분석해서 Phase 1 스키마 JSON으로 변환해줘. 상품명, 카테고리, 보관 방법, 구매일 등을 추출해.',
      },
    ];

    const result = await runWithDualReview({
      agentType:        'image',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
      model:            'claude-haiku-4-5',
    });

    const outputCheck = validateOutput(result, 'parser'); // parser와 동일 스키마
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `image-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
