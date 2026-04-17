/**
 * vision-parser — 통합 Multimodal Vision 파서 (Phase 3.5)
 *
 * 역할: 식품 라벨 / 의류 사이즈표 / 세탁 주의사항 이미지를 분석해
 *      AI가 스스로 도메인(식품·패션)을 분류하고 Phase 3.5 스키마 JSON으로 변환한다.
 * 입력: FormData { image: File }
 * 출력: { items: CartItem[], domain_summary: { food: number, fashion: number } }
 *
 * 모델: claude-sonnet-4-6 — 정확한 도메인 분류 + 세부 필드 추출
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateOutput } from '@/lib/harness';
import { runWithDualReview } from '@/lib/agentPipeline';
import {
  StorageType,
  Thickness,
  WeatherTag,
  FoodItem,
  EnrichedClothingItem,
  CartItem,
} from '@/types';
import Anthropic from '@anthropic-ai/sdk';

// ─── API 내부 전용 타입 (export 없음) ─────────────────────────────────────────

type VisionRawFoodItem = {
  domain:            'food';
  id:                string;
  name:              string;
  storageType:       string;
  baseShelfLifeDays: number;
  purchaseDate:      string;
  nutritionFacts?: {
    calories?: number;
    protein?:  number;
    fat?:      number;
    carbs?:    number;
  };
};

type VisionRawFashionItem = {
  domain:     'fashion';
  id:         string;
  name:       string;
  category:   string;
  size:       string;
  thickness:  string;
  material:   string;
  attributes?: {
    sheerness?: boolean;
    stretch?:   boolean;
    lining?:    boolean;
  };
  measurements?: {
    chest?:        number;
    totalLength?:  number;
    waist?:        number;
    waistBanding?: boolean;
  };
  washingTip?:   string;
  weatherTags?:  string[];
  colorFamily?:  string;
};

type VisionRawItem = VisionRawFoodItem | VisionRawFashionItem;

// ─── System Prompt ────────────────────────────────────────────────────────────

const AGENT_INSTRUCTION = `
당신은 Smart Cart Plus의 **통합 Vision 파서(vision-parser)**다.

## 역할
식품 라벨, 의류 사이즈표, 세탁 주의사항 등 다양한 제품 이미지를 분석해
앱의 Phase 3.5 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## Step 1 — 도메인 분류 (최우선)
이미지를 보고 **반드시 먼저** 이 데이터가 식품(food)인지 패션/의류(fashion)인지 판단한다.
- 식품: 식재료, 가공식품, 음료, 과자, 냉동식품 등
- 패션: 의류, 신발, 가방, 액세서리, 사이즈표, 세탁 라벨 등

## Step 2A — 식품(food) 추출 규칙
- domain: "food" 반드시 포함
- storageType: "냉장" | "냉동" | "실온" 중 하나 (라벨에 없으면 식품 유형으로 추론)
- baseShelfLifeDays: 라벨의 보관 기한 또는 식품 유형 기반 추론값 (숫자)
- purchaseDate: 이미지에서 확인 불가능하면 오늘 날짜 (YYYY-MM-DD)
- 금지어: "유통기한", "소비기한" → "보관 가능 기한" 사용

## Step 2B — 패션/의류(fashion) 추출 규칙
- domain: "fashion" 반드시 포함
- category: "의류" 또는 "액세서리"
- size: 이미지에서 추출, 없으면 "Free"
- thickness: "얇음" | "보통" | "두꺼움" 중 하나
- material: 혼용률 표기에서 추출 (예: "면 100%", "폴리에스터 60% 면 40%")
- attributes 객체 (모두 boolean, 확인 불가 시 생략):
  - sheerness: 비침 여부 (true = 비침 있음)
  - stretch: 신축성 여부 (true = 신축성 있음)
  - lining: 안감 여부 (true = 안감 있음)
- measurements 객체 (cm 단위 숫자, 이미지에서 수치 확인 가능한 경우만):
  - chest: 가슴둘레
  - totalLength: 총장
  - waist: 허리
  - waistBanding: 밴딩 여부 (boolean)
- washingTip: 세탁 주의사항 요약 (예: "손세탁 권장, 단독 세탁")

## 출력 형식 (반드시 이 구조만 반환, 설명 없이 순수 JSON)
{
  "domain_summary": { "food": 0, "fashion": 0 },
  "items": [
    {
      "domain": "food",
      "id": "p1",
      "name": "상품명",
      "storageType": "냉장",
      "baseShelfLifeDays": 5,
      "purchaseDate": "YYYY-MM-DD"
    }
  ]
}
`.trim();

// ─── 허용값 상수 ──────────────────────────────────────────────────────────────

const VALID_STORAGE_TYPES: StorageType[] = ['냉장', '냉동', '실온'];
const VALID_THICKNESSES:   Thickness[]   = ['얇음', '보통', '두꺼움'];
const VALID_WEATHER_TAGS:  WeatherTag[]  = ['봄', '여름', '가을', '겨울', '우천', '맑음'];
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedMediaType = typeof ALLOWED_MEDIA_TYPES[number];
const MAX_SIZE_MB = 5;

// ─── 변환 경계: VisionRawItem → CartItem ─────────────────────────────────────

function mapVisionRawToCartItem(raw: VisionRawItem): CartItem {
  if (raw.domain === 'food') {
    const storageType: StorageType = VALID_STORAGE_TYPES.includes(raw.storageType as StorageType)
      ? (raw.storageType as StorageType)
      : '실온';

    const item: FoodItem = {
      id:                raw.id,
      name:              raw.name,
      category:          '식품',
      storageType,
      baseShelfLifeDays: Math.max(1, Math.round(raw.baseShelfLifeDays)),
      purchaseDate:      raw.purchaseDate || new Date().toISOString().split('T')[0],
      nutritionFacts:    raw.nutritionFacts,
    };
    return item;
  }

  // domain === 'fashion'
  const thickness: Thickness = VALID_THICKNESSES.includes(raw.thickness as Thickness)
    ? (raw.thickness as Thickness)
    : '보통';

  const category = (raw.category === '의류' || raw.category === '액세서리')
    ? raw.category
    : '의류';

  const weatherTags = (raw.weatherTags ?? [])
    .filter((t): t is WeatherTag => VALID_WEATHER_TAGS.includes(t as WeatherTag));

  const item: EnrichedClothingItem = {
    id:          raw.id,
    name:        raw.name,
    category,
    size:        raw.size || 'Free',
    thickness,
    material:    raw.material || '정보 없음',
    weatherTags: weatherTags.length > 0 ? weatherTags : undefined,
    colorFamily: raw.colorFamily,
    attributes:  raw.attributes,
    measurements: raw.measurements,
    washingTip:  raw.washingTip,
  };
  return item;
}

// ─── POST 핸들러 ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    }
    if (!ALLOWED_MEDIA_TYPES.includes(file.type as AllowedMediaType)) {
      return NextResponse.json({ error: 'JPG, PNG, GIF, WEBP 형식만 지원합니다.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `이미지 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.` }, { status: 400 });
    }

    // File → base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

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
        text: '이 이미지를 분석해서 Phase 3.5 스키마 JSON으로 변환해줘. 식품인지 패션인지 먼저 판단하고, 각 도메인에 맞는 필드를 추출해.',
      },
    ];

    const result = await runWithDualReview({
      agentType:        'vision',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
      model:            'claude-sonnet-4-6',
    });

    const outputCheck = validateOutput(result, 'vision');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    // VisionRawItem[] → CartItem[] 변환
    const raw = result as { items: VisionRawItem[]; domain_summary: { food: number; fashion: number } };
    const items: CartItem[] = raw.items.map(mapVisionRawToCartItem);

    return NextResponse.json({
      items,
      domain_summary: raw.domain_summary,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `vision-parser 처리 실패: ${message}` }, { status: 500 });
  }
}
