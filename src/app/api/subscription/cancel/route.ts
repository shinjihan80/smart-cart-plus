/**
 * 구독 해지 — 즉시 환불하지 않고 "다음 결제부터 청구 안 함"으로 처리.
 * currentPeriodEnd까지는 계속 Pro 유지 (이미 낸 만큼은 그대로 씀).
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { subscriptionStore } from '@/lib/subscriptionStore';

interface RequestBody {
  deviceId?: unknown;
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'billing');
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const deviceId = body.deviceId;
  if (typeof deviceId !== 'string' || !deviceId) {
    return NextResponse.json({ error: 'deviceId가 필요합니다.' }, { status: 400 });
  }

  const record = await subscriptionStore.get(deviceId);
  if (!record) {
    return NextResponse.json({ error: '구독 내역을 찾을 수 없어요.' }, { status: 404 });
  }

  await subscriptionStore.set(deviceId, { ...record, status: 'canceled' });

  return NextResponse.json({ ok: true, activeUntil: record.currentPeriodEnd });
}
