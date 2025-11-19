import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "竹師教育學院空間借用系統",
  description: "竹師教育學院空間借用系統 - 線上預約教室、會議室等各類空間，輕鬆管理您的借用申請",
  openGraph: {
    title: "竹師教育學院空間借用系統",
    description: "竹師教育學院空間借用系統 - 線上預約教室、會議室等各類空間，輕鬆管理您的借用申請",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "竹師教育學院空間借用系統",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "竹師教育學院空間借用系統",
    description: "竹師教育學院空間借用系統 - 線上預約教室、會議室等各類空間，輕鬆管理您的借用申請",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
