import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAdd from "@/components/layout/FloatingAdd";
import Providers from "@/components/layout/Providers";
import OnboardingModal from "@/components/layout/OnboardingModal";
import ScrollToTop from "@/components/layout/ScrollToTop";

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
        <Providers>
          <main className="flex-1 pb-20 max-w-md mx-auto w-full">
            {children}
          </main>
          <FloatingAdd />
          <ScrollToTop />
          <BottomNav />
          <OnboardingModal />
        </Providers>
      </body>
    </html>
  );
}
