import { NextRequest, NextResponse } from 'next/server';

const TOSS_SECRET = process.env.TOSS_SECRET_KEY ?? '';
const TOSS_API    = 'https://api.tosspayments.com/v1';

export async function POST(req: NextRequest) {
  if (!TOSS_SECRET) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  }

  const { paymentKey, orderId, amount } = await req.json() as {
    paymentKey: string;
    orderId:    string;
    amount:     number;
  };

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  const basic = Buffer.from(`${TOSS_SECRET}:`).toString('base64');
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.code, message: data.message }, { status: res.status });
  }

  // 결제 완료 — orderId 패턴으로 플랜 추출
  // orderId 형식: nemoa-{userId}-{planTier}-{timestamp}
  const parts   = orderId.split('-');
  const planTier = parts[2] ?? 'pro_lite'; // 'pro_lite' | 'pro_max'

  return NextResponse.json({ ok: true, planTier, payment: data });
}
