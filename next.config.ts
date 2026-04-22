import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
