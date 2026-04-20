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
당신은 NEMOA(네모아)의 **이미지 분석 에이전트(image-agent)**다.

## 역할
영수증, 제품 태그, 식품 포장, 택배 송장 등의 이미지를 분석해
앱의 Phase 1 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## 처리 규칙
1. 이미지에서 상품명, 카테고리, 구매일, 보관 방법 등 핵심 정보를 추출한다.
2. 각 상품이 식품인지 패션인지 판단한다:
   - 식품: foodCategory 분류, storageType 추론, baseShelfLifeDays 추정
     foodCategory: "채소·과일" | "정육·계란" | "수산·해산" | "유제품" | "음료" | "간식·과자" | "양념·소스" | "면·즉석" | "빵·베이커리" | "건강식품" | "기타 식품"
   - 패션: category 세분화, size/thickness/material 추출
     category: "상의" | "하의" | "아우터" | "원피스" | "신발" | "가방" | "모자" | "스카프" | "안경" | "선글라스" | "시계" | "주얼리" | "기타 액세서리"
3. id는 "p" + 인덱스(1부터). 예: "p1", "p2"
4. purchaseDate는 없으면 오늘 날짜.
5. 금지어: "유통기한", "소비기한" → "보관 가능 기한" 사용

## 출력 형식 (반드시 이 구조만 반환)
{
  "items": [
    {
      "id": "p1",
      "name": "상품명",
      "category": "식품",
      "foodCategory": "채소·과일",
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
