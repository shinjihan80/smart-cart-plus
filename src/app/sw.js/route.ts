import { NextResponse } from 'next/server';

/**
 * public/sw.js의 VERSION이 'nemoa-v1.5.6'에 고정된 채 수십 번의 배포를
 * 거치는 동안 한 번도 안 바뀌었다(P1-35, C5 발견) — activate 단계의
 * "버전 바뀌면 이전 캐시 삭제" 로직은 SHELL/ASSETS 캐시 이름이 실제로
 * 달라져야만 실행되는데, VERSION이 고정이라 매 배포마다 새 정적 자산이
 * 같은 캐시에 계속 추가되기만 하고 옛 자산은 전혀 안 지워졌다(실측
 * 오리진 저장공간의 99.9%를 SW 캐시가 차지 — 브라우저 저장공간 축출
 * 1순위가 되는 구조). 정적 public 파일 대신 Route Handler로 바꿔
 * Vercel이 배포마다 자동으로 주입하는 커밋 SHA로 VERSION을 매 배포
 * 고유값으로 만든다 — 더 이상 수동으로 버전 문자열을 올릴 필요가 없다.
 */
const VERSION = `nemoa-v${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'dev'}`;

const SW_BODY = `
const VERSION  = '${VERSION}';
const SHELL    = \`nemoa-shell-\${VERSION}\`;
const ASSETS   = \`nemoa-assets-\${VERSION}\`;
const OFFLINE_URL = '/offline.html';

// 최소 셸 — 온보딩·UI·manifest. 앱 라우트는 첫 방문 시 캐시에 추가됨.
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== ASSETS)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 외부 도메인 & API 라우트는 SW 우회
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // HTML 네비게이션 — network-first
  const isHtml = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
  if (isHtml) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 정적 자산 — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(SHELL);
    cache.put(req, fresh.clone()).catch(() => {});
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('오프라인', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(req) {
  const cache  = await caches.open(ASSETS);
  const cached = await cache.match(req);
  const netPromise = fetch(req)
    .then((res) => {
      // opaque·에러 응답은 캐시 안 함
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);
  return cached || (await netPromise) || new Response('', { status: 504 });
}

// 수동 업데이트 트리거
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 서버 Push 수신 → 알림 표시
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? 'NEMOA';
  const body  = data.body  ?? '';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      tag:     data.tag ?? 'nemoa-push',
      vibrate: [100, 50, 100],
      data:    { url: data.url ?? '/' },
    }),
  );
});

// 알림 클릭 → 앱 포커스 또는 새 탭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const found = clients.find((c) => c.url.includes(self.location.origin));
      if (found) return found.focus();
      return self.clients.openWindow(url);
    }),
  );
});
`;

export async function GET() {
  return new NextResponse(SW_BODY, {
    headers: {
      'Content-Type':  'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
