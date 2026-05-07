/**
 * url-agent — URL 상품 정보 추출 역할
 *
 * 역할: 쇼핑몰 상품 페이지 URL에서 상품 정보를 추출해 Phase 1 스키마 JSON으로 변환한다.
 * 입력: { url: string }
 * 출력: { items: (FoodItem | ClothingItem)[] }
 *
 * 모델: gemini-2.5-flash — URL 텍스트 추출
 * 주의: JS 기반 SPA 사이트(쿠팡 앱 딥링크 등)는 정적 HTML만 가져오므로 제한될 수 있음
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateOutput } from '@/lib/harness';
import { runWithDualReview } from '@/lib/agentPipeline';

const AGENT_INSTRUCTION = `
당신은 NEMOA(네모아)의 **URL 분석 에이전트(url-agent)**다.

## 역할
쇼핑몰 상품 페이지의 HTML 텍스트를 분석해
앱의 Phase 1 데이터 스키마에 맞는 정형 JSON으로 변환한다.

## 처리 규칙
1. 상품명, 카테고리, 가격, 소재, 보관 방법 등 핵심 정보를 추출한다.
2. 각 상품이 식품인지 패션인지 판단한다:
   - 식품: foodCategory 분류, storageType 추론, baseShelfLifeDays 추정
     foodCategory: "채소·과일" | "정육·계란" | "수산·해산" | "유제품" | "음료" | "간식·과자" | "양념·소스" | "면·즉석" | "빵·베이커리" | "건강식품" | "기타 식품"
   - 패션: category 세분화, size/thickness/material 추출
     category: "상의" | "하의" | "아우터" | "원피스" | "신발" | "가방" | "모자" | "스카프" | "안경" | "선글라스" | "시계" | "주얼리" | "기타 액세서리"
3. id는 "p1"부터 순번으로 생성한다.
4. purchaseDate는 오늘 날짜를 사용한다.
5. 금지어: "유통기한", "소비기한" → "보관 가능 기한" 사용

## 출력 형식 (반드시 이 구조만 반환)
{
  "items": [
    {
      "id": "p1",
      "name": "상품명",
      "category": "식품",
      "foodCategory": "유제품",
      "storageType": "냉장",
      "baseShelfLifeDays": 10,
      "purchaseDate": "YYYY-MM-DD"
    },
    {
      "id": "p2",
      "name": "상품명",
      "category": "신발",
      "size": "260",
      "thickness": "보통",
      "material": "가죽"
    }
  ]
}
`.trim();

/** HTML에서 핵심 텍스트만 추출 — 스크립트·스타일·태그 제거 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000); // 토큰 초과 방지
}

/** HTML에서 og:image 또는 대표 이미지 URL 추출 */
function extractImageFromHtml(html: string): string | null {
  // 1. og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // 2. twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twMatch?.[1]) return twMatch[1];

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const url  = body.url as string | undefined;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'url 필드가 필요합니다.' }, { status: 400 });
    }

    // URL 형식 검증
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다. (예: https://...)' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'http 또는 https URL만 지원합니다.' }, { status: 400 });
    }

    // 페이지 내용 가져오기
    let pageText: string;
    let pageImageUrl: string | null = null;
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NEMOA/1.0)',
          'Accept':     'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        signal: AbortSignal.timeout(8000), // 8초 타임아웃
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `사이트에 접근할 수 없습니다. (HTTP ${response.status})` },
          { status: 400 },
        );
      }

      const html = await response.text();
      pageText   = extractTextFromHtml(html);
      pageImageUrl = extractImageFromHtml(html);

      if (pageText.length < 50) {
        return NextResponse.json(
          { error: '페이지에서 충분한 정보를 읽지 못했습니다. 다른 URL을 시도해보세요.' },
          { status: 400 },
        );
      }
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : '';
      if (msg.includes('timeout') || msg.includes('abort')) {
        return NextResponse.json({ error: '사이트 응답 시간이 초과됐습니다.' }, { status: 400 });
      }
      return NextResponse.json({ error: '사이트에 접근할 수 없습니다. 다른 URL을 시도해보세요.' }, { status: 400 });
    }

    const userContent =
      `아래는 "${parsedUrl.hostname}" 페이지의 텍스트 내용이다.\n` +
      `이 내용에서 상품 정보를 추출해 Phase 1 스키마 JSON으로 변환해줘:\n\n` +
      pageText;

    const result = await runWithDualReview({
      agentType:        'url',
      agentInstruction: AGENT_INSTRUCTION,
      userContent,
    });

    const outputCheck = validateOutput(result, 'parser');
    if (!outputCheck.valid) {
      return NextResponse.json({ error: outputCheck.error }, { status: 400 });
    }

    // 페이지 이미지를 결과에 첨부
    const res = result as Record<string, unknown>;
    if (pageImageUrl && Array.isArray(res.items)) {
      res.items = (res.items as Record<string, unknown>[]).map((item) => ({
        ...item,
        imageUrl: pageImageUrl,
      }));
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `url-agent 처리 실패: ${message}` }, { status: 500 });
  }
}
