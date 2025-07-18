import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { AuthGuard } from '@/components/auth';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "落雪公会管理系统 - Pokemon Snowfall Guild",
  description: "落雪公会宝可梦公会管理系统，提供会员管理、数据统计等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MessageProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </MessageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
