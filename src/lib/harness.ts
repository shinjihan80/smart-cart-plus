import fs   from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ─── 타입 ────────────────────────────────────────────────────────────────────
export type AgentType = 'parser' | 'nutrition' | 'style' | 'image' | 'url' | 'vision';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// system-rules.json을 런타임에 로드 (빌드 타임 import 대신 fs 사용 — path 안전)
function loadRules() {
  const rulesPath = path.join(process.cwd(), 'harness', 'system-rules.json');
  return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
}

// ─── 1. 글로벌 컨텍스트 주입 ──────────────────────────────────────────────────
/**
 * harness/global-context.md 내용을 문자열로 반환한다.
 * 모든 에이전트의 System Prompt 앞부분에 prepend되어 공통 규칙을 강제한다.
 */
export function injectGlobalContext(): string {
  const contextPath = path.join(process.cwd(), 'harness', 'global-context.md');
  return fs.readFileSync(contextPath, 'utf-8');
}

// ─── 2. 캐시-친화적 시스템 프롬프트 블록 빌더 ─────────────────────────────────
/**
 * Anthropic 프롬프트 캐싱을 위해 system 배열을 두 블록으로 분리한다.
 *  - block[0]: global-context.md (가장 안정적 — 캐시 히트 최대화)
 *  - block[1]: 에이전트별 전문 지시 (상대적으로 안정적)
 *
 * 두 블록 모두 cache_control: ephemeral 을 적용해 5분 캐시 TTL을 유지한다.
 * 가변 데이터(식품/의류 목록, rawText)는 user 메시지에 포함해 캐시를 오염시키지 않는다.
 */
export function buildSystemBlocks(
  agentInstruction: string,
): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: 'text',
      text: injectGlobalContext(),
      cache_control: { type: 'ephemeral' }, // 가장 안정적 — 우선 캐싱
    },
    {
      type: 'text',
      text: agentInstruction,
      cache_control: { type: 'ephemeral' }, // 에이전트 지시도 캐싱
    },
  ];
}

// ─── 3. 입력 검증 ─────────────────────────────────────────────────────────────
/**
 * 에이전트 타입별로 요청 페이로드가 올바른 구조인지 검증한다.
 */
export function validateInput(
  payload: Record<string, unknown>,
  agentType: AgentType,
): ValidationResult {
  switch (agentType) {
    case 'parser':
      if (!payload.rawText || typeof payload.rawText !== 'string') {
        return { valid: false, error: 'parser-agent: rawText(string) 필드가 필요합니다.' };
      }
      if ((payload.rawText as string).trim().length === 0) {
        return { valid: false, error: 'parser-agent: rawText가 비어 있습니다.' };
      }
      break;

    case 'nutrition':
      // nutrition-agent는 내부적으로 foodItems를 주입하므로 별도 입력 불필요
      // 선택적으로 날짜 오버라이드 허용
      break;

    case 'style':
      // style-agent는 날씨 정보를 선택적으로 받는다
      if (payload.weather !== undefined && typeof payload.weather !== 'string') {
        return { valid: false, error: 'style-agent: weather는 문자열이어야 합니다.' };
      }
      break;
  }

  return { valid: true };
}

// ─── 4. 출력 검증 ─────────────────────────────────────────────────────────────
/**
 * LLM 응답 JSON이 system-rules.json에 정의된 출력 스키마를 만족하는지 확인한다.
 * 위반 시 400 에러로 이어진다.
 */
export function validateOutput(
  response: unknown,
  agentType: AgentType,
): ValidationResult {
  const rules = loadRules();
  const schema = rules.outputSchema;

  if (typeof response !== 'object' || response === null) {
    return { valid: false, error: '응답이 JSON 객체가 아닙니다.' };
  }

  const res = response as Record<string, unknown>;

  // 에러 응답은 항상 통과
  if ('error' in res) return { valid: true };

  switch (agentType) {
    case 'parser': {
      const required: string[] = schema.parserAgent.required;
      for (const field of required) {
        if (!(field in res)) {
          return { valid: false, error: `parser 응답에 필수 필드 '${field}'가 없습니다.` };
        }
      }
      break;
    }

    case 'nutrition': {
      const required: string[] = schema.nutritionAgent.required;
      for (const field of required) {
        if (!(field in res)) {
          return { valid: false, error: `nutrition 응답에 필수 필드 '${field}'가 없습니다.` };
        }
      }
      break;
    }

    case 'style': {
      const required: string[] = schema.styleAgent.required;
      for (const field of required) {
        if (!(field in res)) {
          return { valid: false, error: `style 응답에 필수 필드 '${field}'가 없습니다.` };
        }
      }
      break;
    }

    case 'vision': {
      const required: string[] = schema.visionAgent.required;
      for (const field of required) {
        if (!(field in res)) {
          return { valid: false, error: `vision 응답에 필수 필드 '${field}'가 없습니다.` };
        }
      }
      break;
    }
  }

  // UX 금지어 검사 (문자열 직렬화 후 패턴 탐지)
  const serialized = JSON.stringify(response);
  const forbidden: string[] = rules.uxTerms.forbidden;
  for (const term of forbidden) {
    if (serialized.includes(term)) {
      return {
        valid: false,
        error: `UX 규칙 위반: 금지어 '${term}'가 응답에 포함되어 있습니다. '${rules.uxTerms.replacements[term]}'으로 대체하세요.`,
      };
    }
  }

  return { valid: true };
}

// ─── 5. JSON 파싱 헬퍼 ───────────────────────────────────────────────────────
/**
 * LLM이 반환한 텍스트에서 JSON을 추출한다.
 * 코드 블록(```json ... ```)이 있을 경우 벗겨내고 파싱한다.
 */
export function extractJSON(text: string): unknown {
  // 코드 블록 제거
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();

  // 첫 번째 { ... } 또는 [ ... ] 블록만 추출
  const objMatch  = raw.match(/(\{[\s\S]*\})/);
  const arrMatch  = raw.match(/(\[[\s\S]*\])/);
  const jsonStr   = objMatch?.[1] ?? arrMatch?.[1] ?? raw;

  return JSON.parse(jsonStr);
}
