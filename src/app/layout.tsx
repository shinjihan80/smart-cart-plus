import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import Providers from "@/components/layout/Providers";
import OnboardingModal from "@/components/layout/OnboardingModal";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ConsentGate from "@/components/layout/ConsentGate";
import SwRegister from "@/components/layout/SwRegister";
import ErrorCapture from "@/components/layout/ErrorCapture";
import CommandPalette from "@/components/CommandPalette";
import GlobalRecipeModal from "@/components/GlobalRecipeModal";
import AnalyticsGate from "@/components/layout/AnalyticsGate";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 사용자 핀치 줌·시스템 글자 크기 설정 허용 (WCAG 1.4.4)
  // maximumScale·userScalable 명시 안 함 → 브라우저 기본값 (사용자 zoom 가능)
  viewportFit: "cover",
  themeColor: "#4F46E5",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  "NEMOA - 일상을 반듯하게 모으다",
    template: "%s · NEMOA",
  },
  description: "스마트 냉장고와 옷장을 하나로. AI 라이프스타일 비서 네모아가 식품 보관·코디·재구매·레시피·제철·날씨까지 챙겨드려요.",
  keywords: ["NEMOA", "네모아", "스마트 냉장고", "스마트 옷장", "식품 관리", "옷장 관리", "레시피 추천", "제철 식재료", "AI 라이프스타일"],
  authors: [{ name: "NEMOA Team" }],
  creator: "NEMOA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEMOA",
    startupImage: [
      // iPhone 16 Pro Max (1320×2868)
      { url: "/splashes/splash-1320x2868.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 16 / 15 Pro (1179×2556)
      { url: "/splashes/splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone SE (750×1334)
      { url: "/splashes/splash-750x1334.png",  media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },
  icons: {
    apple: [
      { url: "/icon-180.png", sizes: "180x180" },
      { url: "/icon-167.png", sizes: "167x167" },
      { url: "/icon-152.png", sizes: "152x152" },
    ],
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    type:        "website",
    locale:      "ko_KR",
    url:         SITE_URL,
    siteName:    "NEMOA",
    title:       "NEMOA - 일상을 반듯하게 모으다",
    description: "스마트 냉장고와 옷장을 하나로. AI 라이프스타일 비서 네모아.",
    images: [
      {
        url:    "/icon.svg",
        width:  512,
        height: 512,
        alt:    "NEMOA 로고",
      },
    ],
  },
  twitter: {
    card:        "summary",
    title:       "NEMOA - 일상을 반듯하게 모으다",
    description: "스마트 냉장고와 옷장을 하나로. AI 라이프스타일 비서 네모아.",
    images:      ["/icon.svg"],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:  true,
      follow: true,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-xl focus:bg-brand-primary focus:text-white focus:text-xs focus:font-semibold"
        >
          본문으로 건너뛰기
        </a>
        <Providers>
          <ConsentGate>
            <main id="main-content" className="flex-1 max-w-md sm:max-w-lg mx-auto w-full" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
              {children}
            </main>
            <ScrollToTop />
            <BottomNav />
            <OnboardingModal />
            <CommandPalette />
            <GlobalRecipeModal />
            <SwRegister />
            <ErrorCapture />
            <AnalyticsGate />
          </ConsentGate>
        </Providers>
      </body>
    </html>
  );
}
