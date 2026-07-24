/**
 * 현재 디바이스의 구독 상태 조회 — usePlan()이 부팅 시 이걸로 서버와 동기화한다.
 * 구독 기록이 없거나 만료됐으면 무료(free)로 응답한다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { subscriptionStore } from '@/lib/subscriptionStore';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'billing');
  if (limited) return limited;

  const deviceId = req.nextUrl.searchParams.get('deviceId');
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId 쿼리 파라미터가 필요합니다.' }, { status: 400 });
  }

  const record = await subscriptionStore.get(deviceId);
  if (!record) {
    return NextResponse.json({ tier: 'free' as const });
  }

  const expired = new Date(record.currentPeriodEnd).getTime() < Date.now();
  if (expired && record.status !== 'active') {
    // 갱신 실패가 누적돼 이미 만료된 상태 — 무료로 응답 (크론이 downgrade 처리)
    return NextResponse.json({ tier: 'free' as const });
  }

  return NextResponse.json({
    tier:             record.tier,
    status:           record.status,
    billingCycle:     record.billingCycle,
    currentPeriodEnd: record.currentPeriodEnd,
  });
}
