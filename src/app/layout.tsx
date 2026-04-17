import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAdd from "@/components/layout/FloatingAdd";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Cart Plus",
  description: "라이프스타일 쇼핑 관리 앱",
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
        <main className="flex-1 pb-20 max-w-md mx-auto w-full">
          {children}
        </main>
        <FloatingAdd />
        <BottomNav />
      </body>
    </html>
  );
}
