import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAdd from "@/components/layout/FloatingAdd";
import PageTransition from "@/components/layout/PageTransition";
import Providers from "@/components/layout/Providers";
import OnboardingModal from "@/components/layout/OnboardingModal";

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
  title: "Smart Cart Plus",
  description: "라이프스타일 AI 매니저",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartCart",
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
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>
          <main className="flex-1 pb-20 max-w-md mx-auto w-full">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <FloatingAdd />
          <BottomNav />
          <OnboardingModal />
        </Providers>
      </body>
    </html>
  );
}
