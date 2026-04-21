import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import Providers from "@/components/layout/Providers";
import OnboardingModal from "@/components/layout/OnboardingModal";
import ScrollToTop from "@/components/layout/ScrollToTop";
import CommandPalette from "@/components/CommandPalette";
import GlobalRecipeModal from "@/components/GlobalRecipeModal";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
};

export const metadata: Metadata = {
  title: "NEMOA - 일상을 반듯하게 모으다",
  description: "스마트 냉장고와 옷장을 하나로, AI 라이프스타일 비서 네모아",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NEMOA",
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
      <body className="min-h-full flex flex-col bg-gray-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-xl focus:bg-brand-primary focus:text-white focus:text-xs focus:font-semibold"
        >
          본문으로 건너뛰기
        </a>
        <Providers>
          <main id="main-content" className="flex-1 pb-20 max-w-md mx-auto w-full">
            {children}
          </main>
          <ScrollToTop />
          <BottomNav />
          <OnboardingModal />
          <CommandPalette />
          <GlobalRecipeModal />
        </Providers>
      </body>
    </html>
  );
}
