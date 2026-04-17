import Anthropic from '@anthropic-ai/sdk';
import { foodItems, clothingItems } from '@/data/mockData';
import { FoodItem, ClothingItem } from '@/types';
import { AgentType, buildSystemBlocks, extractJSON } from './harness';

// ─── 모델 티어 정의 ────────────────────────────────────────────────────────────
/**
 * 비용 최적화 전략 (2026-04 기준):
 *
 *  HAIKU   — 단순 구조화 추출 (텍스트 파싱, 필드 매핑)
 *             입력 $1.00 / 출력 $5.00  per 1M tokens
 *
 *  SONNET  — 추론 + 분석 (D-Day 계산, 식단·코디 추천)
 *             입력 $3.00 / 출력 $15.00 per 1M tokens
 *
 *  OPUS    — 고난도 판단 (복합 에이전트, 계층적 추론)
 *             입력 $5.00 / 출력 $25.00 per 1M tokens
 *
 * 현재 할당:
 *   parser-agent    → HAIKU   (구조화 추출만, 추론 불필요)
 *   nutrition-agent → SONNET  (D-Day + 식단 분석)
 *   style-agent     → SONNET  (날씨 + 코디 추천)
 */
export type AgentModel =
  | 'claude-haiku-4-5'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6';

/** 각 에이전트의 권장 모델 — 라우트에서 명시적으로 지정한다 */
export const AGENT_MODEL: Record<AgentType, AgentModel> = {
  parser:    'claude-haiku-4-5',   // 저비용 추출
  nutrition: 'claude-sonnet-4-6',  // 분석·추천
  style:     'claude-sonnet-4-6',  // 분석·추천
  image:     'claude-haiku-4-5',   // 이미지 → 구조화 추출 (Vision, 저비용)
  url:       'claude-haiku-4-5',   // URL 텍스트 → 구조화 추출
  vision:    'claude-sonnet-4-6',  // 통합 Vision 파서 (식품·패션 자동 분류, 고정밀)
} as const;

// ─── 클라이언트 싱글톤 ────────────────────────────────────────────────────────
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
    default:          return null; // parser, image, url
  }
}

// ─── 2. 이중 검토 파이프라인 ──────────────────────────────────────────────────
/**
 * Primary Call → Dual-Review Call 2단계 체인.
 *
 * @param model       사용할 Claude 모델 (기본값: AGENT_MODEL[agentType])
 *
 * 모델별 thinking 전략:
 *   Haiku  → thinking 미지원 → 생략 (max_tokens 2048로 절약)
 *   Sonnet → adaptive thinking 적용 (추론 품질 향상)
 *   Opus   → adaptive thinking 적용
 *
 * 프롬프트 캐싱:
 *   systemBlocks[0] = global-context.md  → 가장 안정적 → 캐시 최우선
 *   systemBlocks[1] = 에이전트 지시       → 안정적       → 캐시 적용
 *   Review 호출 시 동일 system 재사용     → 캐시 히트 (~90% 절감)
 */
export async function runWithDualReview(params: {
  agentType:        AgentType;
  agentInstruction: string;
  userContent:      string | Anthropic.Messages.ContentBlockParam[];
  model?:           AgentModel;   // 미지정 시 AGENT_MODEL 기본값 사용
}): Promise<unknown> {
  const client = getAnthropicClient();
  const model  = params.model ?? AGENT_MODEL[params.agentType];
  const systemBlocks = buildSystemBlocks(params.agentInstruction);

  // Haiku는 thinking 미지원 — 조건부 파라미터 구성
  const isHaiku     = model === 'claude-haiku-4-5';
  const maxTokens   = isHaiku ? 2048 : 4096;
  const thinkingOpt = isHaiku
    ? {}
    : { thinking: { type: 'adaptive' } as const };

  // ── Step 1: Primary 분석 ─────────────────────────────────────────────────
  const primaryResponse = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...thinkingOpt,
    system:   systemBlocks,
    messages: [{ role: 'user', content: params.userContent }],
  });

  const primaryText = primaryResponse.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  // ── Step 2: Dual-Review (자가 검토) ──────────────────────────────────────
  const reviewResponse = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...thinkingOpt,
    system:   systemBlocks,   // 동일 블록 → 캐시 히트
    messages: [
      { role: 'user',      content: params.userContent },
      { role: 'assistant', content: primaryText },
      {
        role: 'user',
        content:
          '위 JSON 응답을 다시 검토해줘. ' +
          '다음 예외 케이스가 빠졌거나 잘못 처리되지는 않았는지 확인해:\n' +
          '  - 보관 가능 기한이 이미 지난 항목 (dDay ≤ 0)\n' +
          '  - 필수 필드가 누락된 항목\n' +
          '  - storageType, thickness 등 허용값 범위를 벗어난 값\n' +
          '  - UX 규칙: 금지어(유통기한, 소비기한 등) 포함 여부\n\n' +
          '수정이 필요하면 반영한 최종 JSON만 반환하고, ' +
          '변경 사항이 없으면 원본 JSON을 그대로 반환해줘. ' +
          '설명 없이 순수 JSON만 출력할 것.',
      },
    ],
  });

  const finalText = reviewResponse.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  // 개발 환경 비용 모니터링 로그
  if (process.env.NODE_ENV === 'development') {
    const pu = primaryResponse.usage;
    const ru = reviewResponse.usage;
    console.log(
      `[${params.agentType}] model=${model}\n` +
      `  Primary : in=${pu.input_tokens} / out=${pu.output_tokens} / cache_read=${pu.cache_read_input_tokens ?? 0}\n` +
      `  Review  : in=${ru.input_tokens} / out=${ru.output_tokens} / cache_read=${ru.cache_read_input_tokens ?? 0}`,
    );
  }

  return extractJSON(finalText);
}
