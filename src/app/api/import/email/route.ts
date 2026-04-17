/**
 * email-import — 이메일 기반 구매 내역 자동 가져오기 (Phase 2 예정)
 *
 * 플로우:
 *   1. 사용자가 Gmail OAuth 인증
 *   2. 쿠팡/네이버/마켓컬리 주문확인 이메일 검색
 *   3. Claude AI로 이메일 본문 파싱 → CartItem[] 변환
 *   4. 중복 방지 후 자동 등록
 *
 * 지원 예정 쇼핑몰:
 *   - 쿠팡: "쿠팡 주문확인" 이메일
 *   - 네이버: "네이버페이 결제완료" 이메일
 *   - 마켓컬리: "마켓컬리 주문접수" 이메일
 *   - 무신사: "무신사 주문확인" 이메일
 *
 * 현재 상태: 엔드포인트 구조만 준비 (Gmail API 연동 전)
 */
import { NextRequest, NextResponse } from 'next/server';

// 이메일에서 추출할 주문 정보 타입
interface EmailOrderItem {
  name:     string;
  category: string;
  store:    string;
  price:    number;
  date:     string;
}

// 쇼핑몰별 이메일 파싱 패턴 (추후 Claude AI로 대체)
const MALL_PATTERNS: Record<string, { sender: string; subjectKeyword: string }> = {
  coupang: { sender: 'coupang.com',    subjectKeyword: '주문확인' },
  naver:   { sender: 'naverpay',       subjectKeyword: '결제완료' },
  kurly:   { sender: 'kurly.com',      subjectKeyword: '주문접수' },
  musinsa: { sender: 'musinsa.com',    subjectKeyword: '주문확인' },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Phase 2: Gmail OAuth 토큰으로 이메일 검색
    // const accessToken = body.accessToken as string;
    // const emails = await fetchGmailOrders(accessToken, MALL_PATTERNS);
    // const items = await parseEmailsWithAI(emails);

    // 현재: Mock 응답
    return NextResponse.json({
      status: 'not_implemented',
      message: '이메일 파싱 기능은 준비 중입니다. Gmail OAuth 연동이 필요합니다.',
      supportedMalls: Object.keys(MALL_PATTERNS),
      requiredScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `email-import 실패: ${message}` }, { status: 500 });
  }
}
