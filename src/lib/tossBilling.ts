/**
 * 토스페이먼츠 빌링(정기결제) API 래퍼.
 *
 * 흐름:
 *   1. 클라이언트: payment.requestBillingAuth() → 카드 등록 → successUrl로 authKey 전달
 *   2. 서버: issueBillingKey(authKey, customerKey) → billingKey 발급(카드 저장)
 *   3. 서버: chargeBilling(billingKey, ...) → 첫 결제 즉시 청구
 *   4. 매 주기(월/년)마다 크론이 chargeBilling() 재호출 → 자동 갱신
 *
 * 가격은 여기 한 곳(PLAN_PRICING)에서만 정의 — 클라이언트가 보낸 금액을 그대로
 * 믿지 않고 서버가 plan·billingCycle로 재계산해서 위변조를 막는다.
 */

import type { PlanTier } from '@/types';

export type BillingCycle = 'monthly' | 'yearly';

export const PLAN_PRICING: Record<Exclude<PlanTier, 'free'>, Record<BillingCycle, number>> = {
  pro_lite: { monthly: 4900, yearly: 49000 },
  pro_max:  { monthly: 9900, yearly: 99000 },
};

export function planAmount(tier: Exclude<PlanTier, 'free'>, cycle: BillingCycle): number {
  return PLAN_PRICING[tier][cycle];
}

export function planOrderName(tier: Exclude<PlanTier, 'free'>, cycle: BillingCycle): string {
  const label = tier === 'pro_lite' ? 'Pro Lite' : 'Pro Max';
  return `NEMOA ${label} (${cycle === 'yearly' ? '연간' : '월간'})`;
}

const TOSS_API = 'https://api.tosspayments.com/v1';

function authHeader(): string {
  const secret = process.env.TOSS_SECRET_KEY ?? '';
  return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
}

export interface TossBillingKeyResult {
  billingKey: string;
  customerKey: string;
  [key: string]: unknown;
}

/** authKey(카드 등록 성공 후 발급) → billingKey(정기 청구용 키) 교환 */
export async function issueBillingKey(authKey: string, customerKey: string): Promise<
  { ok: true; data: TossBillingKeyResult } | { ok: false; status: number; error: string }
> {
  const res = await fetch(`${TOSS_API}/billing/authorizations/issue`, {
    method:  'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body:    JSON.stringify({ authKey, customerKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, status: res.status, error: data.message ?? data.code ?? '빌링키 발급 실패' };
  }
  return { ok: true, data };
}

export interface TossChargeResult {
  paymentKey: string;
  orderId:    string;
  totalAmount: number;
  [key: string]: unknown;
}

/** billingKey로 실제 금액을 청구(최초 결제·정기 갱신 공용) */
export async function chargeBilling(params: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}): Promise<{ ok: true; data: TossChargeResult } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${TOSS_API}/billing/${params.billingKey}`, {
    method:  'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount:      params.amount,
      orderId:     params.orderId,
      orderName:   params.orderName,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, status: res.status, error: data.message ?? data.code ?? '결제 청구 실패' };
  }
  return { ok: true, data };
}

/** 다음 결제 주기 종료 시각 계산 (달력 기준 — 매달 같은 날짜, 말일 보정) */
export function nextPeriodEnd(from: Date, cycle: BillingCycle): string {
  const d = new Date(from);
  if (cycle === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    const day = d.getDate();
    d.setMonth(d.getMonth() + 1);
    // 말일 보정 — 예: 1/31 + 1개월이 3/3이 되는 것 방지
    if (d.getDate() !== day) d.setDate(0);
  }
  return d.toISOString();
}
