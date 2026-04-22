import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { foodItems, clothingItems } from '@/data/mockData';
import { FoodItem, ClothingItem } from '@/types';
import { AgentType, buildSystemInstruction, extractJSON } from './harness';

// ─── 자체 추상 타입 (SDK 의존성 차단) ──────────────────────────────────────
/**
 * 라우트가 만들어 넘기는 사용자 입력의 추상 형식.
 * 단일 문자열이거나, 텍스트·이미지가 섞인 블록 배열.
 *
 * 라우트 코드는 이 타입만 사용하고, Gemini SDK 형식은 본 모듈에서만 변환한다.
 * 추후 다른 LLM(예: Claude·OpenAI)으로 교체해도 라우트는 영향 없음.
 */
export type UserContentBlock =
  | { type: 'text';  text: string }
  | { type: 'image'; mimeType: string; base64: string };

export type UserContent = string | UserContentBlock[];

// ─── 모델 티어 정의 ────────────────────────────────────────────────────────────
/**
 * Gemini 무료 티어 (2026-04 기준):
 *
 *  gemini-2.0-flash       — 가장 빠르고 저렴, 무료 RPM 15·RPD 1500
 *  gemini-2.5-flash       — 더 똑똑한 추론, 무료 RPM 10·RPD 500
 *  gemini-2.5-pro         — 최고 품질, 무료 RPM 5·RPD 25
 *
 * 베이직 단계에서는 무료 티어 한도가 가장 넉넉한 2.0-flash 통일.
 * 응답 품질이 부족한 라우트만 추후 2.5-flash로 승격.
 */
export type AgentModel =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

/** 각 에이전트의 권장 모델 */
export const AGENT_MODEL: Record<AgentType, AgentModel> = {
  parser:    'gemini-2.0-flash',  // 구조화 추출
  nutrition: 'gemini-2.0-flash',  // 분석·추천
  style:     'gemini-2.0-flash',  // 코디 추천
  image:     'gemini-2.0-flash',  // 이미지 분석 (Vision 지원)
  url:       'gemini-2.0-flash',  // URL 텍스트 추출
  vision:    'gemini-2.0-flash',  // 통합 Vision 파서
} as const;

// ─── 클라이언트 싱글톤 ────────────────────────────────────────────────────────
let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

// ─── 1. 데이터 라우터 ─────────────────────────────────────────────────────────
/**
 * 에이전트 타입에 따라 필요한 데이터만 잘라서 반환한다.
 * (토큰 낭비 방지 — 불필요한 데이터 완전 차단)
 */
export function routeData(agentType: AgentType): FoodItem[] | ClothingItem[] | null {
  switch (agentType) {
    case 'nutrition': return foodItems;
    case 'style':     return clothingItems;
    default:          return null; // parser, image, url, vision
  }
}

// ─── 2. 추상 입력 → Gemini Part[] 변환 ─────────────────────────────────────
function toGeminiParts(content: UserContent): Part[] {
  if (typeof content === 'string') return [{ text: content }];
  return content.map((block): Part => {
    if (block.type === 'text') return { text: block.text };
    return { inlineData: { mimeType: block.mimeType, data: block.base64 } };
  });
}

// ─── 3. 이중 검토 파이프라인 ──────────────────────────────────────────────────
/**
 * Primary Call → Dual-Review Call 2단계 체인.
 *
 * Gemini 멀티턴 chat으로 1차 응답을 history에 넣고 검토를 요청한다.
 * `responseMimeType: 'application/json'`로 JSON 형식 강제 (extractJSON으로 안전망).
 */
export async function runWithDualReview(params: {
  agentType:        AgentType;
  agentInstruction: string;
  userContent:      UserContent;
  model?:           AgentModel;   // 미지정 시 AGENT_MODEL 기본값 사용
}): Promise<unknown> {
  const client = getGeminiClient();
  const modelName = params.model ?? AGENT_MODEL[params.agentType];
  const systemInstruction = buildSystemInstruction(params.agentInstruction);

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens:  4096,
      temperature:      0.3,  // 결정성 우선 — 같은 입력엔 비슷한 출력
    },
  });

  const userParts = toGeminiParts(params.userContent);

  // ── Step 1: Primary 분석 ─────────────────────────────────────────────────
  const primaryResult = await model.generateContent(userParts);
  const primaryText = primaryResult.response.text();

  // ── Step 2: Dual-Review (자가 검토) ──────────────────────────────────────
  const chat = model.startChat({
    history: [
      { role: 'user',  parts: userParts },
      { role: 'model', parts: [{ text: primaryText }] },
    ],
  });

  const reviewResult = await chat.sendMessage(
    '위 JSON 응답을 다시 검토해줘. ' +
    '다음 예외 케이스가 빠졌거나 잘못 처리되지는 않았는지 확인해:\n' +
    '  - 보관 가능 기한이 이미 지난 항목 (dDay ≤ 0)\n' +
    '  - 필수 필드가 누락된 항목\n' +
    '  - storageType, thickness 등 허용값 범위를 벗어난 값\n' +
    '  - UX 규칙: 금지어(유통기한, 소비기한 등) 포함 여부\n\n' +
    '수정이 필요하면 반영한 최종 JSON만 반환하고, ' +
    '변경 사항이 없으면 원본 JSON을 그대로 반환해줘. ' +
    '설명 없이 순수 JSON만 출력할 것.',
  );

  const finalText = reviewResult.response.text();

  // 개발 환경 비용·토큰 모니터링
  if (process.env.NODE_ENV === 'development') {
    const pu = primaryResult.response.usageMetadata;
    const ru = reviewResult.response.usageMetadata;
    console.log(
      `[${params.agentType}] model=${modelName}\n` +
      `  Primary : in=${pu?.promptTokenCount ?? '?'} / out=${pu?.candidatesTokenCount ?? '?'}\n` +
      `  Review  : in=${ru?.promptTokenCount ?? '?'} / out=${ru?.candidatesTokenCount ?? '?'}`,
    );
  }

  return extractJSON(finalText);
}
