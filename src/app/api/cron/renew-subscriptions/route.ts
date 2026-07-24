/**
 * 정기결제 갱신 크론 — Vercel Cron이 매일 호출한다 (vercel.json 참조).
 *
 * 안전장치:
 *   - CRON_SECRET 헤더 검증 없이는 아무도 못 부름 (외부에서 직접 호출해 임의 청구 방지)
 *   - currentPeriodEnd가 아직 안 지난 구독은 건드리지 않음 (자연스러운 idempotency —
 *     같은 날 두 번 실행돼도 이미 갱신된 건 다시 안 걸림)
 *   - orderId를 주기 종료일 기준으로 결정적으로 생성해, 혹시 같은 주기에 중복 호출되더라도
 *     토스 쪽에서 중복 orderId로 걸러질 여지를 둠
 *   - 연속 3회 청구 실패 시 무료로 강등하고 더 이상 재시도하지 않음
 *
 * TOSS_SECRET_KEY 미설정 시 안전하게 아무 것도 하지 않고 종료.
 */
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionStore } from '@/lib/subscriptionStore';
import { chargeBilling, planAmount, planOrderName, nextPeriodEnd } from '@/lib/tossBilling';

const TOSS_SECRET   = process.env.TOSS_SECRET_KEY ?? '';
const CRON_SECRET   = process.env.CRON_SECRET ?? '';
const DOWNGRADE_AFTER_FAILURES = 3;

function periodDateTag(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 붙여 보낸다.
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!TOSS_SECRET) {
    return NextResponse.json({ ok: true, skipped: 'payments_not_configured', processed: 0 });
  }

  const deviceIds = await subscriptionStore.listActiveDeviceIds();
  const now = Date.now();

  let renewed = 0;
  let failed  = 0;
  let downgraded = 0;
  let skipped = 0;

  for (const deviceId of deviceIds) {
    const record = await subscriptionStore.get(deviceId);
    if (!record) continue;

    // 아직 이번 주기가 안 끝났으면 건드리지 않음 — 자연 idempotency
    if (new Date(record.currentPeriodEnd).getTime() > now) {
      skipped++;
      continue;
    }

    const orderId = `renew-${deviceId}-${record.tier}-${periodDateTag(record.currentPeriodEnd)}`;
    const amount    = planAmount(record.tier, record.billingCycle);
    const orderName = planOrderName(record.tier, record.billingCycle);

    const charged = await chargeBilling({
      billingKey:  record.billingKey,
      customerKey: record.customerKey,
      amount,
      orderId,
      orderName,
    });

    if (charged.ok) {
      await subscriptionStore.set(deviceId, {
        ...record,
        status:           'active',
        currentPeriodEnd: nextPeriodEnd(new Date(), record.billingCycle),
        lastPaymentAt:    new Date().toISOString(),
        lastOrderId:      orderId,
        failedAttempts:   0,
      });
      renewed++;
    } else {
      const failedAttempts = record.failedAttempts + 1;
      if (failedAttempts >= DOWNGRADE_AFTER_FAILURES) {
        await subscriptionStore.set(deviceId, { ...record, status: 'canceled', failedAttempts });
        downgraded++;
      } else {
        await subscriptionStore.set(deviceId, { ...record, status: 'past_due', failedAttempts });
        failed++;
      }
    }
  }

  return NextResponse.json({ ok: true, processed: deviceIds.length, renewed, failed, downgraded, skipped });
}
