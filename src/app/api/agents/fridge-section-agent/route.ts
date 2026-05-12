/**
 * fridge-section-agent — AI 보관 위치 추천 (Phase 8.0 Step 5)
 *
 * 역할: 식품 1건의 이름·카테고리·보관 타입과 사용자가 보유한 모델의 칸 목록을 받아
 *       가장 적합한 보관 위치(FridgeSection)와 짧은 이유를 추천한다.
 *
 * 룰 기반(`recommendFridgeSection`)은 즉시·무료. 본 라우트는 룰 결과를 폴백으로 들고
 * "더 정확한 추천"이 필요할 때만 호출되는 강화 레이어.
 *
 * 입력: { name, foodCategory, storageType, modelCells: FridgeSection[] }
 * 출력: { section: FridgeSection, reason: string }
 *
 * 모델: gemini-2.5-flash-lite — 단일 식품 분류, 저비용·빠른 응답
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, AGENT_MODEL } from '@/lib/agentPipeline';
import { extractJSON } from '@/lib/harness';
import { FRIDGE_SECTION_META, recommendFridgeSection } from '@/lib/fridgeSection';
import type { FoodCategory, FridgeSection, StorageType } from '@/types';

const FOOD_CATEGORIES: ReadonlyArray<FoodCategory> = [
  '채소·과일', '정육·계란', '수산·해산', '유제품', '음료',
  '간식·과자', '양념·소스', '면·즉석', '빵·베이커리', '건강식품', '기타 식품',
];
const STORAGE_TYPES: ReadonlyArray<StorageType> = ['냉장', '냉동', '실온'];
const ALL_SECTIONS = new Set<FridgeSection>(Object.keys(FRIDGE_SECTION_META) as FridgeSection[]);

interface RequestBody {
  name?:         unknown;
  foodCategory?: unknown;
  storageType?:  unknown;
  modelCells?:   unknown;
}

interface AgentInput {
  name:         string;
  foodCategory: FoodCategory;
  storageType:  StorageType;
  modelCells:   FridgeSection[];
}

function parseBody(body: RequestBody): AgentInput | { error: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'name 필드가 필요합니다.' };

  if (!FOOD_CATEGORIES.includes(body.foodCategory as FoodCategory)) {
    return { error: '올바른 foodCategory가 필요합니다.' };
  }
  if (!STORAGE_TYPES.includes(body.storageType as StorageType)) {
    return { error: '올바른 storageType이 필요합니다.' };
  }

  const raw = Array.isArray(body.modelCells) ? body.modelCells : [];
  const cells = raw.filter((c): c is FridgeSection => typeof c === 'string' && ALL_SECTIONS.has(c as FridgeSection));
  if (cells.length === 0) {
    return { error: 'modelCells에 최소 한 개 이상의 유효한 칸이 필요합니다.' };
  }

  return {
    name,
    foodCategory: body.foodCategory as FoodCategory,
    storageType:  body.storageType as StorageType,
    modelCells:   cells,
  };
}

function buildPrompt(input: AgentInput): string {
  const cellLines = input.modelCells
    .map((id) => {
      const meta = FRIDGE_SECTION_META[id];
      return `- ${id} (${meta.label}, ${meta.zone}): ${meta.hint}`;
    })
    .join('\n');

  return [
    '당신은 NEMOA(네모아)의 **냉장고 보관 위치 추천 에이전트**다.',
    '',
    '## 역할',
    '식품 1건의 이름·카테고리·보관 방법을 분석해, 사용자가 보유한 냉장고 모델의',
    '칸 목록 중 가장 적합한 보관 위치 1개를 골라 짧은 이유와 함께 반환한다.',
    '',
    '## 절대 규칙',
    '1. section은 아래 "사용 가능한 칸" 목록의 id 중 하나여야 한다. 그 외 값 금지.',
    '2. storageType이 "냉동"이면 freezer 계열 칸을, "실온"이면 pantry를 우선 선택한다.',
    '3. reason은 한국어 1문장(40자 이내), 친근한 존댓말. "유통기한"·"소비기한" 표현 금지.',
    '4. JSON 외 다른 텍스트를 절대 출력하지 않는다.',
    '',
    '## 식품 정보',
    `- 이름: ${input.name}`,
    `- 카테고리: ${input.foodCategory}`,
    `- 보관 방법: ${input.storageType}`,
    '',
    '## 사용 가능한 칸',
    cellLines,
    '',
    '## 출력 형식 (반드시 이 구조만)',
    '{ "section": "<위 id 중 하나>", "reason": "한 문장 추천 사유" }',
  ].join('\n');
}

interface AgentResult {
  section: FridgeSection;
  reason:  string;
}

function fallback(input: AgentInput): AgentResult {
  const rule = recommendFridgeSection(input);
  const section = input.modelCells.includes(rule) ? rule : input.modelCells[0];
  const meta = FRIDGE_SECTION_META[section];
  return { section, reason: `${meta.hint} 칸에 두면 좋아요.` };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const parsed = parseBody(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: AGENT_MODEL.parser, // gemini-2.5-flash-lite — 저비용
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    });

    const prompt = buildPrompt(parsed);
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const raw = extractJSON(text);

    let section: FridgeSection;
    let reason: string;
    if (
      raw && typeof raw === 'object'
      && typeof (raw as Record<string, unknown>).section === 'string'
      && ALL_SECTIONS.has((raw as Record<string, unknown>).section as FridgeSection)
      && parsed.modelCells.includes((raw as Record<string, unknown>).section as FridgeSection)
    ) {
      section = (raw as Record<string, unknown>).section as FridgeSection;
      const rawReason = (raw as Record<string, unknown>).reason;
      reason = typeof rawReason === 'string' && rawReason.trim()
        ? rawReason.trim().slice(0, 80)
        : `${FRIDGE_SECTION_META[section].hint} 칸을 추천합니다.`;
    } else {
      // AI 결과 검증 실패 → 룰 기반 폴백
      const fb = fallback(parsed);
      section = fb.section;
      reason  = fb.reason;
    }

    return NextResponse.json({ section, reason } satisfies AgentResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `fridge-section-agent 처리 실패: ${message}` },
      { status: 500 },
    );
  }
}
