import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 홈 폴더(/Users/sinji)에 남아있는 별도 package-lock.json 때문에 Next.js가
  // 워크스페이스 루트를 잘못 추론해 홈 폴더 전체를 감시하는 것을 방지.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.coupangcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.naver.net',
      },
    ],
  },
  async headers() {
    return [
      {
        // Service Worker는 캐시 금지 — 업데이트가 즉시 반영되도록
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
