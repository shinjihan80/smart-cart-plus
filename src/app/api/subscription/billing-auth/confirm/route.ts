/**
 * 빌링키 발급 + 첫 결제 청구.
 *
 * 클라이언트가 payment.requestBillingAuth()로 카드 등록을 마치면 successUrl로
 * { authKey, customerKey }를 받는다. 이 라우트가:
 *   1. authKey → billingKey 교환 (카드 저장)
 *   2. billingKey로 이번 주기 금액 즉시 청구
 *   3. 둘 다 성공해야만 구독을 서버에 기록
 *
 * 금액은 클라이언트 입력을 신뢰하지 않고 plan·billingCycle로 서버가 재계산한다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';
import { issueBillingKey, chargeBilling, planAmount, planOrderName, nextPeriodEnd, type BillingCycle } from '@/lib/tossBilling';
import { subscriptionStore, type SubscriptionRecord } from '@/lib/subscriptionStore';
import type { PlanTier } from '@/types';

const TOSS_SECRET = process.env.TOSS_SECRET_KEY ?? '';

interface RequestBody {
  authKey?:      unknown;
  customerKey?:  unknown;
  plan?:         unknown;
  billingCycle?: unknown;
}

export async function POST(req: NextRequest) {
  if (!TOSS_SECRET) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  }

  const limited = await applyRateLimit(req, 'billing');
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const { authKey, customerKey, plan, billingCycle } = body;

  if (typeof authKey !== 'string' || !authKey) {
    return NextResponse.json({ error: 'authKey가 필요합니다.' }, { status: 400 });
  }
  if (typeof customerKey !== 'string' || !customerKey) {
    return NextResponse.json({ error: 'customerKey가 필요합니다.' }, { status: 400 });
  }
  if (plan !== 'pro_lite' && plan !== 'pro_max') {
    return NextResponse.json({ error: 'plan은 pro_lite 또는 pro_max여야 합니다.' }, { status: 400 });
  }
  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    return NextResponse.json({ error: 'billingCycle은 monthly 또는 yearly여야 합니다.' }, { status: 400 });
  }

  // Step 1: 빌링키 발급
  const issued = await issueBillingKey(authKey, customerKey);
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: 400 });
  }
  const billingKey = issued.data.billingKey;

  // Step 2: 이번 주기 금액 즉시 청구
  const amount    = planAmount(plan as Exclude<PlanTier, 'free'>, billingCycle as BillingCycle);
  const orderName = planOrderName(plan as Exclude<PlanTier, 'free'>, billingCycle as BillingCycle);
  const orderId   = `nemoa-${customerKey}-${plan}-${Date.now()}`;

  const charged = await chargeBilling({ billingKey, customerKey, amount, orderId, orderName });
  if (!charged.ok) {
    // 카드는 등록됐지만 결제가 거절된 경우 — 구독을 만들지 않는다 (카드 재시도는 사용자가 다시 등록)
    return NextResponse.json({ error: charged.error }, { status: 400 });
  }

  // Step 3: 구독 기록
  const record: SubscriptionRecord = {
    tier:             plan as Exclude<PlanTier, 'free'>,
    billingCycle:     billingCycle as BillingCycle,
    customerKey,
    billingKey,
    status:           'active',
    currentPeriodEnd: nextPeriodEnd(new Date(), billingCycle as BillingCycle),
    lastPaymentAt:    new Date().toISOString(),
    lastOrderId:      orderId,
    failedAttempts:   0,
  };
  await subscriptionStore.set(customerKey, record);

  return NextResponse.json({ ok: true, tier: record.tier, currentPeriodEnd: record.currentPeriodEnd });
}
