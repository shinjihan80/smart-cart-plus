/**
 * NEMOA Service Worker (v1.5)
 *
 * 전략
 *  - API 호출 (/api/*): SW 건너뜀 — Anthropic 스트리밍·캐시 무의미
 *  - HTML 페이지: network-first → 실패 시 캐시 → 그래도 실패면 /offline.html
 *  - 정적 자산 (_next/static, /icon.svg, /manifest.json): stale-while-revalidate
 *  - 버전 바뀌면 이전 캐시 즉시 삭제 (activate 단계)
 *
 * 로컬 전용 앱 특성상 네트워크 나가도 대부분 동작 — 페이지 셸만 살아있으면 OK.
 */

const VERSION  = 'nemoa-v1.5.0';
const SHELL    = `nemoa-shell-${VERSION}`;
const ASSETS   = `nemoa-assets-${VERSION}`;
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

// 수동 업데이트 트리거 (설정 UI에서 호출 예정)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
