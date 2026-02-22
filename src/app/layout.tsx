import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "맛집 챗지 - AI 맛집 추천",
  description: "AI와 함께하는 대전 맛집 찾기 & 음식 추천 서비스. 내 주변 맛집을 지도로 확인하고 AI 추천을 받아보세요.",
  keywords: ["맛집", "대전 맛집", "AI 추천", "음식점", "주변 음식점", "맛집 지도"],
  authors: [{ name: "맛집 챗지" }],
  robots: "index, follow",
  openGraph: {
    title: "맛집 챗지 - AI 맛집 추천",
    description: "AI와 함께하는 대전 맛집 찾기 & 음식 추천",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#facc15", // 모바일 브라우저 상단 색상
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <Navbar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
